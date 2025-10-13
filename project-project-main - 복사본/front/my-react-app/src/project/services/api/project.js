// src/services/api/project.js
import { api } from "./base";

const request = async (fn, context = "프로젝트") => {
  try {
    const res = await fn();
    return res.data;
  } catch (error) {
    console.error(`❌ ${context} API 요청 실패:`, error);
    throw new Error(`${context} 중 오류 발생: ${error.message}`);
  }
};

export const getProjects = () => request(() => api.get("/projects/"), "프로젝트 목록");
export const getProject = projectId =>
  request(() => api.get(`/projects/${projectId}`), "프로젝트 상세");
export const createProject = data => request(() => api.post("/projects/", data), "프로젝트 생성");
export const updateProject = (projectId, data) =>
  request(() => api.put(`/projects/${projectId}`, data), "프로젝트 수정");
export const deleteProject = projectId =>
  request(() => api.delete(`/projects/${projectId}`), "프로젝트 삭제");
