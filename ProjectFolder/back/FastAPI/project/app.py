from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()

# ===== CORS 설정 =====
origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== 데이터 모델 =====
class SubDetail(BaseModel):
    id: int
    title: str

class Subtask(BaseModel):
    id: int
    title: str
    details: List[SubDetail] = []

class Task(BaseModel):
    id: int
    title: str
    description: Optional[str] = ""
    subtasks: List[Subtask] = []

# ===== 메모리 DB =====
tasks: List[Task] = []
task_id_counter = 1
subtask_id_counter = 1
subdetail_id_counter = 1

# ===== API =====
@app.get("/tasks", response_model=List[Task])
def get_tasks():
    return tasks

@app.post("/tasks", response_model=Task)
def create_task(task: Task):
    global task_id_counter
    task.id = task_id_counter
    task_id_counter += 1
    tasks.append(task)
    return task

@app.post("/subtasks/{task_id}", response_model=Subtask)
def create_subtask(task_id: int, subtask: Subtask):
    global subtask_id_counter
    for t in tasks:
        if t.id == task_id:
            subtask.id = subtask_id_counter
            subtask_id_counter += 1
            t.subtasks.append(subtask)
            return subtask
    raise HTTPException(status_code=404, detail="Task not found")

@app.post("/subdetails/{task_id}/{subtask_id}", response_model=SubDetail)
def create_subdetail(task_id: int, subtask_id: int, subdetail: SubDetail):
    global subdetail_id_counter
    for t in tasks:
        if t.id == task_id:
            for s in t.subtasks:
                if s.id == subtask_id:
                    subdetail.id = subdetail_id_counter
                    subdetail_id_counter += 1
                    s.details.append(subdetail)
                    return subdetail
    raise HTTPException(status_code=404, detail="Subtask not found")
