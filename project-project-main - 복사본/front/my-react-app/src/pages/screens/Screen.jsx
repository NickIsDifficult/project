// src/screens/Screen.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useTheme from "../../theme/useTheme";
import PersonalInfoModal from "./Setting/PersonalInfoModal";
import "./style.css";

// 간단 모달 컴포넌트 (더블클릭 핸들러 onDouble 추가)
function Modal({ open, title, onClose, onDouble, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = e => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-panel"
        onClick={e => e.stopPropagation()}
        onDoubleClick={onDouble} // ← 더블클릭 시 동작
      >
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

const Screen = () => {
  const [modal, setModal] = useState(null); // 'ann' | 'proj' | 'noti' | 'cal' | null
  const [workOpen, setWorkOpen] = useState(true);
  // useTheme가 toggleTheme을 리턴한다면 키 맞추기
  const { theme, toggleTheme } = useTheme();
  const nav = useNavigate();
  const [openSettings, setOpenSettings] = useState(false);

  // 모달 타입 → 임시 라우트 매핑
  const modalToPath = {
    ann: "/notices",
    proj: "/dashboard",
    noti: "/alerts",
    cal: "/calendar",
  };

  return (
    <div className="screen">
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

      <div className="UI">
        <div className="rectangle" />
        <div className="div" />
        <div className="rectangle-2" />

        {/* 상단 중앙 로고 → 홈 */}
        <Link to="/" className="logo-link top-logo" aria-label="홈으로">
          <img
            className="colink"
            alt="Colink"
            src="https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68da46ef5d1675b4fdbce4fc/img/colink-2.png"
          />
        </Link>
      </div>

      <div className={`group ${workOpen ? "work-open" : "work-collapsed"}`}>
        <div className="rectangle-3" />

        {/* 좌상단 로고 → 홈 */}
        <Link to="/" className="logo-link sidebar-logo" aria-label="홈으로">
          <img
            className="img"
            alt="Colink"
            src="https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68da46ef5d1675b4fdbce4fc/img/colink-2.png"
          />
        </Link>

        <div className="view">
          {/* 조직도 */}
          <div
            className="view-2"
            role="button"
            tabIndex={0}
            onClick={() => nav("/org-chart")}
            onKeyDown={e => (e.key === "Enter" || e.key === " ") && nav("/org-chart")}
          >
            <div className="rectangle-4" />
            <div className="text-wrapper">조직도</div>
            <div className="frame">
              <img
                className="vector"
                alt="Vector"
                src="https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68da46ef5d1675b4fdbce4fc/img/vector.svg"
              />
            </div>
          </div>

          {/* 휴지통 */}
          <div
            className="view-3"
            role="button"
            tabIndex={0}
            onClick={() => nav("/TrashBin")}
            onKeyDown={e => (e.key === "Enter" || e.key === " ") && nav("/TrashBin")}
          >
            <div className="rectangle-4" />
            <div className="text-wrapper">휴지통</div>
            <div className="vector-wrapper">
              <img
                className="vector-2"
                alt="Vector"
                src="https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68da46ef5d1675b4fdbce4fc/img/vector-1.svg"
              />
            </div>
          </div>

          {/* 알람 */}
          <div
            className="view-4"
            role="button"
            tabIndex={0}
            onClick={() => nav("/alerts")}
            onKeyDown={e => (e.key === "Enter" || e.key === " ") && nav("/alerts")}
          >
            <div className="rectangle-4" />
            <div className="text-wrapper">알람</div>
            <div className="frame">
              <img
                className="vector-3"
                alt="Vector"
                src="https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68da46ef5d1675b4fdbce4fc/img/vector-2.svg"
              />
            </div>
          </div>

          {/* 공지사항 */}
          <div
            className="view-5"
            role="button"
            tabIndex={0}
            onClick={() => nav("/NoticeBoard")}
            onKeyDown={e => (e.key === "Enter" || e.key === " ") && nav("/NoticeBoard")}
          >
            <div className="rectangle-4" />
            <div className="text-wrapper">공지사항</div>
            <div className="img-wrapper">
              <img
                className="vector-4"
                alt="Vector"
                src="https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68da2463633ac1c4e1c08a6f/img/vector-5.svg"
              />
            </div>
          </div>

          {/* 검색 */}
          <div
            className="view-6"
            role="button"
            tabIndex={0}
            onClick={() => nav("/search")}
            onKeyDown={e => (e.key === "Enter" || e.key === " ") && nav("/search")}
          >
            <div className="rectangle-4" />
            <div className="text-wrapper">검색</div>
            <div className="frame">
              <img
                className="vector-2"
                alt="Vector"
                src="https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68d62b16ff595e99e495402d/img/vector-14.svg"
              />
            </div>
          </div>

          {/* 업무 상단 줄 */}
          <img
            className="line"
            alt="Line"
            src="https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68da46ef5d1675b4fdbce4fc/img/line-1.svg"
          />

          {/* 업무 묶음 */}
          <div className={`view-7 ${workOpen ? "expanded" : "collapsed"}`}>
            {/* 캘린더 */}
            <div
              className="view-8"
              role="button"
              tabIndex={0}
              onClick={() => nav("/Calendar")}
              onKeyDown={e => (e.key === "Enter" || e.key === " ") && nav("/Calendar")}
            >
              <div className="rectangle-4" />
              <div className="text-wrapper">캘린더</div>
              <div className="frame-2">
                <img
                  className="vector-5"
                  alt="Vector"
                  src="https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68d62b16ff595e99e495402d/img/vector-2.svg"
                />
              </div>
            </div>

            {/* 대시보드 */}
            <div
              className="view-9"
              role="button"
              tabIndex={0}
              onClick={() => nav("/dashboard")}
              onKeyDown={e => (e.key === "Enter" || e.key === " ") && nav("/dashboard")}
            >
              <div className="rectangle-4" />
              <div className="text-wrapper">대시보드</div>
              <div className="frame-2">
                <img
                  className="vector-6"
                  alt="Vector"
                  src="https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68d62b16ff595e99e495402d/img/vector-4.svg"
                />
              </div>
            </div>

            {/* 내 업무 */}
            <div
              className="view-10"
              role="button"
              tabIndex={0}
              onClick={() => nav("/Projects")}
              onKeyDown={e => (e.key === "Enter" || e.key === " ") && nav("/my-tasks")}
            >
              <div className="rectangle-4" />
              <div className="text-wrapper">내 업무</div>
              <div className="frame-2">
                <img
                  className="vector-7"
                  alt="Vector"
                  src="https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68d62b16ff595e99e495402d/img/vector-3.svg"
                />
              </div>
            </div>

            {/* 업무 헤더(접기/펼치기) */}
            <div
              className="view-11"
              role="button"
              tabIndex={0}
              aria-expanded={workOpen}
              onClick={() => setWorkOpen(v => !v)}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setWorkOpen(v => !v);
                }
              }}
            >
              <div className="text-wrapper-2">업무</div>
              <div className="frame-3 arrow">
                <img
                  className="vector-8"
                  alt="Vector"
                  src="https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68da46ef5d1675b4fdbce4fc/img/vector-8.svg"
                />
              </div>
            </div>
          </div>

          {/* 업무 하단 줄 */}
          <img
            className="line-2"
            alt="Line"
            src="https://cdn.animaapp.com/projects/68c7cf2d5056b4c85e8f3f40/releases/68da46ef5d1675b4fdbce4fc/img/line-2.svg"
          />
        </div>
      </div>

      {/* 하단-좌: 알림 → 모달 */}
      <div
        className="view-12 box-click"
        role="button"
        tabIndex={0}
        onClick={() => setModal("noti")}
        onKeyDown={e => (e.key === "Enter" || e.key === " ") && setModal("noti")}
      />

      {/* 하단-우: 캘린더 → 모달 */}
      <div
        className="view-13 box-click"
        role="button"
        tabIndex={0}
        onClick={() => setModal("cal")}
        onKeyDown={e => (e.key === "Enter" || e.key === " ") && setModal("cal")}
      />

      {/* 상단-좌: 공지사항 → 모달 */}
      <div
        className="view-14 box-click"
        role="button"
        tabIndex={0}
        onClick={() => setModal("ann")}
        onKeyDown={e => (e.key === "Enter" || e.key === " ") && setModal("ann")}
      />

      {/* 상단-우: 프로젝트 → 모달 */}
      <div
        className="view-15 box-click"
        role="button"
        tabIndex={0}
        onClick={() => setModal("proj")}
        onKeyDown={e => (e.key === "Enter" || e.key === " ") && setModal("proj")}
      />

      {/* === 모달들 (더블클릭 시 해당 임시 페이지로 이동) === */}
      <Modal
        open={modal === "ann"}
        title="공지사항"
        onClose={() => setModal(null)}
        onDouble={() => {
          setModal(null);
          nav(modalToPath.ann);
        }}
      >
        <div className="modal-list-skel">공지사항 목록을 불러오세요. (더블클릭 시 이동)</div>
      </Modal>

      <Modal
        open={modal === "proj"}
        title="프로젝트"
        onClose={() => setModal(null)}
        onDouble={() => {
          setModal(null);
          nav(modalToPath.proj);
        }}
      >
        <div className="modal-list-skel">프로젝트 목록/세부를 불러오세요. (더블클릭 시 이동)</div>
      </Modal>

      <Modal
        open={modal === "noti"}
        title="알림"
        onClose={() => setModal(null)}
        onDouble={() => {
          setModal(null);
          nav(modalToPath.noti);
        }}
      >
        <div className="modal-list-skel">알림 내역을 불러오세요. (더블클릭 시 이동)</div>
      </Modal>

      <Modal
        open={modal === "cal"}
        title="캘린더"
        onClose={() => setModal(null)}
        onDouble={() => {
          setModal(null);
          nav(modalToPath.cal);
        }}
      >
        <div className="modal-list-skel">일정 데이터를 불러오세요. (더블클릭 시 이동)</div>
      </Modal>

      {/* 프로필 카드 */}
      <div className="view-16">
        <div className="ellipse" />
        <div className="ellipse-2" />
      </div>

      {/* 좌하단 고정: 설정 / 직원관리 */}
      <div className="view-bottom">
        <div
          className="nav-item settings-item"
          role="button"
          tabIndex={0}
          onClick={() => setOpenSettings(true)} // ← 모달 열기
          onKeyDown={e => (e.key === "Enter" || e.key === " ") && setOpenSettings(true)}
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
          onKeyDown={e => (e.key === "Enter" || e.key === " ") && nav("/employees")}
        >
          <div className="rectangle-4" />
          <div className="text-wrapper">직원관리</div>
          <div className="frame" />
        </div>
      </div>
      {/* ===== 개인정보 수정 팝업 (드래그 가능) ===== */}
      <PersonalInfoModal
        open={openSettings}
        initial={{ status: "WORKING", name: "홍길동", email: "test@example.com" }}
        onClose={() => setOpenSettings(false)}
        onSave={payload => {
          console.log("settings save:", payload); // TODO: 백엔드 연동
          setOpenSettings(false);
        }}
      />
    </div>
  );
};
// App.jsx에서 default import를 쓰고 있으므로 default로 내보내기
export default Screen;
// 원하면 named export도 같이 제공 가능:
// export { Screen };
