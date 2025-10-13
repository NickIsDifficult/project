// src/Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // 로그인 요청
  async function submit(e) {
    e.preventDefault();

    try {
      const res = await api("/login", { 
        method: "POST", 
        body: { username, password } 
      });

      if (res.success) {
        // JWT 저장
        localStorage.setItem("token", res.token);

        // 로그인 상태 업데이트
        onLogin();

        // 🚀 공지사항 페이지로 이동
        navigate("/notices");
      } else {
        alert("로그인 실패: " + res.message);
      }
    } catch (err) {
      console.error("로그인 에러:", err);
      alert("서버 오류 발생");
    }
  }

  return (
    <form onSubmit={submit}>
      <input
        value={username}
        onChange={e => setUsername(e.target.value)}
        placeholder="아이디"
        required
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="비밀번호"
        required
      />
      <button type="submit">로그인</button>
    </form>
  );
}
