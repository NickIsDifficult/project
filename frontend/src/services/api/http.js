// src/services/api/http.js
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// ============ ✅ JWT 요청 인터셉터 ============
API.interceptors.request.use(
  config => {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  error => Promise.reject(error),
);

// ============ ✅ 만료/무효 세션 처리 보강 ============
// 로그인 경로: 필요시 "/login" 등으로 바꿔 사용
const LOGIN_PATH = import.meta.env.VITE_LOGIN_PATH || "/";

// 중복 알림 방지용 플래그
let sessionHandled = false;

// 로컬 세션 정리 함수
function clearSession() {
  try {
    localStorage.removeItem("access_token");
    localStorage.removeItem("member");
    localStorage.removeItem("user_role");
  } catch (_) {}
}

// ============ ✅ 응답 에러 핸들링(세션만료 포함) ============
API.interceptors.response.use(
  res => res,
  error => {
    const status = error?.response?.status;
    const detail = error?.response?.data?.detail;

    // 로그인/회원가입/토큰갱신 등 인증 엔드포인트는 제외
    // FastAPI에서 자주 쓰는 만료/인증 실패 패턴들
    const url = error?.config?.url || "";
    const isAuthRoute = /\/auth\/login|\/auth\/signup|\/auth\/refresh/i.test(url);

    const hasToken =
      !!localStorage.getItem("access_token") || !!error?.config?.headers?.Authorization;

    const isSessionErrorCore =
      status === 401 || // Unauthorized (토큰 만료/무효 일반)
      status === 419 || // 일부 서버에서 만료 코드로 419 사용
      (status === 403 && // 경우에 따라 403 + 특정 메시지 조합
        (detail === "Not authenticated" ||
          detail === "Could not validate credentials" ||
          detail === "Invalid authentication credentials"));

    const isSessionError = hasToken && !isAuthRoute && isSessionErrorCore;

    if (isSessionError && !sessionHandled) {
      sessionHandled = true;
      clearSession();

      // 사용자 알림 (한 번만)
      try {
        alert("세션이 만료되었습니다. 다시 로그인해 주세요.");
      } catch (_) {}

      // 로그인 화면으로 이동 (전체 리프레시로 안전하게 복귀)
      if (window.location.pathname !== LOGIN_PATH) {
        window.location.replace(LOGIN_PATH);
      } else {
        // 이미 로그인 화면이면 다음 에러에 대해 다시 알림 가능하도록
        sessionHandled = false;
      }

      // 호출측에 명확한 에러 전달
      return Promise.reject(new Error("세션이 만료되었습니다"));
    }

    // ▶ 기존 에러 메시지 구성 로직 유지
    const msg =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map(d => d.msg).join(", ")
          : detail?.message || error.message || "서버 오류";

    console.error("❌ API 요청 실패:", msg);
    return Promise.reject(new Error(msg));
  },
);

export default API;
