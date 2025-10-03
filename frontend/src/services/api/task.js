import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// ✅ Axios 인스턴스 설정
const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// ✅ 토큰 자동 포함
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ✅ 공통 요청 래퍼
const request = async (fn, context = "태스크") => {
  try {
    const res = await fn();
    return res.data;
  } catch (error) {
    const detail = error.response?.data?.detail;
    const msg =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((d) => d.msg).join(", ")
          : detail?.message || error.message;

    console.error(`❌ ${context} API 요청 실패:`, error);
    throw new Error(`${context} 중 오류 발생: ${msg || "서버 오류"}`);
  }
};

//
// ===================================================
// 📋 태스크(Task)
// ===================================================
//

// ✅ 프로젝트별 평면 태스크 목록
export const getTasks = (projectId) =>
  request(() => api.get(`/projects/${projectId}/tasks`), "태스크 목록");

// ✅ 트리형 태스크 목록 (상위 → 하위 → 세부)
export const getTaskTree = (projectId) =>
  request(() => api.get(`/projects/${projectId}/tasks/tree`), "트리형 태스크 목록");

// ✅ 개별 태스크 상세
export const getTask = (projectId, taskId) =>
  request(() => api.get(`/projects/${projectId}/tasks/${taskId}`), "태스크 상세");

// ✅ 새 태스크 등록
export const createTask = (projectId, taskData) =>
  request(() => api.post(`/projects/${projectId}/tasks`, taskData), "태스크 생성");

// ✅ 태스크 수정
export const updateTask = (projectId, taskId, taskData) =>
  request(() => api.put(`/projects/${projectId}/tasks/${taskId}`, taskData), "태스크 수정");

// ✅ 태스크 삭제
export const deleteTask = (projectId, taskId) =>
  request(() => api.delete(`/projects/${projectId}/tasks/${taskId}`), "태스크 삭제");

// ✅ 상태 변경
export const updateTaskStatus = (projectId, taskId, newStatus) =>
  request(
    () =>
      api.patch(`/projects/${projectId}/tasks/${taskId}/status`, {
        status: newStatus,
      }),
    "태스크 상태 변경"
  );

//
// ===================================================
// 💬 댓글(Comment)
// ===================================================
//

export const getComments = (projectId, taskId) =>
  request(() => api.get(`/projects/${projectId}/tasks/${taskId}/comments`), "댓글 목록");

export const createComment = (projectId, taskId, body) =>
  request(() => api.post(`/projects/${projectId}/tasks/${taskId}/comments`, body), "댓글 작성");

export const updateComment = (projectId, taskId, commentId, body) =>
  request(
    () => api.put(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`, body),
    "댓글 수정"
  );

export const deleteComment = (projectId, taskId, commentId) =>
  request(
    () => api.delete(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`),
    "댓글 삭제"
  );


//
// ===================================================
// 📎 첨부파일(Attachment)
// ===================================================
//

export const getAttachments = (projectId, taskId) =>
  request(() => api.get(`/projects/${projectId}/tasks/${taskId}/attachments`), "첨부파일 목록");

export const uploadAttachment = (projectId, taskId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return request(
    () =>
      api.post(`/projects/${projectId}/tasks/${taskId}/attachments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    "첨부파일 업로드"
  );
};
