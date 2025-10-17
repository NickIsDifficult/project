// frontend/src/services/api/auth.js
import API from "./http";

export const signup = async payload => {
  // POST /auth/signup
  const { data } = await API.post("/auth/signup", payload);
  return data;
};

export const login = async payload => {
  // POST /auth/login
  const { data } = await API.post("/auth/login", payload);
  return data;
};

export const logout = async ({ redirect = true, message } = {}) => {
  // 서버 통지 제거
  // try { await API.post("/auth/logout"); } catch (_) {}

  // 클라이언트 세션 정리
  localStorage.removeItem("access_token");
  localStorage.removeItem("member");

  // (선택) axios Authorization 헤더도 즉시 비움
  if (API?.defaults?.headers?.common) delete API.defaults.headers.common.Authorization;

  if (redirect) {
    const q = message ? `?msg=${encodeURIComponent(message)}` : "";
    window.location.href = "/" + q;
  }
  // 로그인 화면으로 이동(+배너 메시지)
  if (redirect) {
    const q = message ? `?msg=${encodeURIComponent(message)}` : "";
    window.location.href = "/" + q; // 전체 리로드로 상태 완전 초기화
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
  try { localStorage.setItem("member", JSON.stringify(data)); } catch (_) {}
  return data;
};

export const updateProfile = async (payload) => {
  const { data } = await API.patch("/auth/me", payload);
  try { localStorage.setItem("member", JSON.stringify(data)); } catch (_) {}
  return data;
};

export const changePassword = async (payload) => {
  const { data } = await API.put("/auth/me/password", payload);
  return data; // 204면 data는 없어도 OK
};