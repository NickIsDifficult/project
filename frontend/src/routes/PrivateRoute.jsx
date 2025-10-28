// src/routes/PrivateRoute.jsx
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import { Loader } from "../components/common/Loader";
import { useAuth } from "../hooks/useAuth";

export default function PrivateRoute({ children, allowedRoles = [], adminOnly = false }) {
  const { loading, authed, userRole, isAdmin, deptNo, roleNo } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) return <Loader message="🔑 인증 확인 중..." />;

  if (!authed) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // ✅ 관리자 전용 페이지일 때 접근 제한
  if (adminOnly && !isAdmin) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#b00020" }}>
        <h2>🚫 관리자 전용 페이지입니다.</h2>
        <p>
          현재 부서번호: <strong>{deptNo || "N/A"}</strong> / 직급번호:{" "}
          <strong>{roleNo || "N/A"}</strong>
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

  // ✅ 일반 roles 기반 접근 (기존 유지)
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

  return children;
}
