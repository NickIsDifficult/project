// src/services/api/http.js
import axios from "axios";

/* =========================
   1) baseURL 결정 로직
   - VITE_API_BASE: "http://localhost:8000/api" 같은 절대주소(프록시 미사용 시)
   - 미지정 시 "/api"로 두고 Vite 프록시 사용
   - 뒤/앞 슬래시 정리로 "/api/api" 중복 방지
   ========================= */
const RAW_BASE = import.meta.env.VITE_API_BASE || "/api";
const BASE_URL = RAW_BASE.replace(/\/+$/, ""); // 끝 슬래시 제거

/* =========================
   2) Axios 인스턴스
   ========================= */
const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // 쿠키 기반 인증이면 true 유지
  headers: { "Content-Type": "application/json" },
  timeout: 15000, // 네트워크 지연 대비
});

/* =========================
   3) 요청 인터셉터 (JWT 자동 주입)
   ========================= */
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      // 이미 다른 곳에서 Authorization 넣었으면 덮어쓰지 않음
      if (!config.headers?.Authorization) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* =========================
   4) 응답 인터셉터 (에러 표준화 + 세션만료 처리)
   ========================= */
let sessionHandled = false;
const LOGIN_PATH = (import.meta.env.VITE_LOGIN_PATH || "/").trim() || "/";

function clearSession() {
  try {
    localStorage.removeItem("access_token");
    localStorage.removeItem("member");
    localStorage.removeItem("user_role");
  } catch {}
}

function normalizeError(error) {
  const status = error?.response?.status;
  const detail = error?.response?.data?.detail;
  const url = error?.config?.url || "";

  // FastAPI 기본 detail 포맷, 또는 Pydantic 오류 배열 처리
  const msg =
    typeof detail === "string"
      ? detail
      : Array.isArray(detail)
      ? detail.map((d) => d?.msg ?? "").filter(Boolean).join(", ")
      : detail?.message || error?.message || "서버 오류";

  return { status, msg, url };
}

API.interceptors.response.use(
  (res) => res,
  (error) => {
    const { status, msg, url } = normalizeError(error);

    // 인증 라우트 여부 및 토큰 보유 여부
    const isAuthRoute = /\/auth\/(login|signup|refresh)\b/i.test(url || "");
    const hasToken =
      !!localStorage.getItem("access_token") ||
      !!error?.config?.headers?.Authorization;

    // 세션 만료로 판단할 핵심 조건
    const detail = error?.response?.data?.detail;
    const isSessionErrorCore =
      status === 401 ||
      status === 419 ||
      (status === 403 &&
        (detail === "Not authenticated" ||
         detail === "Could not validate credentials" ||
         detail === "Invalid authentication credentials"));

    const isSessionError = hasToken && !isAuthRoute && isSessionErrorCore;

    if (isSessionError && !sessionHandled) {
      sessionHandled = true;
      clearSession();
      try { alert("세션이 만료되었습니다. 다시 로그인해 주세요."); } catch {}
      if (window.location.pathname !== LOGIN_PATH) {
        window.location.replace(LOGIN_PATH);
      } else {
        sessionHandled = false;
      }
      return Promise.reject(new Error("세션이 만료되었습니다"));
    }

    console.error("❌ API 요청 실패:", status, msg, url);
    return Promise.reject(new Error(msg || "요청에 실패했습니다"));
  }
);

/* =========================
   5) 유틸: 토큰/세션 제어 & FormData 헬퍼
   ========================= */
export function setAuthToken(token) {
  try { localStorage.setItem("access_token", token ?? ""); } catch {}
  if (token) API.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete API.defaults.headers.common.Authorization;
}

export function clearAuth() {
  clearSession();
  delete API.defaults.headers.common.Authorization;
}

/**
 * 파일 업로드 시 Content-Type 수동 지정 금지!
 * 브라우저가 boundary 포함해 자동으로 설정하므로
 * headers에서 Content-Type 제거하고 전송.
 */
export async function postFormData(url, formData, config = {}) {
  const cfg = { ...config };
  cfg.headers = { ...(config.headers || {}) };
  delete cfg.headers["Content-Type"];
  return API.post(url, formData, cfg);
}

/* =========================
   6) (선택) 에러 재시도 간단 헬퍼
   ========================= */
export async function withRetry(fn, { retries = 1, delay = 300 } = {}) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); }
    catch (e) {
      lastErr = e;
      if (i < retries) await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

export default API;
