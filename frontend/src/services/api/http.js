// src/services/api/http.js
import axios from "axios";

/** ========= 환경변수 (없으면 로컬 기본값) =========
 * Vite: .env.local 등에 아래를 넣으면 자동 주입
 * VITE_API_BASE="http://127.0.0.1:8000/api"
 * VITE_AUTH_BASE="http://127.0.0.1:8000"
 * VITE_LOGIN_PATH="/"
 */
const API_BASE   = import.meta.env.VITE_API_BASE  || "http://127.0.0.1:8000/api"; // /api 계열
const AUTH_BASE  = import.meta.env.VITE_AUTH_BASE || "http://127.0.0.1:8000";      // /auth 계열
const LOGIN_PATH = import.meta.env.VITE_LOGIN_PATH || "/";                          // 로그인 페이지 경로

/** ========= Axios 인스턴스 =========
 * ⚠️ 전역 Content-Type 고정 금지(파일 업로드시 자동 설정 필요)
 */
export const API = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export const AUTH = axios.create({
  baseURL: AUTH_BASE,
  withCredentials: true,
});

/** ========= 공통: 요청 인터셉터(JWT 추가) ========= */
const attachAuth = (config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

API.interceptors.request.use(attachAuth, (error) => Promise.reject(error));
AUTH.interceptors.request.use(attachAuth, (error) => Promise.reject(error));

/** ========= 세션 만료 처리 유틸 ========= */
let sessionHandled = false;

function clearSession() {
  try {
    localStorage.removeItem("access_token");
    localStorage.removeItem("member");
    localStorage.removeItem("user_role");
  } catch (_) {}
}

function isAuthRoute(url = "") {
  // 로그인/회원가입/토큰갱신 등 인증 엔드포인트는 세션 만료 처리 제외
  return /\/auth\/(login|signup|refresh)/i.test(url || "");
}

function buildErrorMessage(error) {
  const detail = error?.response?.data?.detail;
  return (
    (typeof detail === "string" && detail) ||
    (Array.isArray(detail) && detail.map((d) => d?.msg || d).join(", ")) ||
    detail?.message ||
    error?.message ||
    "서버 오류"
  );
}

/** ========= 응답 인터셉터: 세션 만료 공통 처리 ========= */
const onResponseError = (error) => {
  const status = error?.response?.status;
  const url = error?.config?.url || "";
  const hasToken =
    !!localStorage.getItem("access_token") ||
    !!error?.config?.headers?.Authorization;

  const detail = error?.response?.data?.detail;
  const isSessionErrorCore =
    status === 401 ||
    status === 419 ||
    (status === 403 &&
      (detail === "Not authenticated" ||
       detail === "Could not validate credentials" ||
       detail === "Invalid authentication credentials"));

  const isSessionError = hasToken && !isAuthRoute(url) && isSessionErrorCore;

  if (isSessionError && !sessionHandled) {
    sessionHandled = true;
    clearSession();

    try { alert("세션이 만료되었습니다. 다시 로그인해 주세요."); } catch (_) {}

    if (window.location.pathname !== LOGIN_PATH) {
      window.location.replace(LOGIN_PATH); // 전체 리프레시로 안전 복귀
    } else {
      // 이미 로그인 화면이면 다음 에러에서 다시 동작 가능하도록
      sessionHandled = false;
    }

    return Promise.reject(new Error("세션이 만료되었습니다"));
  }

  const msg = buildErrorMessage(error);
  console.error("❌ API 요청 실패:", msg);
  return Promise.reject(new Error(msg));
};

API.interceptors.response.use((res) => res, onResponseError);
AUTH.interceptors.response.use((res) => res, onResponseError);

/** ========= 기본 내보내기(기존 코드 호환) ========= */
export default API;
