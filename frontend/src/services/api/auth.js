// frontend/src/services/api/auth.js
import { API, AUTH } from "./http";

// 회원가입
export const signup = async (payload) => {
  const { data } = await AUTH.post("/auth/signup", payload);
  return data;
};

// 로그인
export const login = async (payload) => {
  const { data } = await AUTH.post("/auth/login", payload);
  if (data?.access_token) {
    localStorage.setItem("access_token", data.access_token);
  }
  return data;
};

// 로그아웃
export const logout = async ({ redirect = true, message } = {}) => {
  // 서버 통지 API가 있으면 아래 주석 해제
  // try { await AUTH.post("/auth/logout"); } catch (_) {}

  // 클라이언트 세션 정리
  localStorage.removeItem("access_token");
  localStorage.removeItem("member");

  // 즉시 Authorization 헤더 제거
  if (API?.defaults?.headers?.common) {
    delete API.defaults.headers.common.Authorization;
  }

  // 로그인 화면으로 이동(+배너 메시지)
  if (redirect) {
    const q = message ? `?msg=${encodeURIComponent(message)}` : "";
    window.location.href = "/" + q; // 전체 리로드로 상태 초기화
  }
};

// 부서/권한 조회
export const getDepartments = async () => {
  const { data } = await AUTH.get("/auth/lookup/departments", {
    params: { for_user: "EMPLOYEE" },
  });
  return data;
};

export const getRoles = async () => {
  const { data } = await AUTH.get("/auth/lookup/roles", {
    params: { for_user: "EMPLOYEE" },
  });
  return data;
};

// 내 정보
export const getMe = async () => {
  const { data } = await AUTH.get("/auth/me");
  try {
    localStorage.setItem("member", JSON.stringify(data));
  } catch (_) {}
  return data;
};

// 프로필 수정
export const updateProfile = async (payload) => {
  const { data } = await AUTH.patch("/auth/me", payload);
  try {
    localStorage.setItem("member", JSON.stringify(data));
  } catch (_) {}
  return data;
};

// 비밀번호 변경
export const changePassword = async (payload) => {
  const { data } = await AUTH.put("/auth/me/password", payload);
  return data; // 204면 data 없음 가능
};
