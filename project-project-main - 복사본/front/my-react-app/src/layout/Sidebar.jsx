// src/layout/Sidebar.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../screens/style.css"; // 메인 CSS 재사용

export default function Sidebar() {
  const [workOpen, setWorkOpen] = useState(true);
  const nav = useNavigate();

  return (
    <div className={`group ${workOpen ? "work-open" : "work-collapsed"}`}>
      <div className="rectangle-3" />

      {/* 좌상단 로고 */}
      <Link to="/" className="logo-link sidebar-logo" aria-label="홈으로">
        <img
          className="img"
          alt="Colink"
          src="https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68da46ef5d1675b4fdbce4fc/img/colink-2.png"
        />
      </Link>

      <div className="view">
        {/* 조직도 */}
        <div className="view-2" role="button" tabIndex={0} onClick={() => nav("/org-chart")}>
          <div className="rectangle-4" />
          <div className="text-wrapper">조직도</div>
          <div className="frame"><img className="vector" alt="" src="https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68da46ef5d1675b4fdbce4fc/img/vector.svg" /></div>
        </div>

        {/* 휴지통 */}
        <div className="view-3" role="button" tabIndex={0} onClick={() => nav("/trash")}>
          <div className="rectangle-4" />
          <div className="text-wrapper">휴지통</div>
          <div className="vector-wrapper"><img className="vector-2" alt="" src="https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68da46ef5d1675b4fdbce4fc/img/vector-1.svg" /></div>
        </div>

        {/* 알람 */}
        <div className="view-4" role="button" tabIndex={0} onClick={() => nav("/alerts")}>
          <div className="rectangle-4" />
          <div className="text-wrapper">알람</div>
          <div className="frame"><img className="vector-3" alt="" src="https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68da46ef5d1675b4fdbce4fc/img/vector-2.svg" /></div>
        </div>

        {/* 공지사항 */}
        <div className="view-5" role="button" tabIndex={0} onClick={() => nav("/notices")}>
          <div className="rectangle-4" />
          <div className="text-wrapper">공지사항</div>
          <div className="img-wrapper"><img className="vector-4" alt="" src="https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68da2463633ac1c4e1c08a6f/img/vector-5.svg" /></div>
        </div>

        {/* 검색 */}
        <div className="view-6" role="button" tabIndex={0} onClick={() => nav("/search")}>
          <div className="rectangle-4" />
          <div className="text-wrapper">검색</div>
          <div className="frame"><img className="vector-2" alt="" src="https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68d62b16ff595e99e495402d/img/vector-14.svg" /></div>
        </div>

        {/* 업무 상단 선 */}
        <img className="line" alt="Line"
             src="https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68da46ef5d1675b4fdbce4fc/img/line-1.svg" />

        {/* 업무 그룹 */}
        <div className={`view-7 ${workOpen ? "expanded" : "collapsed"}`}>
          <div className="view-8" role="button" onClick={() => nav("/calendar")}>
            <div className="rectangle-4" />
            <div className="text-wrapper">캘린더</div>
            <div className="frame-2"><img className="vector-5" alt="" src="https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68d62b16ff595e99e495402d/img/vector-2.svg" /></div>
          </div>

          <div className="view-9" role="button" onClick={() => nav("/dashboard")}>
            <div className="rectangle-4" />
            <div className="text-wrapper">대시보드</div>
            <div className="frame-2"><img className="vector-6" alt="" src="https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68d62b16ff595e99e495402d/img/vector-4.svg" /></div>
          </div>

          <div className="view-10" role="button" onClick={() => nav("/TaskManager")}>
            <div className="rectangle-4" />
            <div className="text-wrapper">내 업무</div>
            <div className="frame-2"><img className="vector-7" alt="" src="https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68d62b16ff595e99e495402d/img/vector-3.svg" /></div>
          </div>

          {/* '업무' 헤더 / 토글 */}
          <div className="view-11" role="button" tabIndex={0}
               aria-expanded={workOpen}
               onClick={() => setWorkOpen(v => !v)}>
            <div className="text-wrapper-2">업무</div>
            <div className="frame-3 arrow">
              <img className="vector-8" alt=""
                   src="https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68da46ef5d1675b4fdbce4fc/img/vector-8.svg" />
            </div>
          </div>
        </div>

        {/* 업무 하단 선 */}
        <img className="line-2" alt="Line"
             src="https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68da46ef5d1675b4fdbce4fc/img/line-2.svg" />
      </div>
    </div>
  );
}
