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
        // ✅ API 응답이 이미 [{ emp_id, name, role, email }] 구조이므로
        // 별도 변환 없이 그대로 사용
        setMembers(
          data.map(m => ({
            emp_id: m.emp_id,
            name: m.name,
            role: m.role,
            email: m.email,
          })),
        );
      })
      .catch(err => {
        console.error("❌ 프로젝트 멤버 로드 실패:", err);
        setMembers([]);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  return { members, loading };
}
