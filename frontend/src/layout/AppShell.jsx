// src/layout/AppShell.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PersonalInfoModal from "../pages/screens/Setting/PersonalInfoModal";
import "../pages/screens/style.css";
import useTheme from "../theme/useTheme";
import "./appshell.css";
import Sidebar from "./Sidebar";
import TopStage from "./TopStage";

export default function AppShell({ children }) {
  const { theme, toggleTheme } = useTheme();
  const [openSettings, setOpenSettings] = useState(false);
  const [userStatus, setUserStatus] = useState("WORKING");
  const [userInfo, setUserInfo] = useState({ name: "", role_name: "", email: "" });
  const nav = useNavigate();

  // ✅ Enum 매핑
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

  // ✅ 초기 데이터 불러오기
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUserInfo({
        name: parsed.name || "이름 없음",
        role_name: parsed.role_name || `직급 ID: ${parsed.role_id ?? "?"}`,
        email: parsed.email || "이메일 없음",
      });
// ✅ localStorage에 current_state가 있으면 즉시 반영 (색상 초기화 방지)
      if (parsed.current_state) {
        setUserStatus(String(parsed.current_state).toUpperCase());
      }
    }

    const token = localStorage.getItem("accessToken");
    if (token) {
      (async () => {
        try {
          // ✅ 현재 로그인한 사용자 ID 가져오기
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const memberId = storedUser?.member_id ?? 1;

    const res = await fetch(`http://localhost:8000/api/member/update-info/${memberId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error("데이터 요청 실패");
          const data = await res.json();
          console.log("📥 내 정보:", data);

          if (data.name) setUserInfo((prev) => ({ ...prev, name: data.name }));
          if (data.email) setUserInfo((prev) => ({ ...prev, email: data.email }));
          if (data.role_name)
            setUserInfo((prev) => ({ ...prev, role_name: data.role_name }));
          if (data.current_state) setUserStatus(data.current_state);
        } catch (err) {
          console.error("내 정보 불러오기 실패:", err);
        }
      })();
    }
  }, []);

  // ✅ 개인정보 수정 저장 (모달 onSave)
  const handleSave = async (payload) => {
  try {
    const token = localStorage.getItem("accessToken");

    // 상태 한글↔ENUM 변환
    const REVERSE_STATE = {
      업무중: "WORKING",
      외근: "FIELD",
      자리비움: "AWAY",
      퇴근: "OFF",
    };

    const body = {
      name: payload.name,
      email: payload.email,
    };

    // ✅ 상태가 "업무상태변경"이 아닐 때만 current_state 반영
    if (payload.status !== "업무상태변경") {
      body.current_state = REVERSE_STATE[payload.status] || payload.status;
    }

    if (payload.password?.current && payload.password?.next) {
      body.password = {
        current: payload.password.current,
        next: payload.password.next,
      };
    }

    // ✅ 정보 업데이트
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

    // ✅ 즉시 반영 (업무상태변경 선택 시 상태 유지)
    setUserInfo((prev) => ({
      name: body.name ?? prev.name,
      email: body.email ?? prev.email,
    }));

    setUserStatus((prev) => {
      if (payload.status === "업무상태변경") return prev;
      return (body.current_state || prev).toUpperCase();
    });

    // ✅ 최신 정보 다시 불러오기
    const reload = await fetch("http://localhost:8000/api/member/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (reload.ok) {
      const newData = await reload.json();
      console.log("📥 갱신된 내 정보:", newData);

      setUserInfo({
        name: newData.name ?? body.name ?? "이름 없음",
        email: newData.email ?? body.email ?? "이메일 없음",
      });

      setUserStatus(
        (newData.current_state ?? body.current_state ?? userStatus).toUpperCase()
      );

      // ✅ localStorage 동기화
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.name = newData.name ?? parsed.name;
        parsed.email = newData.email ?? parsed.email;
        parsed.role_name = newData.role_name ?? parsed.role_name; // ✅ 직급 보존 추가
        parsed.current_state =
          (newData.current_state ?? body.current_state ?? parsed.current_state).toUpperCase();
        localStorage.setItem("user", JSON.stringify(parsed));

        // ✅ 다른 컴포넌트(AppShell 외)도 즉시 반영되게 커스텀 이벤트 발행
        window.dispatchEvent(new Event("userDataChanged"));
      }
    }

    setOpenSettings(false);
  } catch (err) {
    console.error("❌ 저장 오류:", err);
    alert("저장 중 오류가 발생했습니다.\n" + err.message);
  }
};

  return (
    <div className="screen">
      <TopStage />
      <Sidebar userStatus={userStatus} />

      {/* 🌙 다크모드 버튼 */}
      <button
        className="theme-toggle-fab"
        type="button"
        aria-label="Toggle theme"
        onClick={toggleTheme}
        title={theme === "dark" ? "라이트 모드" : "다크 모드"}
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      {/* ✅ 프로필 카드 */}
      <div className="view-16">
        <div className="ellipse">
          <img
            src="https://cdn-icons-png.flaticon.com/512/847/847969.png"
            alt="프로필"
            className="profile-img"
          />
        </div>

        {/* 상태 표시 */}
        <div
          className="ellipse-2"
          style={{
            backgroundColor: {
              WORKING: "#2ecc71",
              AWAY: "#f1c40f",
              FIELD: "#e74c3c",
              OFF: "#9e9e9e",
            }[userStatus],
          }}
          title={STATE_LABELS[userStatus]}
        />

        {/* 이름 / 직급 */}
        <div className="profile-info">
          <div className="profile-name">{userInfo.name}</div>
          <div className="profile-role">{userInfo.role_name}</div>
        </div>
      </div>

      {/* 하단 고정 메뉴 */}
      <div className="view-bottom">
        <div
          className="nav-item settings-item"
          role="button"
          tabIndex={0}
          onClick={() => setOpenSettings(true)}
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
        >
          <div className="rectangle-4" />
          <div className="text-wrapper">직원관리</div>
          <div className="frame" />
        </div>
      </div>

      {/* ✅ 개인정보 수정 모달 */}
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

      <main className="appstage-content">{children}</main>
    </div>
  );
}
