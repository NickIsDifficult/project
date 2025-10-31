// frontend/src/services/api.js
import axios from "axios";

const DEFAULT_TIMEOUT_MS = 15000;

// ✅ 백엔드 기본 URL (환경변수 없으면 8000)
export const API_BASE =
  (typeof import.meta !== "undefined" && import.meta?.env?.VITE_API_BASE) ||
  "http://127.0.0.1:8000";

/** Authorization 헤더 구성 */
function buildHeaders(token) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    const hasScheme =
      typeof token === "string" &&
      (token.startsWith("Bearer ") || token.startsWith("JWT "));
    headers.Authorization = hasScheme ? token : `Bearer ${token}`;
  }
  return headers;
}

/** 토큰 선택: 인자 > localStorage(token) > localStorage(access_token) */
function pickToken(explicitToken) {
  const stored =
    (typeof localStorage !== "undefined" &&
      (localStorage.getItem("token") || localStorage.getItem("access_token"))) ||
    "";
  return explicitToken || stored || undefined;
}

/** fetch 버전과 동일한 에러 포맷으로 변환 */
function toErrorLikeFetch(status, statusText, payload) {
  let tail = "";
  if (payload && typeof payload === "object") {
    try {
      tail = JSON.stringify(payload);
    } catch {
      /* noop */
    }
  } else if (typeof payload === "string") {
    tail = payload;
  }
  const err = new Error(
    `HTTP ${status ?? ""} ${statusText ?? ""}${tail ? " " + tail : ""}`.trim()
  );
  err.status = status;
  err.data = payload;
  return err;
}

/** AbortController 지원 + 타임아웃 결합 */
function withTimeout(signal, ms = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  let timerId = null;

  // 외부 signal이 있으면 연결
  if (signal) {
    if (signal.aborted) controller.abort(signal.reason);
    else signal.addEventListener("abort", () => controller.abort(signal.reason));
  }

  // 타임아웃
  if (ms > 0) {
    timerId = setTimeout(() => {
      controller.abort(new Error("Request timeout"));
    }, ms);
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      if (timerId) clearTimeout(timerId);
    },
  };
}

/** 내부: 경로를 axios에 넘길 절대 URL로 변환 */
function buildUrl(path) {
  // /auth/*는 /api 프리픽스 없이, 그 외는 /api
  return path.startsWith("/auth/")
    ? `${API_BASE}${path}`
    : `${API_BASE}/api${path}`;
}

/**
 * 메인 API (fetch 버전과 동일한 시그니처)
 *
 * api(path, {
 *   method = "GET",
 *   token,
 *   body,
 *   timeoutMs = 15000,
 *   credentials = "include", // axios에서는 withCredentials로 변환
 *   headers = {},
 * } = {})
 *
 * 반환값: response.data (JSON은 객체, 텍스트면 문자열)
 */
export async function api(
  path,
  {
    method = "GET",
    token,
    body,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    credentials = "include",
    headers = {},
  } = {}
) {
  const authToken = pickToken(token);
  const url = buildUrl(path);

  // fetch와 동일하게 AbortController + timeout 지원
  const { signal, cleanup } = withTimeout(undefined, timeoutMs);

  try {
    const res = await axios.request({
      url,
      method: method || "GET",
      // GET/DELETE면 params로, 나머지는 data로 (fetch와 달리 axios는 자동 직렬화)
      ...(method && ["GET", "DELETE", "HEAD"].includes(method.toUpperCase())
        ? { params: body }
        : { data: body }),
      headers: { ...buildHeaders(authToken), ...headers },
      // fetch의 credentials="include" ↔ axios의 withCredentials
      withCredentials: credentials === "include",
      // axios 자체 timeout도 설정(AbortController와 중복 방어)
      timeout: timeoutMs,
      signal,
      // 응답 타입은 자동(JSON) + 텍스트도 data로 들어옴
      // responseType: "json" 기본
  
      validateStatus: () => true, // 상태코드에 상관없이 then으로 받고, 아래에서 res.status로 판별
    });

    const isOk = res.status >= 200 && res.status < 300;
    if (!isOk) {
      throw toErrorLikeFetch(res.status, res.statusText, res.data);
    }

    // fetch의 parseResponse와 동일하게 data를 반환
    return res.data ?? null;
  } catch (err) {
    // axios error → fetch 스타일 에러로 정규화
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const statusText = err.response?.statusText || err.message;
      const payload = err.response?.data;
      throw toErrorLikeFetch(status, statusText, payload);
    }
    // AbortError 또는 일반 Error
    if (err?.name === "CanceledError" || err?.message === "Request timeout") {
      const e = new Error("HTTP 0 Request timeout");
      e.status = 0;
      throw e;
    }
    throw err;
  } finally {
    cleanup();
  }
}

// 편의 래퍼 (fetch 버전과 동일)
export const get = (path, opts = {}) => api(path, { ...opts, method: "GET" });
export const post = (path, body, opts = {}) => api(path, { ...opts, method: "POST", body });
export const put  = (path, body, opts = {}) => api(path, { ...opts, method: "PUT", body });
export const del  = (path, opts = {}) => api(path, { ...opts, method: "DELETE" });

/** 배열 정규화 (그대로 유지) */
export function normalizeToArray(data) {
  if (Array.isArray(data)) return data;
  if (!data) return [];
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.rows)) return data.rows;
  return [];
}

/** (선택) axios 인스턴스를 외부에서 직접 쓰고 싶을 때 */
export const http = axios.create();
