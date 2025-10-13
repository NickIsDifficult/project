from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from db import get_connection

router = APIRouter()

# ✅ 프로젝트 목록 조회
@router.get("/projects")
def get_projects():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT project_id AS id, project_name AS title, description FROM project ORDER BY created_at DESC")
    projects = cursor.fetchall()
    cursor.close()
    conn.close()
    return projects


# ==========================
# 📌 프로젝트 + 태스크 동시 등록
# ==========================
class SubDetail(BaseModel):
    title: str
    start_date: Optional[str] = None
    due_date: Optional[str] = None
    assignee_emp_id: Optional[int] = None

class SubTask(BaseModel):
    title: str
    start_date: Optional[str] = None
    due_date: Optional[str] = None
    assignee_emp_id: Optional[int] = None
    details: List[SubDetail] = []

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: Optional[str] = None
    due_date: Optional[str] = None
    assignee_emp_id: Optional[int] = None
    subtasks: List[SubTask] = []

class ProjectWithTasks(BaseModel):
    project_name: str
    description: Optional[str] = None
    status: Optional[str] = "PLANNED"
    owner_emp_id: Optional[int] = None
    tasks: List[TaskCreate] = []

import logging

@router.post("/projects-with-tasks")
def create_project_with_tasks(project: dict):
    logging.error(f"📌 받은 요청 데이터: {project}")

# routers/project_router.py
from fastapi import APIRouter
from db import get_connection
import logging

router = APIRouter()

@router.post("/projects-with-tasks")
def create_project_with_tasks(data: dict):
    logging.error(f"📌 받은 요청 데이터: {data}")
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # 1️⃣ 프로젝트 INSERT
        sql_project = "INSERT INTO project (project_name, description, owner_emp_id) VALUES (%s, %s, %s)"
        logging.error(f"🟢 실행할 SQL(project): {sql_project} / values={data['project_name'], data['description'], data['owner_emp_id']}")
        cursor.execute(sql_project, (data["project_name"], data["description"], data["owner_emp_id"]))
        project_id = cursor.lastrowid
        logging.error(f"✅ project_id 생성됨: {project_id}")

        task_ids = []
        for task in data.get("tasks", []):
            sql_task = """
                INSERT INTO task (project_id, title, description, assignee_emp_id, start_date, due_date)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            values = (
                project_id,
                task.get("title"),
                task.get("description"),
                task.get("assignee_emp_id"),
                task.get("start_date") or None,
                task.get("due_date") or None,
            )
            logging.error(f"🟢 실행할 SQL(task): {sql_task} / values={values}")
            cursor.execute(sql_task, values)
            task_ids.append(cursor.lastrowid)
            logging.error(f"✅ task_id 생성됨: {cursor.lastrowid}")

        # 🔥 반드시 커밋
        conn.commit()
        logging.error("💾 DB COMMIT 완료!")

        return {"success": True, "project_id": project_id, "task_ids": task_ids}

    except Exception as e:
        conn.rollback()
        logging.error(f"❌ DB Error 발생: {e}")
        raise
    finally:
        cursor.close()
        conn.close()
