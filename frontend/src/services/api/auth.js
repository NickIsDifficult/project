// frontend/src/services/api/auth.js
import API from "./http";

export const signup = async (payload) => {
  // POST /auth/signup
  const { data } = await API.post("/auth/signup", payload);
  return data;
};

export const login = async ({ login_id, password }) => {
  const { data } = await API.post("/auth/login", { login_id, password });
  // 서버가 액세스 토큰을 내려줄 경우 저장 (필요시 응답 키에 맞게 조정)
  if (data?.access_token) {
    try {
      localStorage.setItem("access_token", data.access_token);
    } catch {}
  }
  return data;
};

export const logout = async ({ redirect = true, message } = {}) => {
  // 서버 통지 필요 시 주석 해제
  // try { await API.post("/auth/logout"); } catch (_) {}

  // 클라이언트 세션 정리
  try {
    localStorage.removeItem("access_token");
    localStorage.removeItem("member");
  } catch {}

  if (API?.defaults?.headers?.common?.Authorization) {
    delete API.defaults.headers.common.Authorization;
  }

  if (redirect) {
    const q = message ? `?msg=${encodeURIComponent(message)}` : "";
    window.location.href = "/" + q; // ✅ 중복 redirect 제거
  }
};

export const getDepartments = async () => {
  const { data } = await API.get("/auth/lookup/departments", {
    params: { for_user: "EMPLOYEE" },
  });
  return data;
};

export const getRoles = async () => {
  const { data } = await API.get("/auth/lookup/roles", {
    params: { for_user: "EMPLOYEE" },
  });
  return data;
};

export const getMe = async () => {
  const { data } = await API.get("/auth/me");
  try { localStorage.setItem("member", JSON.stringify(data)); } catch {}
  return data;
};

export const updateProfile = async (payload) => {
  const { data } = await API.patch("/auth/me", payload);
  try { localStorage.setItem("member", JSON.stringify(data)); } catch {}
  return data;
};

export const changePassword = async (payload) => {
  const { data } = await API.put("/auth/me/password", payload);
  return data; // 204일 수도 있음
};
