import json
import os
import re
from datetime import datetime, timedelta
from functools import lru_cache

from sqlalchemy.exc import SQLAlchemyError
from openai import OpenAI
from app import models


# =========================================================
# 🧩 OpenAI 클라이언트 초기화
# =========================================================
# @lru_cache()
# def get_openai_client():
#     return OpenAI(
#         api_key=os.getenv("OPENAI_API_KEY"),
#         base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
#     )


# =========================================================
# 🧠 공통 유틸: OpenAI 요청 및 JSON 파서
# =========================================================
def ask_openai(prompt: str, system: str = None, model: str = "gpt-4o-mini") -> str:
    """OpenAI ChatCompletion 요청 (단일 응답 반환)"""
    client = get_openai_client()
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    try:
        res = client.chat.completions.create(model=model, messages=messages)
        return res.choices[0].message.content.strip()
    except Exception as e:
        return f"❌ OpenAI 요청 실패: {e}"


def safe_json_parse(content: str):
    """코드블록(````json```) 제거 후 안전하게 JSON 파싱"""
    try:
        content = re.sub(r"```json|```", "", content.strip())
        return json.loads(content)
    except json.JSONDecodeError:
        return {}


# =========================================================
# ✅ 자연어 → Task 자동 생성
# =========================================================
def generate_task_from_prompt(db, prompt: str):
    """자연어 입력 → Task 속성 추출 후 DB에 저장"""
    system_prompt = (
        "너는 프로젝트 관리 도우미야. "
        "입력된 문장에서 업무 제목(title), 마감일(due_date), 우선순위(priority)을 JSON 형태로 추출해. "
        "마감일이 명시되지 않으면 오늘로부터 3일 후로 해줘."
    )

    content = ask_openai(prompt, system=system_prompt)
    parsed = safe_json_parse(content)

    # 마감일 처리
    raw_date = parsed.get("due_date")
    try:
        due_date = datetime.fromisoformat(raw_date) if isinstance(raw_date, str) else None
    except ValueError:
        due_date = None
    if not due_date:
        due_date = datetime.now() + timedelta(days=3)

    task = models.Task(
        title=parsed.get("title", "새로운 업무"),
        due_date=due_date,
        priority=parsed.get("priority", "MEDIUM"),
    )

    try:
        db.add(task)
        db.commit()
        db.refresh(task)
        return {
            "task_id": task.task_id,
            "title": task.title,
            "due_date": str(task.due_date),
            "priority": task.priority
        }
    except SQLAlchemyError as e:
        db.rollback()
        return {"error": f"DB 오류 발생: {e}"}


# =========================================================
# ✅ 단일 프로젝트 요약
# =========================================================
def summarize_project(db, project_id: int):
    """프로젝트 진행상황 요약"""
    project = db.get(models.Project, project_id)
    if not project:
        return {"error": f"프로젝트 {project_id}를 찾을 수 없습니다."}

    tasks = db.query(models.Task).filter(models.Task.project_id == project_id).all()
    total = len(tasks)
    done = len([t for t in tasks if getattr(t, "status", "") == "DONE"])
    progress = (done / total * 100) if total else 0

    summary_prompt = (
        f"프로젝트 이름: {project.project_name}\n"
        f"완료율: {progress:.1f}%\n"
        f"주요 업무: {[t.title for t in tasks[:5]]}\n"
        "위 내용을 기반으로 프로젝트 현황을 한국어로 간단히 요약해줘."
    )

    summary = ask_openai(summary_prompt)

    return {
        "project_id": project_id,
        "project_name": project.project_name,
        "progress": progress,
        "summary": summary
    }


# =========================================================
# ✅ 전체 프로젝트 요약
# =========================================================
def summarize_all_projects(db):
    """전체 프로젝트 진행현황 요약"""
    projects = db.query(models.Project).all()
    if not projects:
        return {"summary": "등록된 프로젝트가 없습니다."}

    project_data = []
    for p in projects:
        tasks = db.query(models.Task).filter(models.Task.project_id == p.project_id).all()
        total = len(tasks)
        done = len([t for t in tasks if getattr(t, "status", "") == "DONE"])
        progress = (done / total * 100) if total else 0
        project_data.append({
            "project_name": p.project_name,
            "status": getattr(p.status, "name", str(p.status)),
            "progress": f"{progress:.1f}%",
            "total_tasks": total,
            "done_tasks": done,
        })

    prompt = (
        "다음은 전체 프로젝트 현황이야:\n"
        f"{json.dumps(project_data, ensure_ascii=False)}\n"
        "전체 진행 상황을 간단히 요약하고, 완료율이 낮거나 지연된 항목이 있다면 언급해줘."
    )

    summary = ask_openai(prompt)
    return {"summary": summary, "project_overview": project_data}


# =========================================================
# ✅ 전역 AI 명령 실행기
# =========================================================
def run_ai_command(db, prompt: str):
    """자연어 명령 → 명령 분류 및 실행"""
    classify_prompt = (
        "아래 명령을 다음 중 하나로 분류하고 JSON으로 반환해줘:\n"
        "- create_task (업무 생성 관련)\n"
        "- summarize_project (특정 프로젝트 번호 포함 시)\n"
        "- summarize_all (전체 프로젝트 요약)\n"
        "JSON 필드: command, project_id\n"
        f"명령: \"{prompt}\""
    )

    content = ask_openai(classify_prompt)
    parsed = safe_json_parse(content)

    command = parsed.get("command", "unknown")
    project_id = parsed.get("project_id")

    # project_id 미인식 시 백업 파싱
    if not project_id:
        match = re.search(r"프로젝트\s*(\d+)", prompt)
        if match:
            project_id = int(match.group(1))

    if command == "create_task":
        return generate_task_from_prompt(db, prompt)
    elif command == "summarize_project" and project_id:
        return summarize_project(db, project_id)
    elif command == "summarize_all":
        return summarize_all_projects(db)
    else:
        return {"message": "명령을 이해하지 못했습니다."}
