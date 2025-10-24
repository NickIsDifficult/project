// src/screens/Screen.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useTheme from "../../theme/useTheme";
import PersonalInfoModal from "./Setting/PersonalInfoModal";
import "./style.css";

// ✅ 상태 변경용 Enum 매핑
const STATE_LABELS = {
  WORKING: "업무중",
  FIELD: "외근",
  AWAY: "자리비움",
  OFF: "퇴근",
};


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
  const [showMenu, setShowMenu] = useState(false);

   // ✅ 프로필 데이터 상태 선언
 const [profile, setProfile] = useState({
  name: "",
  role_name: "",
  email: "",
  current_state: "WORKING",
});

// ✅ 상태 변경 핸들러 (AppShell과 동일한 로직)
const handleStatusChange = async (newStatus) => {
  // UI 즉시 반영
  setProfile((prev) => ({ ...prev, current_state: newStatus }));
  setShowMenu(false);
  try {
    const token = localStorage.getItem("accessToken");
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const memberId = storedUser?.member_id ?? 1;
    if (token) {
      await fetch(`http://localhost:8000/api/member/update-status/${memberId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ current_state: newStatus }),
      });
    }
    // localStorage 동기화 + 브로드캐스트
    const merged = { ...storedUser, current_state: newStatus };
    localStorage.setItem("user", JSON.stringify(merged));
    window.dispatchEvent(new Event("userDataChanged"));
  } catch (err) {
    console.error("상태 변경 실패:", err);
  }
};


  // ✅ 로그인 사용자 정보 가져오기
  useEffect(() => {
  const storedUser = localStorage.getItem("user");
  const token = localStorage.getItem("accessToken");

  if (storedUser) {
    const userData = JSON.parse(storedUser);
    setProfile({
    name: userData.name || "이름 없음",
    role_name: userData.role_name || `직급 ID: ${userData.role_id ?? "?"}`,
    email: userData.email || "이메일 없음",
    current_state: userData.current_state || "WORKING", // ✅ localStorage 값 우선
  });
  }

  if (token) {
    (async () => {
      try {
        // ✅ 로그인 사용자 ID 동적 적용
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const memberId = storedUser?.member_id ?? 1;

      const res = await fetch("http://localhost:8000/api/member/me", {
  headers: { Authorization: `Bearer ${token}` },
});
if (!res.ok) throw new Error("데이터 요청 실패");
const data = await res.json();
console.log("📥 로그인 사용자 정보:", data);

// ✅ null 방어 및 fallback
setProfile((prev) => ({
  ...prev,
  name: data.name ?? prev.name ?? "이름 없음",
  role_name: data.role_name ?? prev.role_name ?? "직급 미지정",
  email: data.email ?? prev.email ?? "이메일 없음",
  current_state: (data.current_state ?? prev.current_state ?? "WORKING").toUpperCase(),
}));

// ✅ 현재 상태(profile) 기반 저장
localStorage.setItem(
  "user",
  JSON.stringify({
    name: data.name ?? profile.name ?? "이름 없음",
    role_name: data.role_name ?? profile.role_name ?? "직급 미지정",
    email: data.email ?? profile.email ?? "이메일 없음",
    current_state: (data.current_state ?? profile.current_state ?? "WORKING").toUpperCase(),
    member_id: data.member_id ?? 1,
  })
);
window.dispatchEvent(new Event("userDataChanged"));

        // ✅ localStorage 즉시 저장 및 반영
        const updated = {
          name: data.name ?? profile.name,
          role_name: data.role_name ?? profile.role_name,
          email: data.email ?? profile.email,
          current_state: data.current_state ?? profile.current_state,
        };
        localStorage.setItem("user", JSON.stringify(updated));
        // ✅ 전역 동기화 이벤트 (AppShell, Sidebar 등 실시간 반영)
        window.dispatchEvent(new Event("userDataChanged"));

        // ✅ 상태를 즉시 반영
        setProfile((prev) => ({
          name: data.name ?? prev.name,
          role_name: data.role_name ?? prev.role_name,
          email: data.email ?? prev.email,
          current_state:
            (data.current_state ?? body.current_state ?? prev.current_state).toUpperCase(),
        }));

        // ✅ localStorage 재동기화 (최신 상태 보존)
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.name = data.name ?? parsed.name;
          parsed.email = data.email ?? parsed.email;
          parsed.role_name = data.role_name ?? parsed.role_name;
          parsed.current_state =
            (data.current_state ?? body.current_state ?? parsed.current_state).toUpperCase();
          localStorage.setItem("user", JSON.stringify(parsed));
        }
        setProfile(updated);
        // ✅ 이메일과 상태 모두 업데이트
        setProfile(prev => ({
          ...prev,
          current_state: data.current_state ?? prev.current_state,
          email: data.email ?? prev.email,
          name: data.name ?? prev.name,
          role_name: data.role_name ?? prev.role_name,
        }));
      } catch (err) {
        console.error("프로필 불러오기 실패:", err);
      }
    })();
  }
}, []);

// ✅ localStorage 변경 시 자동 동기화
useEffect(() => {
  const syncUser = () => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored);
      setProfile(prev => ({
        ...prev,
        ...parsed,
        current_state: parsed.current_state || prev.current_state,
      }));
    }
  };
  window.addEventListener("userDataChanged", syncUser);
  return () => window.removeEventListener("userDataChanged", syncUser);
}, []);
  // 모달 타입 → 임시 라우트 매핑
  const modalToPath = {
    ann: "/notices",
    proj: "/projects",
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
        <Link to="/main" className="logo-link top-logo" aria-label="홈으로">
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
        <Link to="/main" className="logo-link sidebar-logo" aria-label="홈으로">
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

             // ✅ 경로 정합성 (라우터와 일치)
           onClick={() => nav("/trash-bin")}
           onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && nav("/trash-bin")}
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
            onClick={() => nav("/notices")}
            onKeyDown={e => (e.key === "Enter" || e.key === " ") && nav("/notices")}
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
              onClick={() => nav("/calendar")}
              onKeyDown={e => (e.key === "Enter" || e.key === " ") && nav("/calendar")}
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
              onClick={() => nav("/main")}
              onKeyDown={e => (e.key === "Enter" || e.key === " ") && nav("/main")}
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
              onClick={() => nav("/projects")}
              onKeyDown={e => (e.key === "Enter" || e.key === " ") && nav("/projects")}
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

      <div className="view-16">
        <div className="ellipse">
          <img
            src="https://cdn-icons-png.flaticon.com/512/847/847969.png"
            alt="프로필"
            className="profile-img"
          />
        </div>
        <div
          className={`ellipse-2 ${profile.current_state}`}
          title={STATE_LABELS[profile.current_state]}
          onClick={() => setShowMenu((v) => !v)}
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
          <div className="profile-name">
          {profile.name && profile.name.trim() !== "" ? profile.name : "이름 없음"}
        </div>
        <div className="profile-role">
          {profile.role_name && profile.role_name.trim() !== "" ? profile.role_name : "직급 없음"}
         </div>
        </div>
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
  key={profile.current_state}
  initial={{
    status: "업무상태변경", // ✅ 기본값
    name: profile.name,
    email: profile.email || "이메일 없음",
  }}
  onClose={() => setOpenSettings(false)}
  onSave={async (payload) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      // ✅ 상태 Enum 매핑
      const REVERSE_STATE = {
        업무중: "WORKING",
        외근: "FIELD",
        자리비움: "AWAY",
        퇴근: "OFF",
      };

      // ✅ 변경사항 body 구성
      const body = {
        name: payload.name,
        email: payload.email,
      };

      // ✅ 상태가 ‘업무상태변경’이 아닐 때만 업데이트 반영
      if (payload.status !== "업무상태변경") {
        body.current_state = REVERSE_STATE[payload.status] || payload.status;
      }

      if (payload.password?.current && payload.password?.next) {
        body.password = {
          current: payload.password.current,
          next: payload.password.next,
        };
      }

      // ✅ 정보 업데이트 요청
      const res = await fetch("http://localhost:8000/api/member/update-info/1", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("업데이트 실패");
      const data = await res.json();
      console.log("✅ 업데이트 완료:", data);

      // ✅ 즉시 반영
      setProfile((prev) => ({
        name: body.name ?? prev.name,
        role_name: prev.role_name,
        email: body.email ?? prev.email,
        current_state:
          body.current_state
            ? (body.current_state || "").toUpperCase()
            : prev.current_state,
      }));

      // ✅ 최신 정보 다시 불러오기 (상태 보정)
      const reload = await fetch("http://localhost:8000/api/member/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (reload.ok) {
        const data = await reload.json();
        console.log("📥 갱신된 내 정보:", data);

        // ✅ localStorage 저장 및 다른 컴포넌트로 이벤트 송출
        const updated = {
            ...data,
         role_name: data.role_name ?? stored.role_name ?? prev.role_name, // ✅ 직급 보존
         current_state: (data.current_state ?? body.current_state ?? prev.current_state).toUpperCase(),
        };
        localStorage.setItem("user", JSON.stringify(updated));
        window.dispatchEvent(new Event("userDataChanged"));

        setProfile((prev) => ({
          name: data.name ?? prev.name,
          role_name: data.role_name ?? prev.role_name,
          email: data.email ?? prev.email,
          current_state:
            (data.current_state ?? body.current_state ?? prev.current_state).toUpperCase(),
        }));

        // ✅ localStorage 동기화
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.name = data.name ?? parsed.name;
          parsed.email = data.email ?? parsed.email;
          parsed.role_name = data.role_name ?? parsed.role_name;
          parsed.current_state =
            (data.current_state ?? body.current_state ?? parsed.current_state).toUpperCase();
          localStorage.setItem("user", JSON.stringify(parsed));
        }
      }
    } catch (err) {
      console.error("❌ 설정 업데이트 실패:", err);
      alert("정보 저장 중 오류가 발생했습니다.");
    } finally {
      setOpenSettings(false);
    }
  }}
/>

    </div>
  );
};
// App.jsx에서 default import를 쓰고 있으므로 default로 내보내기
export default Screen;
// 원하면 named export도 같이 제공 가능:
// export { Screen };
