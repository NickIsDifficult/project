// src/services/api/project.js
import axios from "axios";

// -----------------------------
// ⚙️ Axios 인스턴스 설정
// -----------------------------
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
  timeout: 10000, // 10초 타임아웃
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ 요청 인터셉터 (토큰 자동 포함)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ 응답 인터셉터 (에러 로깅)
api.interceptors.response.use(
  (res) => res,
  (error) => {
    console.error("API 오류 발생:", error.response || error.message);
    return Promise.reject(error);
  }
);

// -----------------------------
// ⚙️ 공통 요청 래퍼
// -----------------------------
const request = async (fn, context = "프로젝트") => {
  try {
    const res = await fn();
    return res.data;
  } catch (error) {
    const status = error.response?.status;
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      "서버 요청 중 오류가 발생했습니다.";

    // 개발 환경에서만 상세 로그
    if (import.meta.env.DEV) {
      console.group(`❌ ${context} API 오류`);
      console.error("상태 코드:", status);
      console.error("응답 메시지:", message);
      console.groupEnd();
    }

    // 사용자 친화적 메시지 반환
    throw new Error(message);
  }
};

// -----------------------------
// 📁 프로젝트 관련 API
// -----------------------------

// 전체 프로젝트 조회
export const getProjects = () => request(() => api.get("/projects/"), "프로젝트 목록");

// 단일 프로젝트 조회
export const getProject = (projectId) =>
  request(() => api.get(`/projects/${projectId}`), "프로젝트 조회");

// 프로젝트 생성
export const createProject = (projectData) =>
  request(() => api.post("/projects/", projectData), "프로젝트 생성");

// 프로젝트 수정
export const updateProject = (projectId, projectData) =>
  request(() => api.put(`/projects/${projectId}`, projectData), "프로젝트 수정");

// 프로젝트 삭제
export const deleteProject = (projectId) =>
  request(() => api.delete(`/projects/${projectId}`), "프로젝트 삭제");

// -----------------------------
// 👥 프로젝트 멤버
// -----------------------------
export const getProjectMembers = (projectId) =>
  request(() => api.get(`/projects/${projectId}/members`), "프로젝트 멤버");

// -----------------------------
// 🕓 활동 피드
// -----------------------------
export const getProjectActivity = (projectId, limit = 50) =>
  request(() => api.get(`/projects/${projectId}/activity?limit=${limit}`), "활동 피드");
