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
