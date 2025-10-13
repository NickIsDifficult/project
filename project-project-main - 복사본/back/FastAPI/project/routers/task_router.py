from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from db import get_connection

router = APIRouter()

class Task(BaseModel):
    project_id: int
    title: str
    description: Optional[str] = None
    assignee_emp_id: Optional[int] = None
    start_date: Optional[str] = None
    due_date: Optional[str] = None
    parent_task_id: Optional[int] = None

@router.post("/tasks")
def create_task(task: Task):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "INSERT INTO task (project_id, title, description, assignee_emp_id, start_date, due_date, parent_task_id) VALUES (%s, %s, %s, %s, %s, %s, %s)",
        (task.project_id, task.title, task.description, task.assignee_emp_id, task.start_date, task.due_date, task.parent_task_id)
    )
    conn.commit()
    task_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return {"success": True, "task_id": task_id}
