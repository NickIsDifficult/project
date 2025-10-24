// frontend/src/services/api/admin.js
import API from "./http";

// ===== Departments =====
export const adminListDepartments = (q = "") =>
  API.get("/admin/departments", { params: { q } }).then(r => r.data);

// dept_name만 주던 기존을 유지하면서, dept_no도 함께 보낼 수 있게 확장
export const adminCreateDepartment = ({ dept_name, dept_no }) =>
  API.post("/admin/departments", { dept_name, dept_no }).then(r => r.data);

// 업데이트도 dept_no 수정 가능하도록 payload 확장
export const adminUpdateDepartment = (dept_id, { dept_name, dept_no }) =>
  API.patch(`/admin/departments/${dept_id}`, { dept_name, dept_no }).then(r => r.data);

export const adminDeleteDepartment = (dept_id) =>
  API.delete(`/admin/departments/${dept_id}`);

// ===== Roles =====
export const adminListRoles = (q = "") =>
  API.get("/admin/roles", { params: { q } }).then(r => r.data);

export const adminCreateRole = ({ role_name, role_no }) =>
  API.post("/admin/roles", { role_name, role_no }).then(r => r.data);

export const adminUpdateRole = (role_id, { role_name, role_no }) =>
  API.patch(`/admin/roles/${role_id}`, { role_name, role_no }).then(r => r.data);

export const adminDeleteRole = (role_id) =>
  API.delete(`/admin/roles/${role_id}`);

export const adminListAccounts = ({ q = "", page = 1, size = 20 } = {}) =>
  API.get("/admin/account", { params: { q, page, size } })
    .then(r => r.data);

export const adminGetAccount = (userType, id) =>
   API.get(`/admin/account/${userType}/${id}`).then(r => r.data);

export const adminUpdateAccount = (userType, id, payload) =>
   API.put(`/admin/account/${userType}/${id}`, payload).then(r => r.data);

export const adminChangePassword = async (userType, memberId, payload) => {
  const { data } = await API.put(`/admin/account/${userType}/${memberId}/password`, payload);
  return data;
};