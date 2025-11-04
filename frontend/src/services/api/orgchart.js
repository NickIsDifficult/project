// frontend/src/services/api/orgchart.js
import API from "./http";

/**
 * GET /org-chart?dept_no=...
 * @param {string} deptNo
 */
export const fetchOrgChart = async (deptNo) => {
  const { data } = await API.get("/org-chart", { params: { dept_no: deptNo } });
  return data;
};
