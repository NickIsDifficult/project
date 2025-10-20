// src/layout/AppShell.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PersonalInfoModal from "../pages/screens/Setting/PersonalInfoModal";
import "../pages/screens/style.css";
import useTheme from "../theme/useTheme";
import "./appshell.css";
import Sidebar from "./Sidebar";
import TopStage from "./TopStage";

export default function AppShell({ children }) {
  const { theme, toggleTheme } = useTheme();
  const [openSettings, setOpenSettings] = useState(false);
  const [userStatus, setUserStatus] = useState("WORKING");
  const [userInfo, setUserInfo] = useState({ name: "", role_name: "", email: "" });
  const nav = useNavigate();

  useEffect(() => {
    // ✅ 1) 로그인 정보(localStorage) 우선 반영
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUserInfo({
        name: parsed.name || "이름 없음",
        role_name: parsed.role_name || `직급 ID: ${parsed.role_id ?? "?"}`,
        email: parsed.email || "이메일 없음",
      });
    }

    // ✅ 2) DB 기준 최신 상태 갱신 (JWT 토큰 이용)
    const token = localStorage.getItem("accessToken");
    if (token) {
      (async () => {
        try {
          const res = await fetch("http://localhost:8000/api/member/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error("데이터 요청 실패");
          const data = await res.json();
          console.log("📥 내 정보:", data);
          if (data.current_state) setUserStatus(data.current_state);
        } catch (err) {
          console.error("내 정보 불러오기 실패:", err);
        }
      })();
    }
  }, []);

  // ✅ Enum 변환 매핑
  const STATE_LABELS = {
    WORKING: "업무중",
    FIELD: "외근",
    AWAY: "자리비움",
    OFF: "퇴근",
  };

  const REVERSE_STATE = {
    업무중: "WORKING",
    외근: "FIELD",
    자리비움: "AWAY",
    퇴근: "OFF",
  };

  return (
    <div className="screen">
      <TopStage />
      <Sidebar userStatus={userStatus} />

      {/* 🌙 다크모드 버튼 */}
      <button
        className="theme-toggle-fab"
        type="button"
        aria-label="Toggle theme"
        onClick={toggleTheme}
        title={theme === "dark" ? "라이트 모드" : "다크 모드"}
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      {/* ✅ 프로필 카드 */}
      <div className="view-16">
        {/* 큰 원 (프로필 이미지) */}
        <div className="ellipse">
          <img
            src="https://cdn-icons-png.flaticon.com/512/847/847969.png"
            alt="프로필"
            className="profile-img"
          />
        </div>

        {/* 작은 원 (상태 표시) */}
        <div
          className="ellipse-2"
          style={{
            backgroundColor: {
              WORKING: "#2ecc71", // 초록
              AWAY: "#f1c40f", // 노랑
              FIELD: "#e74c3c", // 빨강
              OFF: "#9e9e9e", // 회색
            }[userStatus],
          }}
          title={STATE_LABELS[userStatus]}
        />

        {/* 이름 / 직급 텍스트 */}
        <div className="profile-info">
          <div className="profile-name">{userInfo.name}</div>
          <div className="profile-role">{userInfo.role_name}</div>
        </div>
      </div>

      {/* 하단 고정 메뉴 */}
      <div className="view-bottom">
        <div
          className="nav-item settings-item"
          role="button"
          tabIndex={0}
          onClick={() => setOpenSettings(true)}
        >
          <div className="rectangle-4" />
          <div className="text-wrapper">설정</div>
          <div className="frame" />
        </div>

        <div
          className="nav-item employees-item"
          role="button"
          tabIndex={0}
          onClick={() => nav("/employees")}
        >
          <div className="rectangle-4" />
          <div className="text-wrapper">직원관리</div>
          <div className="frame" />
        </div>
      </div>

      {/* ✅ 개인정보 수정 팝업 */}
      <PersonalInfoModal
        open={openSettings}
        initial={{
          status: STATE_LABELS[userStatus],
          name: userInfo.name,
          email: userInfo.email,
        }}
        onClose={() => setOpenSettings(false)}
        onSave={async (payload) => {
          try {
            const token = localStorage.getItem("accessToken");
            const response = await fetch("http://localhost:8000/api/member/update-info/1", {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                current_state: REVERSE_STATE[payload.status] || payload.status,
                email: payload.email,
              }),
            });
            const data = await response.json();
            console.log("Updated info:", data);
            if (data.current_state) setUserStatus(data.current_state);
            if (data.email) setUserInfo((prev) => ({ ...prev, email: data.email }));
          } catch (err) {
            console.error("업데이트 실패:", err);
          } finally {
            setOpenSettings(false);
          }
        }}
      />

      <main className="appstage-content">{children}</main>
    </div>
  );
}
