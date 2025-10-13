// src/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  // 로그인 안 된 경우 → 로그인 페이지로 리다이렉트
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // 로그인된 경우 → 원래 컴포넌트 렌더링
  return children;
}
