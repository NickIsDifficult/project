// src/services/api/http.js
import axios from "axios";

/* ---------------------------------------------
 * 🧩 기본 설정
 * --------------------------------------------- */

// ✅ FastAPI 라우트 일관성을 위해 baseURL 끝에 `/` 추가
const base = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/";
const LOGIN_PATH = import.meta.env.VITE_LOGIN_PATH || "/";

const API = axios.create({
  baseURL: base.endsWith("/") ? base : base + "/", // ✅ 항상 슬래시 포함
  headers: { "Content-Type": "application/json" },
  withCredentials: false, // 쿠키 대신 JWT 토큰 사용
});

/* ---------------------------------------------
 * 🛡️ JWT 요청 인터셉터
 * --------------------------------------------- */
API.interceptors.request.use(
  config => {
    const token = localStorage.getItem("access_token");
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

/* ---------------------------------------------
 * 🔐 세션 만료 처리
 * --------------------------------------------- */
let sessionHandled = false;

// 세션 초기화
function clearSession() {
  try {
    localStorage.removeItem("access_token");
    localStorage.removeItem("member");
    localStorage.removeItem("user_role");
  } catch (_) {
    console.warn("⚠️ 로컬 세션 정리 중 경고 무시됨");
  }
}

/* ---------------------------------------------
 * 🚨 응답 에러 인터셉터
 * --------------------------------------------- */
API.interceptors.response.use(
  res => res,
  error => {
    const status = error?.response?.status;
    const detail = error?.response?.data?.detail;
    const url = error?.config?.url || "";
    const hasToken =
      !!localStorage.getItem("access_token") || !!error?.config?.headers?.Authorization;

    const isAuthRoute = /\/auth\/(login|signup|refresh)/i.test(url);
    const isSessionErrorCore =
      status === 401 ||
      status === 419 ||
      (status === 403 &&
        (detail === "Not authenticated" ||
          detail === "Could not validate credentials" ||
          detail === "Invalid authentication credentials"));

    const isSessionError = hasToken && !isAuthRoute && isSessionErrorCore;

    // ✅ 세션 만료 처리
    if (isSessionError && !sessionHandled) {
      sessionHandled = true;
      clearSession();

      try {
        alert("세션이 만료되었습니다. 다시 로그인해 주세요.");
      } catch (_) {}

      if (window.location.pathname !== LOGIN_PATH) {
        window.location.replace(LOGIN_PATH);
      } else {
        // 이미 로그인 화면이면 다음 세션 만료를 감지 가능하게 리셋
        setTimeout(() => {
          sessionHandled = false;
        }, 2000);
      }

      return Promise.reject(new Error("세션이 만료되었습니다."));
    }

    /* ---------------------------------------------
     * ❌ 일반 에러 메시지 구성
     * --------------------------------------------- */
    let msg =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map(d => d.msg).join(", ")
          : detail?.message || error.message || "서버 오류";

    // FastAPI 구조가 없는 단순 text 응답 방지
    if (!msg || msg === "Request failed with status code " + status) {
      msg = `서버 응답 오류 (${status || "알 수 없음"})`;
    }

    console.error("❌ API 요청 실패:", msg, "\nURL:", url);
    return Promise.reject(new Error(msg));
  },
);

export default API;
