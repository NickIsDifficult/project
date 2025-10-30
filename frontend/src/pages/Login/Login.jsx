// frontend/src/pages/Login/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import { api } from "../../services/api";

// ✅ 응답에서 토큰만 뽑고, 접두사(Bearer/JWT)는 제거
function extractRawToken(res) {
  const raw =
    res?.access_token ||
    res?.token ||
    res?.jwt ||
    res?.result?.token ||
    "";

  if (typeof raw !== "string") return "";

  // "Bearer xxxxx" 또는 "JWT xxxxx" 형태면 접두사 제거
  if (raw.startsWith("Bearer ")) return raw.slice("Bearer ".length).trim();
  if (raw.startsWith("JWT ")) return raw.slice("JWT ".length).trim();

  return raw.trim();
}

export default function Login() {
  const nav = useNavigate();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const id = (loginId || "").trim();
    const pw = (password || "").trim();
    if (!id || !pw) {
      setError("아이디와 비밀번호를 입력하세요.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // /auth/login 호출 (api.js가 BASE 붙임)
      const res = await api("/auth/login", {
        method: "POST",
        body: { login_id: id, password: pw },
      });

      // ✅ raw 토큰만 저장
      const rawToken = extractRawToken(res);
      if (!rawToken) throw new Error("로그인 응답에 토큰이 없습니다.");

      // 통일: token / access_token 둘 다 저장 (호환)
      localStorage.setItem("token", rawToken);
      localStorage.setItem("access_token", rawToken);

      // (선택) 내 정보 미리 적재 — 실패해도 무시
      try {
        await api("/auth/me", { method: "GET", token: rawToken });
      } catch {
        // 401이어도 로그인 자체는 성공 처리 (토큰은 저장되어 있으므로 /api/* 호출 가능)
      }

      nav("/main");
    } catch (err) {
      const msg =
        err?.status === 401
          ? "아이디 또는 비밀번호가 올바르지 않습니다."
          : err?.message || "로그인 실패";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 360, margin: "60px auto" }}>
      <h1 style={{ marginBottom: 16 }}>로그인</h1>

      {error && (
        <div
          className="error"
          style={{
            background: "#ffe9e9",
            color: "#b00020",
            padding: "8px 12px",
            borderRadius: 6,
            marginBottom: 12,
            whiteSpace: "pre-wrap",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={onSubmit}>
        <label htmlFor="login-id">아이디</label>
        <input
          id="login-id"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          placeholder="예: 0000"
          autoComplete="username"
          disabled={loading}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <label htmlFor="login-pw">비밀번호</label>
        <input
          id="login-pw"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="0000"
          autoComplete="current-password"
          disabled={loading}
          style={{ width: "100%", marginBottom: 16 }}
        />

        <Button type="submit" fullWidth variant="login" disabled={loading}>
          {loading ? "로그인 중..." : "로그인"}
        </Button>
      </form>
    </div>
  );
}
