// frontend/src/pages/Login/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import { login } from "../../services/api/auth";

export default function Login() {
  const nav = useNavigate();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async e => {
    e.preventDefault();
    setError("");
    try {
      const res = await login({ login_id: loginId, password });
      localStorage.setItem("access_token", res.access_token);
      nav("/main");
    } catch (err) {
      const msg = err?.response?.data?.detail || "로그인 실패";
      setError(msg);
    }
  };

  return (
    <div className="container">
      <h1>로그인</h1>
      {error && <div className="error">{error}</div>}
      <form onSubmit={onSubmit}>
        <label>아이디</label>
        <input
          value={loginId}
          onChange={e => setLoginId(e.target.value)}
          placeholder="예: 110001 / 100001"
        />
        <label>비밀번호</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="0000"
        />
        <Button type="submit" fullWidth variant="login">
          로그인
        </Button>
      </form>
    </div>
  );
}
