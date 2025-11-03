// src/layout/AppShell.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import "./appshell.css";

import PersonalInfoModal from "../pages/screens/Setting/PersonalInfoModal";
import useTheme from "../theme/useTheme";
import Sidebar from "./Sidebar";
import TopStage from "./TopStage";

import { changePassword, getMe, logout, updateProfile } from "../services/api/auth";
import API from "../services/api/http";

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
  const statusMenuRef = useRef(null);

  const STATE_LABELS = {
    WORKING: "업무중",
    FIELD: "외근",
    AWAY: "자리비움",
    OFF: "퇴근",
  };

  // ✅ 사용자 정보 가져오기
  const fetchMe = useCallback(async () => {
    try {
      const data = await getMe();
      const profile = data?.member ?? {};

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

  // ✅ 상태 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = e => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  // ✅ 근무 상태 변경
  const handleStatusChange = async newStatus => {
    try {
      setUserStatus(newStatus);
      setShowMenu(false);

      await API.put("/employees/update-status/me", {
        current_state: newStatus,
      });
    } catch (err) {
      console.error("상태 변경 실패:", err);
      alert("상태 변경 중 오류가 발생했습니다.");
    }
  };

  // ✅ 개인정보 수정 저장
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
        logout({ redirect: true });
        return;
      }

      await fetchMe();
      setOpenSettings(false);
      alert("저장되었습니다.");
    } catch (err) {
      console.error("저장 오류:", err);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className={`app-shell theme-${theme}`}>
      {/* 상단 헤더 */}
      <header className="app-shell__header">
        <div className="app-shell__header-left">
          <TopStage />
        </div>

        <div className="app-shell__header-right">
          <button
            className="app-shell__theme-toggle"
            type="button"
            onClick={toggleTheme}
            title={theme === "dark" ? "라이트 모드" : "다크 모드"}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          <div className="app-shell__profile" ref={statusMenuRef}>
            <div className="app-shell__avatar">
              <img
                src="https://cdn-icons-png.flaticon.com/512/847/847969.png"
                alt="프로필"
                loading="lazy"
              />
            </div>

            <div className="app-shell__profile-text">
              <span className="app-shell__profile-name">{userInfo.name}</span>
              <span className="app-shell__profile-role">{userInfo.role_name}</span>
            </div>

            <button
              type="button"
              className={`app-shell__status-toggle app-shell__status-toggle--${(userStatus || "").toLowerCase()}`}
              title={STATE_LABELS[userStatus]}
              onClick={() => setShowMenu(prev => !prev)}
            >
              {userStatus === "OFF" && <span className="app-shell__status-toggle-inner" />}
            </button>

            {showMenu && (
              <div className="app-shell__status-menu">
                {Object.entries(STATE_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className="app-shell__status-option"
                    onClick={() => handleStatusChange(key)}
                  >
                    <span
                      className={`app-shell__status-swatch app-shell__status-swatch--${key.toLowerCase()}`}
                    >
                      {key === "OFF" && <span className="app-shell__status-swatch-inner" />}
                    </span>
                    <span className="app-shell__status-label">{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 본문 */}
      <div className="app-shell__body">
        <Sidebar onOpenSettings={() => setOpenSettings(true)} />
        <main className="app-shell__content">{children}</main>
      </div>

      {/* 개인정보 수정 모달 */}
      <PersonalInfoModal
        open={openSettings}
        initial={{
          name: userInfo.name || "",
          email: userInfo.email || "",
        }}
        onClose={() => setOpenSettings(false)}
        onSave={handleSave}
      />
    </div>
  );
}
