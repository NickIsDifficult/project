// src/routes/PrivateRoute.jsx
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import { Loader } from "../components/common/Loader";
import { useAuth } from "../hooks/useAuth";

export default function PrivateRoute({ children, allowedRoles = [] }) {
  const { loading, authed, userRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) return <Loader message="🔑 인증 확인 중..." />;

  // 로그인 안 된 사용자 → 로그인 페이지로 이동
  if (!authed) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // Role 제한이 있을 경우
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#b00020" }}>
        <h2>🚫 접근 권한이 없습니다.</h2>
        <p>
          현재 계정 역할: <strong>{userRole || "N/A"}</strong>
        </p>
        <Button
          variant="primary"
          onClick={() => navigate("/main")}
          style={{ fontSize: 15, fontWeight: 600 }}
        >
          메인으로 이동
        </Button>
      </div>
    );
  }

  // 모든 조건 통과 시 페이지 렌더링
  return children;
}
