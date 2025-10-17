// src/hooks/useProjectDetail.js
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getProject } from "../services/api/project";
import { getTaskTree } from "../services/api/task";

/**
 * ✅ useProjectDetail
 * 프로젝트 상세 + 업무 트리 데이터 관리 훅
 * - ProjectDetailContext의 핵심 로직
 * - fetchTasks(), updateTaskLocal() 등은 다른 컴포넌트에서 직접 사용됨
 */
export function useProjectDetail(projectId) {
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ----------------------------------------
   * 🔹 프로젝트 상세 불러오기
   * ---------------------------------------- */
  const fetchProject = useCallback(async () => {
    try {
      const data = await getProject(projectId);
      setProject(data);
      return data;
    } catch (err) {
      console.error("❌ 프로젝트 불러오기 실패:", err);
      toast.error("프로젝트 정보를 불러오지 못했습니다.");
      return null;
    }
  }, [projectId]);

  /* ----------------------------------------
   * 🔹 업무 목록(트리) 불러오기
   * ---------------------------------------- */
  const fetchTasks = useCallback(async () => {
    try {
      const data = await getTaskTree(projectId);
      setTasks(data || []);
      return data;
    } catch (err) {
      console.error("❌ 업무 불러오기 실패:", err);
      toast.error("업무 목록을 불러오지 못했습니다.");
      return [];
    }
  }, [projectId]);

  /* ----------------------------------------
   * 🔹 로컬 상태 업데이트 (Optimistic UI)
   * ---------------------------------------- */
  const updateTaskLocal = useCallback((taskId, updatedFields) => {
    if (!taskId) return;

    const updateTree = tree =>
      tree.map(t =>
        t.task_id === taskId
          ? { ...t, ...updatedFields } // 해당 Task 업데이트
          : t.children?.length
            ? { ...t, children: updateTree(t.children) } // 하위 트리 탐색
            : t,
      );

    setTasks(prev => updateTree(prev));
  }, []);

  /* ----------------------------------------
   * 🔹 전체 데이터 새로고침
   * ---------------------------------------- */
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchProject(), fetchTasks()]);
    } catch (err) {
      console.error("❌ 프로젝트 전체 불러오기 실패:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchProject, fetchTasks]);

  /* ----------------------------------------
   * 🔹 최초 로딩
   * ---------------------------------------- */
  useEffect(() => {
    if (projectId) reload();
  }, [projectId, reload]);

  /* ----------------------------------------
   * 📤 반환 (Context에서 직접 사용)
   * ---------------------------------------- */
  return {
    project, // 프로젝트 정보
    tasks, // 업무 트리 구조
    loading, // 로딩 상태
    reload, // 전체 새로고침
    fetchTasks, // 업무 목록 갱신
    updateTaskLocal, // 로컬 UI 즉시 반영
  };
}
