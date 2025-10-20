// src/services/api/employee.js
import api from "./http";

const request = async (fn, context = "직원") => {
  try {
    const res = await fn();
    return res.data;
  } catch (error) {
    console.error(`❌ ${context} API 요청 실패:`, error);
    throw new Error(`${context} 중 오류 발생: ${error.message}`);
  }
};

/* ---------------------------------------------
 * 👥 직원 CRUD
 * --------------------------------------------- */
export const getEmployees = () => request(() => api.get("/employees"), "직원 목록");
export const getEmployee = id => request(() => api.get(`/employees/${id}`), "직원 상세");
export const createEmployee = data => request(() => api.post("/employees", data), "직원 생성");
export const updateEmployee = (id, data) =>
  request(() => api.put(`/employees/${id}`, data), "직원 수정");
export const deleteEmployee = id => request(() => api.delete(`/employees/${id}`), "직원 삭제");

/* ---------------------------------------------
 * 🧩 프로젝트 멤버 & 업무 담당자
 * --------------------------------------------- */

// ✅ 특정 프로젝트의 참여자 목록
export const getProjectMembers = projectId =>
  request(() => api.get(`/projects/${projectId}/members`), "프로젝트 멤버 목록");

// ✅ 특정 업무의 담당자 목록
export const getTaskAssignees = taskId =>
  request(() => api.get(`/tasks/${taskId}/assignees`), "업무 담당자 목록");

// ✅ 업무 담당자 변경 (예: PUT /tasks/{task_id}/assignees)
export const updateTaskAssignees = (taskId, assigneeIds) =>
  request(
    () =>
      api.put(`/tasks/${taskId}/assignees`, {
        assignee_emp_ids: assigneeIds,
      }),
    "업무 담당자 변경",
  );
