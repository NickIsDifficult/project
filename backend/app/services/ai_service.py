# app/services/ai_service.py
import json
import os
from datetime import datetime, timedelta

from openai import OpenAI

from app import models

# =========================================================
# 🧩 OpenAI 클라이언트 초기화
# =========================================================
# client = OpenAI(
#     api_key=os.getenv("OPENAI_API_KEY"),
#     base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
# )


# =========================================================
# 🧩 자연어 → Task 자동 생성
# =========================================================
def generate_task_from_prompt(db, prompt: str):
    """자연어 입력 → Task 속성 추출"""
    system_prompt = (
        "너는 프로젝트 관리 도우미야. 입력된 문장에서 "
        "업무 제목(title), 마감일(due_date), 우선순위(priority)을 JSON 형태로 추출해."
        "마감일이 명시되지 않으면 오늘로부터 3일 후로 해줘."
    )

    res = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
    )

    # ✅ 안전한 JSON 파싱
    try:
        parsed = json.loads(res.choices[0].message.content)
    except Exception:
        try:
            parsed = eval(res.choices[0].message.content)
        except Exception:
            parsed = {}

    # ✅ due_date 문자열 변환 처리
    raw_date = parsed.get("due_date")
    due_date = None
    if isinstance(raw_date, str):
        try:
            due_date = datetime.fromisoformat(raw_date)
        except ValueError:
            due_date = datetime.now() + timedelta(days=3)
    else:
        due_date = datetime.now() + timedelta(days=3)

    task = models.Task(
        title=parsed.get("title", "새로운 업무"),
        due_date=due_date,
        priority=parsed.get("priority", "MEDIUM"),
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return {"result": "ok", "task": task}


# =========================================================
# 🧩 단일 프로젝트 요약
# =========================================================
def summarize_project(db, project_id: int):
    """프로젝트 진행상황 요약"""
    project = db.get(models.Project, project_id)  # ✅ SQLAlchemy 2.x 방식
    if not project:
        return {"error": f"프로젝트 {project_id}를 찾을 수 없습니다."}

    tasks = db.query(models.Task).filter(models.Task.project_id == project_id).all()
    total = len(tasks)
    done = len([t for t in tasks if t.status == "DONE"])
    progress = (done / total * 100) if total else 0

    summary_prompt = f"""
    프로젝트 이름: {project.project_name}
    완료율: {progress:.1f}%
    주요 업무: {[t.title for t in tasks[:5]]}
    요약문을 한국어로 간단히 작성해줘.
    """

    res = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": summary_prompt}],
    )

    return {
        "project_id": project_id,
        "progress": progress,
        "summary": res.choices[0].message.content.strip(),
    }


# =========================================================
# 🧩 전체 프로젝트 요약
# =========================================================
def summarize_all_projects(db):
    """전체 프로젝트 현황을 요약"""
    projects = db.query(models.Project).all()
    if not projects:
        return {"summary": "등록된 프로젝트가 없습니다."}

    project_data = []
    for p in projects:
        tasks = (
            db.query(models.Task).filter(models.Task.project_id == p.project_id).all()
        )
        total = len(tasks)
        done = len([t for t in tasks if getattr(t, "status", "") == "DONE"])
        progress = (done / total * 100) if total else 0

        project_data.append(
            {
                "project_name": p.project_name,
                "status": p.status.name if hasattr(p.status, "name") else str(p.status),
                "progress": f"{progress:.1f}%",
                "total_tasks": total,
                "done_tasks": done,
            }
        )

    summary_prompt = f"""
    다음은 전체 프로젝트 목록과 상태입니다:
    {project_data}

    각 프로젝트의 진행상황을 한글로 간결히 요약해줘.
    완료율이 낮거나 지연된 항목이 있다면 언급해줘.
    """

    res = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": summary_prompt}],
    )

    return {"summary": res.choices[0].message.content.strip()}


# =========================================================
# 🧩 전역 AI 명령 실행기
# =========================================================
def run_ai_command(db, prompt: str):
    """AI 명령 분석 후 적절한 함수 실행"""
    classify_prompt = f"""
    아래 명령을 다음 중 하나로 분류하고 JSON으로 반환해줘:
    - create_task (업무 생성 관련)
    - summarize_project (특정 프로젝트 번호 포함 시)
    - summarize_all (전체 프로젝트 요약)
    JSON 필드: command, project_id
    명령: "{prompt}"
    """

    res = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": classify_prompt}],
    )

    try:
        parsed = json.loads(res.choices[0].message.content)
    except Exception:
        try:
            parsed = eval(res.choices[0].message.content)
        except Exception:
            parsed = {"command": "unknown", "project_id": None}

    command = parsed.get("command", "unknown")
    project_id = parsed.get("project_id")

    if command == "create_task":
        return generate_task_from_prompt(db, prompt)
    elif command == "summarize_project" and project_id:
        return summarize_project(db, project_id)
    elif command == "summarize_all":
        return summarize_all_projects(db)
    else:
        return {"message": "명령을 이해하지 못했습니다."}
