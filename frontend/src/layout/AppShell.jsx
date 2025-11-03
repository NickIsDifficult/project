// src/layout/AppShell.jsx

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../pages/screens/style.css";
import "./appshell.css";

import Sidebar from "./Sidebar";
import TopStage from "./TopStage";

import PersonalInfoModal from "../pages/screens/Setting/PersonalInfoModal";
import useTheme from "../theme/useTheme";

// 🔁 백엔드 API 래퍼 (axios 기반)
import { changePassword, getMe, logout, updateProfile } from "../services/api/auth";

import API from "../services/api/http"; // ✅ axios 인스턴스 추가

export default function AppShell({ children }) {
  const { theme, toggleTheme } = useTheme();

  const [openSettings, setOpenSettings] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: "",
    role_name: "",
    email: "",
  });
  const [userStatus, setUserStatus] = useState("WORKING");
  const [showMenu, setShowMenu] = useState(false);
  const [me, setMe] = useState(null);
  const nav = useNavigate();

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

  const fetchMe = useCallback(async () => {
    try {
      const data = await getMe();

      const profile = data?.member ?? {};

      setMe(profile);

      setUserInfo({
        name: profile.name ?? "이름 없음",
        email: profile.email ?? "이메일 없음",
        role_name: profile.role_name ?? profile.role_no ?? "직급 정보 없음",
      });

      if (profile.current_state) {
        setUserStatus(String(profile.current_state).toUpperCase());
      }
    } catch (err) {
      console.error("내 정보 불러오기 실패:", err);

      logout({
        redirect: true,
        message: "세션이 만료되었습니다. 다시 로그인해주세요.",
      });
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  // ✅ 근무 상태 변경 (axios 버전)
  const handleStatusChange = async newStatus => {
    try {
      setUserStatus(newStatus);
      setShowMenu(false);

      await API.put("/employees/update-status/me", {
        current_state: newStatus,
      });

      console.log("✅ 상태 변경 완료:", newStatus);
    } catch (err) {
      console.error("❌ 상태 변경 실패:", err);
      alert("상태 변경 중 오류가 발생했습니다.\n" + (err?.message || "네트워크 오류"));
    }
  };

  const handleSave = async payload => {
    try {
      await updateProfile({
        name: payload.name,
        email: payload.email,
      });

      if (payload.password?.current && payload.password?.next) {
        await changePassword({
          current: payload.password.current,
          next: payload.password.next,
        });

        alert("설정이 저장되어 로그아웃되었습니다. 다시 로그인해주세요.");

        logout({
          redirect: true,
          message: "비밀번호가 변경되었습니다. 다시 로그인하세요.",
        });

        return;
      }

      await fetchMe();
      setOpenSettings(false);
      alert("저장되었습니다.");
    } catch (err) {
      console.error("❌ 저장 오류:", err);
      alert("저장 중 오류가 발생했습니다.\n" + (err?.message || "알 수 없는 오류"));
    }
  };

  return (
    <div className="screen">
      <TopStage />
      <Sidebar userStatus={userStatus} />

      {/* 다크모드 토글 */}
      <button
        className="theme-toggle-fab"
        type="button"
        aria-label="Toggle theme"
        onClick={toggleTheme}
        title={theme === "dark" ? "라이트 모드" : "다크 모드"}
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      {/* 프로필 카드 */}
      <div className="view-16">
        <div className="ellipse">
          <img
            src="https://cdn-icons-png.flaticon.com/512/847/847969.png"
            alt="프로필"
            className="profile-img"
          />
        </div>

        <div
          className={`ellipse-2 ${userStatus}`}
          title={STATE_LABELS[userStatus]}
          onClick={() => setShowMenu(prev => !prev)}
        />

        {showMenu && (
          <div className="status-menu">
            {Object.entries(STATE_LABELS).map(([key, label]) => (
              <div key={key} className="status-option" onClick={() => handleStatusChange(key)}>
                <div
                  className="status-dot"
                  style={{
                    backgroundColor:
                      key === "OFF"
                        ? "#9e9e9e"
                        : {
                            WORKING: "#2ecc71",
                            FIELD: "#e74c3c",
                            AWAY: "#f1c40f",
                          }[key],
                    borderRadius: "50%",
                    width: "12px",
                    height: "12px",
                    marginRight: "8px",
                    position: "relative",
                  }}
                >
                  {key === "OFF" && (
                    <div
                      style={{
                        width: "4px",
                        height: "4px",
                        backgroundColor: "#616161",
                        borderRadius: "50%",
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                  )}
                </div>
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="profile-info">
          <div className="profile-name">{userInfo.name}</div>
          <div className="profile-role">{userInfo.role_name}</div>
        </div>
      </div>

      {/* 좌하단 개인정보 수정 */}
      <div className="view-bottom">
        <div
          className="nav-item settings-item"
          role="button"
          tabIndex={0}
          onClick={() => setOpenSettings(true)}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === " ") setOpenSettings(true);
          }}
        >
          <div className="rectangle-4" />
          <div className="text-wrapper">개인정보수정</div>
          <div className="frame" />
        </div>
      </div>

      <PersonalInfoModal
        open={openSettings}
        initial={{
          name: userInfo.name || "",
          email: userInfo.email || "",
        }}
        onClose={() => setOpenSettings(false)}
        onSave={handleSave}
      />

      <main className="appstage-content">{children}</main>
    </div>
  );
}
