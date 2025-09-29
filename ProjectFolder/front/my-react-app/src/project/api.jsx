const API_URL = "http://127.0.0.1:8000";

export async function getTasks() {
  const res = await fetch(`${API_URL}/tasks`);
  if (!res.ok) throw new Error("조회 실패");
  return await res.json();
}

export async function createTask(title, description = "") {
  const res = await fetch(`${API_URL}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description }),
  });
  if (!res.ok) throw new Error("상위업무 등록 실패");
  return await res.json();
}

export async function createSubtask(taskId, title) {
  const res = await fetch(`${API_URL}/tasks/${taskId}/sub`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("하위업무 등록 실패");
  return await res.json();
}

export async function createSubDetail(subtaskId, title) {
  const res = await fetch(`${API_URL}/subtasks/${subtaskId}/detail`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("세부업무 등록 실패");
  return await res.json();
}

export async function deleteTask(id) {
  await fetch(`${API_URL}/tasks/${id}`, { method: "DELETE" });
}
