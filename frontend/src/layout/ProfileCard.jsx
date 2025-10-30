// src/layout/ProfileCard.jsx
import { useState } from "react";
import "./profile-card.css";

export default function ProfileCard({ user, userStatus, onStatusChange }) {
  const STATUS_LABELS = {
    WORKING: "출근",
    FIELD: "외근",
    AWAY: "자리비움",
    OFF: "퇴근",
  };

  const STATUS_COLOR = {
    WORKING: "#4CAF50",   // 녹색
    FIELD: "#E53935",     // 빨강
    AWAY: "#FFC107",      // 노랑
    OFF: "#BDBDBD",       // 연회색 (외곽)
  };

  const [menuOpen, setMenuOpen] = useState(false);

  const handleClick = () => setMenuOpen((prev) => !prev);

  const handleSelect = (newStatus) => {
    onStatusChange(newStatus);
    setMenuOpen(false);
  };

  return (
    <div className="profile-card">
      <div className="profile-avatar">
        <img src="/avatar.png" alt="avatar" />
      </div>

      <div className="profile-info">
        <div className="profile-name">{user.name}</div>
        <div className="profile-email">{user.email}</div>
      </div>

      {/* 상태 표시 점 */}
      <div
        className={`status-dot ${userStatus === "OFF" ? "status-dot--off" : ""}`}
        style={{
          backgroundColor:
            userStatus === "OFF" ? STATUS_COLOR.OFF : STATUS_COLOR[userStatus],
        }}
        onClick={handleClick}
        title={`현재 상태: ${STATUS_LABELS[userStatus]}`}
      >
        {/* 퇴근 상태일 때 내부 점 */}
        {userStatus === "OFF" && <div className="status-dot-inner" />}
      </div>

      {/* 상태 변경 메뉴 */}
      {menuOpen && (
        <div className="status-menu">
          {Object.keys(STATUS_LABELS).map((key) => (
            <div
              key={key}
              className="status-option"
              onClick={() => handleSelect(key)}
            >
              <div
                className={`status-sample ${
                  key === "OFF" ? "status-sample--off" : ""
                }`}
                style={{ backgroundColor: STATUS_COLOR[key] }}
              >
                {key === "OFF" && <div className="status-sample-inner" />}
              </div>
              <span>{STATUS_LABELS[key]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
