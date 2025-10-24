import { useEffect, useState } from "react";
import { getMe } from "../services/api/auth";

export function useAuth() {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("access_token") || null);
  const [userRole, setUserRole] = useState(null);
  const [deptNo, setDeptNo] = useState(null);
  const [roleNo, setRoleNo] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // ✅ 토큰이 없으면 인증 실패
        if (!token) {
          setAuthed(false);
          setLoading(false);
          return;
        }

        // ✅ 토큰 기반 유저정보 요청
        const data = await getMe();
        console.log("🧩 getMe response:", data);
        const member = data?.member ?? data;

        if (member) {
          setAuthed(true);
          setUserRole(member.user_type);
          setDeptNo(member.dept_no?.toString() ?? null);
          setRoleNo(member.role_no?.toString() ?? null);

          // ✅ 관리자 판단 (부서번호 & 직급번호가 모두 99)
          const admin = member.dept_no === "99" || member.dept_no === 99;
          const roleAdmin = member.role_no === "99" || member.role_no === 99;
          setIsAdmin(admin && roleAdmin);

          // ✅ 로컬스토리지에 갱신
          localStorage.setItem("dept_no", member.dept_no);
          localStorage.setItem("role_no", member.role_no);
          localStorage.setItem("user_type", member.user_type);
        } else {
          // getMe 실패 → 인증 실패 처리
          setAuthed(false);
        }
      } catch (err) {
        console.error("useAuth() getMe error:", err);
        setAuthed(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]); // ✅ 토큰이 변경되면 재검증

  // ✅ 로그아웃 시 헬퍼 (옵션)
  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("dept_no");
    localStorage.removeItem("role_no");
    localStorage.removeItem("user_type");
    setToken(null);
    setAuthed(false);
  };

  return {
    loading,
    authed,
    token,
    userRole,
    deptNo,
    roleNo,
    isAdmin, // ✅ 새로 추가
    logout,
  };
}
