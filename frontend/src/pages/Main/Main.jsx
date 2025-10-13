// frontend/src/pages/Main/Main.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import ButtonLogin from "../../components/common/ButtonLogin";

export default function Main() {
  const nav = useNavigate();
  const token = localStorage.getItem("access_token");

  const logout = () => {
    localStorage.removeItem("access_token");
    nav("/");
  };

  return (
    <div className="container">
      <h1>메인</h1>
      <p className="success">JWT 토큰이 저장되어 있습니다.</p>
      <pre style={{ whiteSpace: "pre-wrap", background: "#f4f6f8", padding: 12, borderRadius: 12 }}>
        {token ? token : "토큰 없음"}
      </pre>
      <ButtonLogin onClick={logout} style={{ background: "#444" }}>
        로그아웃
      </ButtonLogin>
    </div>
  );
}
