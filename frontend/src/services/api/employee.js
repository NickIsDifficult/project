// src/services/api/employee.js
import api from "./http";

/**
 * ✅ 공통 요청 래퍼
 */
const request = async (fn, context = "직원") => {
  try {
    const res = await fn();
    return res.data;
  } catch (error) {
    const detail = error?.response?.data?.detail || error?.message || "알 수 없는 오류";
    console.error(`❌ ${context} API 요청 실패:`, detail);
    throw new Error(`${context} 요청 중 오류 발생: ${detail}`);
  }
};

/* ---------------------------------------------
 * 👥 직원 CRUD
 * --------------------------------------------- */

// ✅ 직원 전체 목록 (라우트와 일관성 유지: `/employees/`)
export const getEmployees = () => request(() => api.get("/employees/"), "직원 목록");

// ✅ 특정 직원 상세 조회
export const getEmployee = id => request(() => api.get(`/employees/${id}`), "직원 상세");

// ✅ 직원 생성
export const createEmployee = data => request(() => api.post("/employees/", data), "직원 생성");

// ✅ 직원 수정
export const updateEmployee = (id, data) =>
  request(() => api.put(`/employees/${id}`, data), "직원 수정");

// ✅ 직원 삭제
export const deleteEmployee = id => request(() => api.delete(`/employees/${id}`), "직원 삭제");

/* ---------------------------------------------
 * 🧩 프로젝트 멤버 & 업무 담당자
 * --------------------------------------------- */

// ✅ 특정 프로젝트의 참여자 목록
export const getProjectMembers = projectId =>
  request(() => api.get(`/projects/${projectId}/members`), "프로젝트 멤버 목록");

// ✅ 특정 업무의 담당자 목록 (프로젝트 ID 포함)
export const getTaskAssignees = (projectId, taskId) =>
  request(() => api.get(`/projects/${projectId}/tasks/${taskId}`), "업무 담당자 목록");

// ✅ 업무 담당자 변경 (FastAPI의 실제 라우트에 맞게 수정)
export const updateTaskAssignees = (projectId, taskId, assigneeIds) =>
  request(
    () =>
      api.put(`/projects/${projectId}/tasks/${taskId}`, {
        assignee_ids: assigneeIds, // ✅ FastAPI는 assignee_ids 필드 사용
      }),
    "업무 담당자 변경",
  );

/* ---------------------------------------------
 * 🗂 담당업무(responsibility) — 직원 개인
 * --------------------------------------------- */

// ✅ 직원의 담당업무 조회
export const getEmployeeResponsibility = empId =>
  request(() => api.get(`/employees/${empId}/responsibility`), "담당업무 조회");

// ✅ 직원의 담당업무 수정
export const updateEmployeeResponsibility = (empId, responsibility_text) =>
  request(
    () => api.put(`/employees/${empId}/responsibility`, { responsibility_text }),
    "담당업무 수정",
  );
