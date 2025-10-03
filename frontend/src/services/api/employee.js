import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// ✅ 공통 axios 인스턴스
const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// ✅ 토큰 자동 포함
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ✅ 직원 목록 가져오기 (사원 드롭다운용)
export async function getEmployees() {
  try {
    const res = await api.get("/employees");
    // 🔍 FastAPI가 {"data": [...]} 형태로 반환하거나 바로 배열 반환하는 경우 둘 다 대응
    return res.data.data || res.data;
  } catch (err) {
    console.error("직원 목록 불러오기 실패:", err);
    return [];
  }
}
