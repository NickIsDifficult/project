// src/layout/AppShell.jsx
import { useEffect, useState } from "react";
import "../pages/screens/style.css"; // 네가 준 CSS 그대로 재사용
import "./appshell.css"; // 중앙 컨텐츠 위치/스크롤만 보조
import Sidebar from "./Sidebar";
import TopStage from "./TopStage";

// ✅ 다크모드/설정 팝업 연동
import { useNavigate } from "react-router-dom";
import PersonalInfoModal from "../pages/screens/Setting/PersonalInfoModal";
import useTheme from "../theme/useTheme";

export default function AppShell({ children }) {
  const { theme, toggleTheme } = useTheme();
  const [openSettings, setOpenSettings] = useState(false);
  const [userStatus, setUserStatus] = useState("WORKING");
  const [userInfo, setUserInfo] = useState({ name: "", role_name: "", email: "" });
  const [showMenu, setShowMenu] = useState(false);
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

  const handleStatusChange = async newStatus => {
    setUserStatus(newStatus);
    setShowMenu(false);

    const token = localStorage.getItem("accessToken");
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const memberId = storedUser?.member_id ?? 1;

      await fetch(`http://localhost:8000/api/member/update-status/${memberId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ current_state: newStatus }),
      });

      storedUser.current_state = newStatus;
      localStorage.setItem("user", JSON.stringify(storedUser));
      window.dispatchEvent(new Event("userDataChanged"));
    } catch (err) {
      console.error("상태 변경 실패:", err);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUserInfo({
        name: parsed.name || "이름 없음",
        role_name: parsed.role_name || `직급 ID: ${parsed.role_id ?? "?"}`,
        email: parsed.email || "이메일 없음",
      });
      if (parsed.current_state) {
        setUserStatus(String(parsed.current_state).toUpperCase());
      }
    }

    const token = localStorage.getItem("accessToken");
    if (token) {
      (async () => {
        try {
          const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
          const memberId = storedUser?.member_id ?? 1;

          const res = await fetch(`http://localhost:8000/api/member/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error("데이터 요청 실패");
          const data = await res.json();
          console.log("📥 내 정보:", data);

          setUserInfo({
            name: data.name ?? "이름 없음",
            email: data.email ?? "이메일 없음",
            role_name: data.role_name ?? "직급 정보 없음",
          });
          if (data.current_state) setUserStatus(data.current_state.toUpperCase());
        } catch (err) {
          console.error("내 정보 불러오기 실패:", err);
        }
      })();
    }
  }, []);

  const handleSave = async payload => {
    try {
      const token = localStorage.getItem("accessToken");

      const body = {
        name: payload.name,
        email: payload.email,
      };

      if (payload.status !== "업무상태변경") {
        body.current_state = REVERSE_STATE[payload.status] || payload.status;
      }

      if (payload.password?.current && payload.password?.next) {
        body.password = {
          current: payload.password.current,
          next: payload.password.next,
        };
      }

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

      setUserInfo(prev => ({
        ...prev,
        name: body.name ?? prev.name,
        email: body.email ?? prev.email,
      }));

      if (payload.status !== "업무상태변경") {
        setUserStatus((body.current_state || userStatus).toUpperCase());
      }

      const reload = await fetch("http://localhost:8000/api/member/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (reload.ok) {
        const data = await reload.json();
        setUserInfo({
          name: data.name ?? body.name ?? "이름 없음",
          email: data.email ?? body.email ?? "이메일 없음",
          role_name: data.role_name ?? userInfo.role_name,
        });
        setUserStatus((data.current_state ?? body.current_state ?? userStatus).toUpperCase());

        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        stored.name = data.name ?? stored.name;
        stored.email = data.email ?? stored.email;
        stored.role_name = data.role_name ?? stored.role_name;
        stored.current_state = (
          data.current_state ??
          body.current_state ??
          stored.current_state
        ).toUpperCase();
        localStorage.setItem("user", JSON.stringify(stored));

        window.dispatchEvent(new Event("userDataChanged"));
      }

      setOpenSettings(false);
    } catch (err) {
      console.error("❌ 저장 오류:", err);
      alert("저장 중 오류가 발생했습니다.\n" + err.message);
    }
  };

  return (
    <div className="screen">
      {/* 상단/배경 레이어 */}
      <TopStage />
      {/* 좌측 사이드바 */}
      <Sidebar userStatus={userStatus} />

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

      {/* ✅ 좌하단 설정/직원관리 영역 (view-bottom) */}
      <div className="view-bottom">
        {/* 설정 */}
        <div
          className="nav-item settings-item"
          role="button"
          tabIndex={0}
          onClick={() => setOpenSettings(true)}
          onKeyDown={e => (e.key === "Enter" || e.key === " ") && setOpenSettings(true)}
        >
          <div className="rectangle-4" />
          <div className="text-wrapper">설정</div>
          <div className="frame" />
        </div>

        {/* 직원관리 */}
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

      {/* ✅ 개인정보 수정 팝업 */}
      <PersonalInfoModal
        open={openSettings}
        initial={{
          status: STATE_LABELS[userStatus],
          name: userInfo.name,
          email: userInfo.email,
        }}
        onClose={() => setOpenSettings(false)}
        onSave={handleSave}
      />

      {/* 중앙 컨텐츠(.div 영역 위에 겹침) */}
      <main className="appstage-content">{children}</main>
    </div>
  );
}
