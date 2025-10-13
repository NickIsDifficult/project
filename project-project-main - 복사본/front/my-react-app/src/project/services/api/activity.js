// src/services/api/activity.js
import { api } from "./base";

//
// ===================================================
// 🕓 활동 로그(Activity Feed)
// ===================================================
//

// ✅ 공통 요청 래퍼 (일관성 유지)
const request = async (fn, context = "활동 로그") => {
  try {
    const res = await fn();
    return res.data;
  } catch (error) {
    console.error(`❌ ${context} API 요청 실패:`, error);
    const msg = error.response?.data?.detail || error.message;
    throw new Error(`${context} 중 오류 발생: ${msg}`);
  }
};

// ✅ 프로젝트별 활동 로그 조회
export const getProjectActivity = (projectId, limit = 100) =>
  request(
    () => api.get(`/projects/${projectId}/activity/`, { params: { limit } }),
    "프로젝트 활동 로그 조회",
  );

// ✅ 태스크별 활동 로그 조회 (선택적 기능)
export const getTaskActivity = (projectId, taskId, limit = 50) =>
  request(
    () => api.get(`/projects/${projectId}/activity`, { params: { task_id: taskId, limit } }),
    "태스크 활동 로그 조회",
  );
