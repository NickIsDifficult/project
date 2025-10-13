# backend/app/routers/ws_router.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json

router = APIRouter()
active_connections: Dict[int, List[WebSocket]] = {}

async def notify_project(project_id: int, message: dict):
    if project_id in active_connections:
        for conn in active_connections[project_id]:
            await conn.send_text(json.dumps(message))

@router.websocket("/ws/projects/{project_id}")
async def project_ws(websocket: WebSocket, project_id: int):
    project_id = int(project_id)
    await websocket.accept()
    if project_id not in active_connections:
        active_connections[project_id] = []
    active_connections[project_id].append(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            print("📥 WebSocket 수신:", data)
    except WebSocketDisconnect:
        active_connections[project_id].remove(websocket)
        print(f"🔌 WebSocket 연결 종료: {project_id}")
