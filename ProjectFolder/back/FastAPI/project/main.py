from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from datetime import date
from pydantic import BaseModel
from typing import List, Optional

class DetailTask(BaseModel):
    id: int
    title: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class SubTask(BaseModel):
    id: int
    title: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    details: List[DetailTask] = []

class MainTask(BaseModel):
    id: int
    title: str
    description: Optional[str] = ""
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    subtasks: List[SubTask] = []

app = FastAPI()

# ✅ CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React 개발 서버
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ====== 데이터 구조 ======
class DetailTask(BaseModel):
    id: int
    title: str

class SubTask(BaseModel):
    id: int
    title: str
    details: List[DetailTask] = []

class MainTask(BaseModel):
    id: int
    title: str
    description: str
    subtasks: List[SubTask] = []

class MainTask(BaseModel):
    id: int
    title: str
    description: str = ""
    start_date: str | None = None
    end_date: str | None = None
    subtasks: List[SubTask] = []

# 메모리 저장
tasks: List[MainTask] = []
main_id = 1
sub_id = 1
detail_id = 1

# ====== API ======
@app.get("/tasks")
def get_tasks():
    return tasks

@app.post("/tasks")
def create_main_task(task: dict):
    global main_id
    new_task = MainTask(
        id=main_id,
        title=task.get("title", ""),
        description=task.get("description", ""),
        subtasks=[]
    )
    tasks.append(new_task)
    main_id += 1
    return new_task

@app.post("/tasks/{main_id}/sub")
def create_sub_task(main_id: int, sub: dict):
    global sub_id
    for task in tasks:
        if task.id == main_id:
            new_sub = SubTask(id=sub_id, title=sub.get("title", ""), details=[])
            task.subtasks.append(new_sub)
            sub_id += 1
            return new_sub
    raise HTTPException(status_code=404, detail="Main Task not found")

@app.post("/subtasks/{sub_id}/detail")
def create_detail_task(sub_id: int, detail: dict):
    global detail_id
    for task in tasks:
        for sub in task.subtasks:
            if sub.id == sub_id:
                new_detail = DetailTask(id=detail_id, title=detail.get("title", ""))
                sub.details.append(new_detail)
                detail_id += 1
                return new_detail
    raise HTTPException(status_code=404, detail="Sub Task not found")

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    global tasks
    tasks = [task for task in tasks if task.id != task_id]
    return {"message": "Task deleted"}

@app.post("/tasks")
def create_main_task(title: str, description: str = "", start_date: Optional[date] = None, end_date: Optional[date] = None):
    global main_id
    new_task = MainTask(
        id=main_id,
        title=title,
        description=description,
        start_date=start_date,
        end_date=end_date,
        subtasks=[]
    )
    tasks.append(new_task)
    main_id += 1
    return new_task
    
class MainTask(BaseModel):
    id: int
    title: str
    description: str = ""
    start_date: str | None = None
    end_date: str | None = None
    subtasks: List[SubTask] = []