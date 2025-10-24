import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import { login } from "../../services/api/auth";

export default function Login() {
  const nav = useNavigate();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // ✅ 로그인 요청 (FastAPI /auth/login)
      const data = await login({ login_id: loginId, password });

      // ✅ 로그인 성공 시 토큰과 사용자 정보 저장
      localStorage.setItem("accessToken", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.member));

      console.log("✅ 로그인 성공:", data.member);

      // ✅ 로그인 직후 상태 초기화 로직 추가
      const token = data.access_token;
      const memberId = data.member.member_id;

      // 🔹 1) 서버에 상태 초기화 요청 (업무중으로 변경)
      await fetch(`http://localhost:8000/api/member/reset-state/${memberId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // 🔹 2) localStorage의 user.current_state를 'WORKING'으로 덮어쓰기
      const updatedUser = { ...data.member, current_state: "WORKING" };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      console.log("🟢 로그인 후 상태 초기화 완료:", updatedUser);

      // ✅ 메인 페이지로 이동
      nav("/main");
    } catch (err) {
      console.error("🚨 로그인 실패:", err);
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
          onChange={(e) => setLoginId(e.target.value)}
          placeholder="예: 110001 / 100001"
        />
        <label>비밀번호</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="0000"
        />
        <Button type="submit" fullWidth variant="login">
          로그인
        </Button>
      </form>
      <div style={{ marginTop: 14, textAlign: "center" }}>
        <small>
          계정이 없나요?{" "}
          <a
            href="/signup"
            onClick={(e) => {
              e.preventDefault();
              nav("/signup");
            }}
          >
            회원가입
          </a>
        </small>
      </div>
    </div>
  );
}
