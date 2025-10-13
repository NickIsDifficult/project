# routers/employee_router.py
from fastapi import APIRouter
from db import get_connection
from models import EmployeeCreate

router = APIRouter()

@router.post("/employees")
def create_employee(emp: EmployeeCreate):
    conn = get_connection()
    cursor = conn.cursor()

    sql = "INSERT INTO employee (name, email) VALUES (%s, %s)"
    cursor.execute(sql, (emp.name, emp.email))
    emp_id = cursor.lastrowid

    conn.commit()
    cursor.close()
    conn.close()
    return {"success": True, "emp_id": emp_id}

@router.get("/employees")
def get_employees():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM employee")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows
