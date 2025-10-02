// frontend/src/api/http.js
import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://127.0.0.1:8000",
  withCredentials: false,
});

// 요청 인터셉터: JWT 자동 첨부
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;  
  return config;
});

export default API;
