// src/layout/AppShell.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PersonalInfoModal from "../pages/screens/Setting/PersonalInfoModal";
import "../pages/screens/style.css"; // 기존 스타일 그대로 사용
import "./appshell.css"; // 중앙 컨텐츠 보조 스타일
import Sidebar from "./Sidebar";
import TopStage from "./TopStage";

export default function AppShell({ children }) {
  const [openSettings, setOpenSettings] = useState(false);
  const [userStatus, setUserStatus] = useState("WORKING");
  const [userInfo, setUserInfo] = useState({ name: "", role_name: "", email: "" });
  const [showMenu, setShowMenu] = useState(false);
  const nav = useNavigate();

  // ✅ 상태 라벨 매핑
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

  // ✅ 자동 로그인 처리 (토큰만 유지)
  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // ✅ 업무 상태 변경 API
  const handleStatusChange = async newStatus => {
    setUserStatus(newStatus);
    setShowMenu(false);

    try {
      const res = await fetch(`http://localhost:8000/employees/update-status/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ current_state: newStatus }),
      });

      if (!res.ok) throw new Error("상태 변경 실패");
      console.log("✅ 상태 변경 완료:", newStatus);
    } catch (err) {
      console.error("상태 변경 실패:", err);
    }
  };

  // ✅ 사용자 정보 불러오기 (서버 기반)
  useEffect(() => {
    const loadUserInfo = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        console.warn("❌ 토큰 없음 — 로그인 페이지로 이동");
        nav("/login");
        return;
      }

      try {
        const res = await fetch("http://localhost:8000/employees/me", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          console.warn("❌ 인증 실패 — 토큰 만료 또는 잘못된 토큰");
          localStorage.removeItem("access_token");
          nav("/login");
          return;
        }

        if (!res.ok) throw new Error(`데이터 요청 실패 (${res.status})`);

        const data = await res.json();
        console.log("📥 내 정보:", data);

        setUserInfo({
          name: data.name ?? "이름 없음",
          email: data.email ?? "이메일 없음",
          role_name: data.role_name ?? "직급 정보 없음",
        });

        if (data.current_state) {
          setUserStatus(data.current_state.toUpperCase());
        }
      } catch (err) {
        console.error("내 정보 불러오기 실패:", err);
      }
    };

    // ✅ 약간의 지연을 줘서 localStorage 접근 시점 보장
    setTimeout(loadUserInfo, 100);
  }, [nav]);

  // ✅ 개인정보 수정 저장
  const handleSave = async payload => {
    try {
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

      const res = await fetch("http://localhost:8000/employees/update-info/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
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

      // 최신 정보 재조회
      const reload = await fetch("http://localhost:8000/employees/me", {
        headers: { ...getAuthHeaders() },
      });
      if (reload.ok) {
        const data = await reload.json();
        setUserInfo({
          name: data.name ?? body.name ?? "이름 없음",
          email: data.email ?? body.email ?? "이메일 없음",
          role_name: data.role_name ?? userInfo.role_name,
        });
        setUserStatus((data.current_state ?? body.current_state ?? userStatus).toUpperCase());
      }

      setOpenSettings(false);
    } catch (err) {
      console.error("❌ 저장 오류:", err);
      alert("저장 중 오류가 발생했습니다.\n" + err.message);
    }
  };

  return (
    <div className="screen">
      {/* 상단 영역 */}
      <TopStage />

      {/* 좌측 사이드바 */}
      <Sidebar userStatus={userStatus} />

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

      {/* 좌하단 메뉴 (설정 / 직원관리) */}
      <div className="view-bottom">
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

      {/* 개인정보 수정 모달 */}
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

      {/* 중앙 컨텐츠 */}
      <main className="appstage-content">{children}</main>
    </div>
  );
}
