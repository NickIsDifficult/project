// src/services/api/http.js
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// ✅ 요청 인터셉터 (JWT)
API.interceptors.request.use(
  config => {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  error => Promise.reject(error),
);

// ✅ 응답 에러 핸들링
API.interceptors.response.use(
  res => res,
  error => {
    const detail = error.response?.data?.detail;
    const msg =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map(d => d.msg).join(", ")
          : detail?.message || error.message;
    console.error("❌ API 요청 실패:", msg);
    return Promise.reject(new Error(msg || "서버 오류"));
  },
);

export default API;
