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
  const [userInfo, setUserInfo] = useState({ name: "", email: "" });
  const nav = useNavigate();

  useEffect(() => {
    const fetchMemberInfo = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/member/me/1");
        const data = await res.json();
        console.log("📥 내 정보:", data);
        if (data) {
          setUserInfo({
            name: data.name || "이름 없음",
            email: data.email || "이메일 없음",
          });
          if (data.current_state) setUserStatus(data.current_state);
        }
      } catch (err) {
        console.error("내 정보 불러오기 실패:", err);
      }
    };
    fetchMemberInfo();
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

      <button
        className="theme-toggle-fab"
        type="button"
        aria-label="Toggle theme"
        onClick={toggleTheme}
        title={theme === "dark" ? "라이트 모드" : "다크 모드"}
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      <div className="view-16">
        <div className="ellipse" />
        <div className="ellipse-2" />
        <div className="user-status-text">
          상태: {STATE_LABELS[userStatus] || "알수없음"}
        </div>

      </div>

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
            const response = await fetch(
              "http://localhost:8000/api/member/update-info/1",
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  current_state:
                    REVERSE_STATE[payload.status] || payload.status,
                  email: payload.email,
                }),
              }
            );
            const data = await response.json();
            console.log("Updated info:", data);
            if (data.current_state) setUserStatus(data.current_state);
            if (data.email)
              setUserInfo((prev) => ({ ...prev, email: data.email }));
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
