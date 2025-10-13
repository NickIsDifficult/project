// src/services/api/base.js
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// ✅ 공통 Axios 인스턴스
export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// ✅ 토큰 자동 주입
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  error => Promise.reject(error),
);

// ✅ 응답 에러 핸들링 (공통)
api.interceptors.response.use(
  response => response,
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
