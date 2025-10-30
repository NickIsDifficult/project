// frontend/src/services/api.js

const DEFAULT_TIMEOUT_MS = 15000;

// ✅ 백엔드 기본 URL (환경변수 없으면 8000)
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta?.env?.VITE_API_BASE) ||
  "http://127.0.0.1:8000";

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

function pickToken(explicitToken) {
  // 우선순위: 인자 > localStorage("token") > localStorage("access_token")
  const stored =
    localStorage.getItem("token") || localStorage.getItem("access_token");
  return explicitToken || stored || undefined;
}

async function parseResponse(res) {
  if (res.status === 204) return null;
  const ct = res.headers.get("content-type") || "";
  const isJSON = ct.includes("application/json");
  try {
    return isJSON ? await res.json() : await res.text();
  } catch {
    return null;
  }
}

function toError(res, bodyText = "") {
  const err = new Error(
    `HTTP ${res.status} ${res.statusText}${bodyText ? " " + bodyText : ""}`.trim()
  );
  err.status = res.status;
  return err;
}

function withTimeout(signal, ms = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(new Error("Request timeout")), ms);
  if (signal) signal.addEventListener("abort", () => controller.abort());
  return { signal: controller.signal, _timeoutId: id };
}

/**
 * 메인 API
 */
export async function api(
  path,
  {
    method = "GET",
    token,
    body,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    // ✅ 기본값을 include로: 쿠키/세션 자동 전송
    credentials = "include",
    headers = {},
  } = {}
) {
  const authToken = pickToken(token);
  const { signal, _timeoutId } = withTimeout(undefined, timeoutMs);

  // /auth/*는 /api 프리픽스 없이, 그 외는 /api
  const url = path.startsWith("/auth/")
    ? `${API_BASE}${path}`
    : `${API_BASE}/api${path}`;

  try {
    const res = await fetch(url, {
      method,
      headers: { ...buildHeaders(authToken), ...headers },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      credentials, // ✅ 쿠키 포함 (HttpOnly 세션/리프레시 대응)
      signal,
    });

    const payload = await parseResponse(res);

    if (!res.ok) {
      let tail = "";
      if (payload && typeof payload === "object") {
        try { tail = JSON.stringify(payload); } catch {}
      } else if (typeof payload === "string") {
        tail = payload;
      }
      throw toError(res, tail);
    }
    return payload;
  } finally {
    if (_timeoutId) clearTimeout(_timeoutId);
  }
}

// 편의 래퍼
export const get = (path, opts = {}) => api(path, { ...opts, method: "GET" });
export const post = (path, body, opts = {}) => api(path, { ...opts, method: "POST", body });
export const put  = (path, body, opts = {}) => api(path, { ...opts, method: "PUT", body });
export const del  = (path, opts = {}) => api(path, { ...opts, method: "DELETE" });

// 배열 정규화
export function normalizeToArray(data) {
  if (Array.isArray(data)) return data;
  if (!data) return [];
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.rows)) return data.rows;
  return [];
}
