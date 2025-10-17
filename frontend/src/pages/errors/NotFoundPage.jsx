import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div style={{ textAlign: "center", marginTop: 100 }}>
      <h1>❌ 404 - 페이지를 찾을 수 없습니다.</h1>
      <p>요청하신 경로가 잘못되었거나 삭제되었습니다.</p>
      <Link
        to="/main"
        style={{
          display: "inline-block",
          marginTop: 16,
          color: "#6200ee",
          fontWeight: 600,
        }}
      >
        메인으로 돌아가기 →
      </Link>
    </div>
  );
}
