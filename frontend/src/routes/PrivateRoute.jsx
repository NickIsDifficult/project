import React from "react";
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    // 로그인 안 된 경우 → 로그인 페이지로 이동
    return <Navigate to="/login" replace />;
  }

  // 로그인된 경우 → 요청한 페이지 렌더링
  return children;
}
