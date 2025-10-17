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

export const getEmployees = () => request(() => api.get("/employees"), "직원 목록");
export const getEmployee = id => request(() => api.get(`/employees/${id}`), "직원 상세");
export const createEmployee = data => request(() => api.post("/employees", data), "직원 생성");
export const updateEmployee = (id, data) =>
  request(() => api.put(`/employees/${id}`, data), "직원 수정");
export const deleteEmployee = id => request(() => api.delete(`/employees/${id}`), "직원 삭제");

