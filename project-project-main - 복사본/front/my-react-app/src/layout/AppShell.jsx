// src/layout/AppShell.jsx
import React, { useState } from "react";
import TopStage from "./TopStage";
import Sidebar from "./Sidebar";
import "../screens/style.css"; // 네가 준 CSS 그대로 재사용
import "./appshell.css";      // 중앙 컨텐츠 위치/스크롤만 보조

// ✅ 다크모드/설정 팝업 연동
import useTheme from "../theme/useTheme";
import PersonalInfoModal from "../screens/Setting/PersonalInfoModal";
import { useNavigate } from "react-router-dom";

export default function AppShell({ children }) {
  const { theme, toggleTheme } = useTheme();
  const [openSettings, setOpenSettings] = useState(false);
  const nav = useNavigate();

  return (
    <div className="screen">
      {/* 상단/배경 레이어 */}
      <TopStage />
      {/* 좌측 사이드바 */}
      <Sidebar />

      {/* ✅ 다크모드 토글 (우상단 FAB) */}
      <button
        className="theme-toggle-fab"
        type="button"
        aria-label="Toggle theme"
        onClick={toggleTheme}
        title={theme === "dark" ? "라이트 모드" : "다크 모드"}
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      {/* ✅ 프로필 카드 (view-16) */}
      <div className="view-16">
        <div className="ellipse" />
        <div className="ellipse-2" />
      </div>

      {/* ✅ 좌하단 설정/직원관리 영역 (view-bottom) */}
      <div className="view-bottom">
        {/* 설정 */}
        <div
          className="nav-item settings-item"
          role="button" tabIndex={0}
          onClick={() => setOpenSettings(true)}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpenSettings(true)}
        >
          <div className="rectangle-4" />
          <div className="text-wrapper">설정</div>
          <div className="frame" />
        </div>

        {/* 직원관리 */}
        <div
          className="nav-item employees-item"
          role="button" tabIndex={0}
          onClick={() => nav("/employees")}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && nav("/employees")}
        >
          <div className="rectangle-4" />
          <div className="text-wrapper">직원관리</div>
          <div className="frame" />
        </div>
      </div>

      {/* ✅ 개인정보 수정 팝업 */}
      <PersonalInfoModal
        open={openSettings}
        initial={{ status: "WORKING", name: "홍길동", email: "test@example.com" }}
        onClose={() => setOpenSettings(false)}
        onSave={(payload) => {
          console.log("settings save:", payload); // TODO: 백엔드 연동
          setOpenSettings(false);
        }}
      />

      {/* 중앙 컨텐츠(.div 영역 위에 겹침) */}
      <main className="appstage-content">
        {children}
      </main>
    </div>
  );
}
