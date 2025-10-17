// src/utils/websocket.js
let socket = null;

/**
 * ✅ 프로젝트별 WebSocket 연결 (SSE 또는 WebSocket 가능)
 */
export function connectProjectSocket(projectId, onMessage) {
  if (socket) disconnectProjectSocket();

  // ✅ FastAPI 예시: ws://localhost:8000/ws/projects/{project_id}
  socket = new WebSocket(`${import.meta.env.VITE_WS_BASE}/projects/${projectId}`);

  socket.onopen = () => console.log("✅ WebSocket 연결됨:", projectId);
  socket.onclose = () => console.log("🔌 WebSocket 연결 종료됨");
  socket.onerror = e => console.error("❌ WebSocket 에러:", e);
  socket.onmessage = event => {
    try {
      const data = JSON.parse(event.data);
      onMessage?.(data);
    } catch (err) {
      console.error("📩 WebSocket 메시지 파싱 실패:", err);
    }
  };

  return socket;
}

export function disconnectProjectSocket() {
  if (socket) {
    socket.close();
    socket = null;
  }
}
