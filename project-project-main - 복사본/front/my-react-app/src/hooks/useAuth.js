// src/hooks/useAuth.js
import { useEffect, useState } from "react";

export function useAuth() {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // 예시: 로컬스토리지에서 토큰/역할 확인
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role"); // 'ADMIN', 'MANAGER', 'MEMBER' 등

    if (token) {
      setAuthed(true);
      setUserRole(role);
    } else {
      setAuthed(false);
      setUserRole(null);
    }
    setLoading(false);
  }, []);

  return { loading, authed, userRole };
}
