from fastapi import APIRouter
from db import get_connection

router = APIRouter()

@router.get("/projects/{project_id}/members")
def get_project_members(project_id: int):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    sql = """
        SELECT pm.emp_id, e.name, pm.role
        FROM project_member pm
        JOIN employee e ON pm.emp_id = e.emp_id
        WHERE pm.project_id = %s
    """
    cursor.execute(sql, (project_id,))
    members = cursor.fetchall()

    cursor.close()
    conn.close()
    return members
