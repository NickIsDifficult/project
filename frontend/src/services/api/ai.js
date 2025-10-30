// src/services/api/ai.js
import API from "./http";

/** 🔹 단일 프로젝트 요약 */
export async function fetchProjectSummary(projectId) {
  const { data } = await API.get(`/ai/summary/project/${projectId}`);
  return data;
}

/** 🔹 전체 프로젝트 요약 */
export async function fetchAllProjectsSummary() {
  const { data } = await API.get("/ai/summary/all");
  return data;
}

/** 🔹 자연어 명령 실행 */
export async function runAICommand(prompt) {
  const { data } = await API.post("/ai/command", { prompt });
  return data;
}
