// src/layout/Sidebar.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "./colink-2.png";
import "./sidebar.css";

const WORK_LINKS = [
  {
    label: "내 업무",
    to: "/projects",
    icon:
      "https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68d62b16ff595e99e495402d/img/vector-3.svg",
  },
  {
    label: "대시보드",
    to: "/main",
    icon:
      "https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68d62b16ff595e99e495402d/img/vector-4.svg",
  },
  {
    label: "캘린더",
    to: "/calendar",
    icon:
      "https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68d62b16ff595e99e495402d/img/vector-2.svg",
  },
];

const PRIMARY_LINKS = [
  {
    label: "공지사항",
    to: "/notices",
    icon:
      "https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68da2463633ac1c4e1c08a6f/img/vector-5.svg",
  },
  ,
  {
    label: "검색",
    to: "/search",
    icon:
      "https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68d62b16ff595e99e495402d/img/vector-14.svg",
  },
  {
    label: "휴지통",
    to: "/trashbin",
    icon:
      "https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68da46ef5d1675b4fdbce4fc/img/vector-1.svg",
  },
  {
    label: "알람",
    to: "/alerts",
    icon:
      "https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68da46ef5d1675b4fdbce4fc/img/vector-2.svg",
  },
  {
    label: "조직도",
    to: "/org-chart",
    icon:
      "https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68da46ef5d1675b4fdbce4fc/img/vector.svg",
  },
];

const ADMIN_LINKS = [
  { label: "계정생성", to: "/signup" },
  { label: "계정관리", to: "/admin/account" },
  { label: "부서 및 직급관리", to: "/admin/dept_roles" },
];

export default function Sidebar({ onOpenSettings = () => {} }) {
  const [workOpen, setWorkOpen] = useState(true);
  const [adminOpen, setAdminOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigate = path => navigate(path);

  const renderNavItem = item => (
    <button
      key={item.to}
      type="button"
      className="sidebar__item"
      onClick={() => handleNavigate(item.to)}
    >
      {item.icon && (
        <span className="sidebar__icon" aria-hidden="true">
          <img src={item.icon} alt="" loading="lazy" />
        </span>
      )}
      <span className="sidebar__label">{item.label}</span>
    </button>
  );

  return (
    <aside className="sidebar" aria-label="주 메뉴">
      {/* 로고 */}
      <Link to="/main" className="sidebar__logo" aria-label="홈으로">
        <img
          src={logo}
          alt="COLINK"
          loading="lazy"
        />
      </Link>

      {/* 기본 메뉴 */}
      <nav className="sidebar__nav" aria-label="기본 메뉴">
        {PRIMARY_LINKS.map(renderNavItem)}
      </nav>

      {/* 업무 섹션 */}
      <section className="sidebar__section" aria-label="업무 메뉴">
        <button
          type="button"
          className="sidebar__section-toggle"
          aria-expanded={workOpen}
          onClick={() => setWorkOpen(prev => !prev)}
        >
          <span className="sidebar__section-title">업무</span>
          <span className={`sidebar__chevron ${workOpen ? "is-open" : ""}`} aria-hidden="true">
            ▾
          </span>
        </button>

        <div className={`sidebar__collapse ${workOpen ? "is-open" : ""}`}>
          {WORK_LINKS.map(renderNavItem)}
        </div>
      </section>

      {/* 관리자 섹션 */}
      <section className="sidebar__section" aria-label="관리자 메뉴">
        <button
          type="button"
          className="sidebar__section-toggle"
          aria-expanded={adminOpen}
          onClick={() => setAdminOpen(prev => !prev)}
        >
          <span className="sidebar__section-title">관리자</span>
          <span className={`sidebar__chevron ${adminOpen ? "is-open" : ""}`} aria-hidden="true">
            ▾
          </span>
        </button>

        <div className={`sidebar__collapse ${adminOpen ? "is-open" : ""}`}>
          {ADMIN_LINKS.map(renderNavItem)}
        </div>
      </section>

      {/* 하단 */}
      <div className="sidebar__spacer" />

      <button type="button" className="sidebar__settings" onClick={onOpenSettings}>
        개인정보 수정
      </button>
    </aside>
  );
}
