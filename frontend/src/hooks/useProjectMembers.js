import { useEffect, useState } from "react";
import { getProjectMembers } from "../services/api/employee";

/**
 * 프로젝트별 멤버 목록 조회 훅
 * @param {number} projectId
 */
export function useProjectMembers(projectId) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    setLoading(true);
    getProjectMembers(projectId)
      .then(data => {
        const formatted = data.map(m => ({
          value: m.emp_id,
          label: `${m.name} (${m.role})`,
          email: m.email,
          role: m.role,
        }));
        setMembers(formatted);
      })
      .catch(err => {
        console.error("❌ 프로젝트 멤버 로드 실패:", err);
        setMembers([]);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  return { members, loading };
}
