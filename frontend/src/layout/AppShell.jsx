// src/layout/AppShell.jsx

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import "../pages/screens/style.css";
import "./appshell.css";

import Sidebar from "./Sidebar";
import TopStage from "./TopStage";

import PersonalInfoModal from "../pages/screens/Setting/PersonalInfoModal";
import useTheme from "../theme/useTheme";

// 🔁 백엔드 API 래퍼 (axios 기반) 재사용
//    /auth/me, /auth/me/password 등 이미 여기에 구현돼 있음
import {
  getMe, 
  updateProfile,
  changePassword,
  logout,
} from "../services/api/auth";

export default function AppShell({ children }) {
  const { theme, toggleTheme } = useTheme();

  // 모달 열림 여부
  const [openSettings, setOpenSettings] = useState(false);

  // 화면 표시용 유저 정보
  const [userInfo, setUserInfo] = useState({
    name: "",
    role_name: "",
    email: "",
  });

  // 현재 근무상태(상단 초록/노랑 점)
  const [userStatus, setUserStatus] = useState("WORKING");

  // 상태 드롭다운 온/오프
  const [showMenu, setShowMenu] = useState(false);

  // 백엔드에서 받은 풀 프로필 (member_id 등)
  const [me, setMe] = useState(null);

  const nav = useNavigate();

  // 상태 코드 ↔ 라벨 맵
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
      const data = await getMe(); // { member: {...} }
      console.log("📥 /auth/me 응답:", data);

      const profile = data?.member ?? {};

      setMe(profile);

      setUserInfo({
        name: profile.name ?? "이름 없음",
        email: profile.email ?? "이메일 없음",
        role_name:
          profile.role_name ??
          profile.role_no ??
          "직급 정보 없음",
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

  const handleStatusChange = async newStatus => {
    setUserStatus(newStatus);
    setShowMenu(false);
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
      alert(
        "저장 중 오류가 발생했습니다.\n" +
          (err?.message || "알 수 없는 오류"),
      );
    }
  };

  return (
    <div className="screen">
      {/* 상단 영역 */}
      <TopStage />

      {/* 좌측 사이드바 */}
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
              <div
                key={key}
                className="status-option"
                onClick={() => handleStatusChange(key)}
              >
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

      {/* 좌하단 고정: 개인정보수정 버튼 */}
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

      {/* 중앙 컨텐츠 */}
      <main className="appstage-content">{children}</main>
    </div>
  );
}
