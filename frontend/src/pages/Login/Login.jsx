// frontend/src/pages/Login/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import { api } from "../../services/api";

/** ✅ FastAPI JWT 응답용 최종 버전 */
function extractRawToken(res) {
  if (!res || typeof res !== "object") return "";

  // 1️⃣ access_token이 가장 흔한 구조
  if (typeof res.access_token === "string" && res.access_token.length > 10)
    return res.access_token.trim();

  // 2️⃣ 기타 형태 대비
  const candidate =
    res.token ||
    res.jwt ||
    res.result?.token ||
    res.result?.access_token ||
    "";

  if (typeof candidate !== "string") return "";

  if (candidate.startsWith("Bearer ")) return candidate.slice(7).trim();
  if (candidate.startsWith("JWT ")) return candidate.slice(4).trim();

  return candidate.trim();
}

export default function Login() {
  const nav = useNavigate();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (loading) return;

    const id = loginId.trim();
    const pw = password.trim();
    if (!id || !pw) {
      setError("아이디와 비밀번호를 입력하세요.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // 1️⃣ 로그인 요청
      const res = await api("/auth/login", {
        method: "POST",
        body: { login_id: id, password: pw },
      });

      console.log("✅ 로그인 응답:", res);

      // 2️⃣ access_token 추출
      const rawToken = extractRawToken(res);
      console.log("✅ 추출된 토큰:", rawToken);

      // ✅ 토큰 저장
      if (rawToken && rawToken.length > 10) {
        localStorage.setItem("token", rawToken);
        localStorage.setItem("access_token", rawToken);
      } else {
        console.warn("⚠️ access_token이 예상보다 짧음:", rawToken);
        throw new Error("로그인 응답에 토큰이 없습니다.");
      }

      // 3️⃣ /auth/me 검증 (선택)
      try {
        const me = await api("/auth/me", { method: "GET", token: rawToken });
        console.log("✅ /auth/me 검증 성공:", me);
      } catch (verifyErr) {
        console.warn("⚠️ 토큰 검증 실패 (무시 가능):", verifyErr);
      }

      // 4️⃣ 성공 이동
      nav("/main");
    } catch (err) {
      console.error("로그인 실패:", err);
      const msg =
        err?.status === 401
          ? "아이디 또는 비밀번호가 올바르지 않습니다."
          : err?.message || "로그인 실패";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 360, margin: "60px auto" }}>
      <h1 style={{ marginBottom: 16 }}>로그인</h1>

      {error && (
        <div
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
