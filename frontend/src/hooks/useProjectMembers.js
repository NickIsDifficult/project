// src/hooks/useProjectMembers.js
import { useEffect, useState } from "react";
import { getProjectMembers } from "../services/api/employee";

/**
 * ✅ 프로젝트별 멤버 목록 조회 훅
 */
export function useProjectMembers(projectId) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    const controller = new AbortController();
    setLoading(true);

    getProjectMembers(projectId, { signal: controller.signal })
      .then(data => {
        setMembers(
          (data || []).map(m => ({
            emp_id: m.emp_id,
            name: m.name,
            role: m.role,
            email: m.email,
          })),
        );
      })
      .catch(err => {
        if (err.name !== "AbortError") {
          console.error("❌ 프로젝트 멤버 로드 실패:", err);
        }
        setMembers([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [projectId]);

  return { members, loading };
}
