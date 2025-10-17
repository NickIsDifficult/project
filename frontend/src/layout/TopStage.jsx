// src/layout/TopStage.jsx
import { Link } from "react-router-dom";
import "../pages/screens/style.css"; // 이미 있는 메인 CSS 재사용

export default function TopStage() {
  return (
    <div className="UI">
      <div className="rectangle" />
      <div className="div" />
      <div className="rectangle-2" />

      {/* 상단 중앙 로고 */}
      <Link to="/" className="logo-link top-logo" aria-label="홈으로">
        <img
          className="colink"
          alt="Colink"
          src="https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68da46ef5d1675b4fdbce4fc/img/colink-2.png"
        />
      </Link>
    </div>
  );
}
