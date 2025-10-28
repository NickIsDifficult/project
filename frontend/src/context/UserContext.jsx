// src/context/UserContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [userInfo, setUserInfo] = useState({
    name: "이름 없음",
    role_name: "직급 없음",
    email: "이메일 없음",
  });
  const [userStatus, setUserStatus] = useState("WORKING");
  const [isInitialized, setIsInitialized] = useState(false); // ✅ 초기화 완료 플래그

  // ✅ localStorage에서 초기화
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUserInfo({
          name: parsed.name || "이름 없음",
          role_name: parsed.role_name || "직급 없음",
          email: parsed.email || "이메일 없음",
        });
        setUserStatus((parsed.current_state || "WORKING").toUpperCase());
      } catch (e) {
        console.warn("⚠️ localStorage 파싱 오류:", e);
      }
    }
    setIsInitialized(true);
  }, []);

  // ✅ 변경 시 localStorage 즉시 반영
  useEffect(() => {
    if (!isInitialized) return; // 초기화 전에는 저장 안 함
    const stored = localStorage.getItem("user");
    const parsed = stored ? JSON.parse(stored) : {};
    parsed.name = userInfo.name;
    parsed.role_name = userInfo.role_name;
    parsed.email = userInfo.email;
    parsed.current_state = userStatus;
    localStorage.setItem("user", JSON.stringify(parsed));
  }, [userInfo, userStatus, isInitialized]);

  return (
    <UserContext.Provider
      value={{
        userInfo,
        setUserInfo,
        userStatus,
        setUserStatus,
        isInitialized, // 필요 시 로딩 여부 확인용
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx)
    throw new Error("❌ useUser() must be used inside <UserProvider>!");
  return ctx;
}
