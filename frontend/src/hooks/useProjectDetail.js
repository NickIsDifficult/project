// src/hooks/useProjectDetail.js
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getProject } from "../services/api/project";
import { getTaskTree } from "../services/api/task";

/**
 * ✅ useProjectDetail
 * 프로젝트 상세 + 업무 트리 데이터 관리 훅
 */
export function useProjectDetail(projectId) {
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState({ project: true, tasks: true });

  /* ----------------------------------------
   * 🔹 프로젝트 상세 불러오기
   * ---------------------------------------- */
  const fetchProject = useCallback(async () => {
    try {
      const data = await getProject(projectId);
      setProject(data);
      setLoading(prev => ({ ...prev, project: false }));
      return data;
    } catch (err) {
      console.error("❌ 프로젝트 불러오기 실패:", err);
      toast.error("프로젝트 정보를 불러오지 못했습니다.");
      setLoading(prev => ({ ...prev, project: false }));
      return null;
    }
  }, [projectId]);

  /* ----------------------------------------
   * 🔹 업무 목록(트리) 불러오기
   * ---------------------------------------- */
  const fetchTasks = useCallback(async () => {
    try {
      const data = await getTaskTree(projectId);
      setTasks(Array.isArray(data) ? data : []);
      setLoading(prev => ({ ...prev, tasks: false }));
      return data;
    } catch (err) {
      console.error("❌ 업무 불러오기 실패:", err);
      toast.error("업무 목록을 불러오지 못했습니다.");
      setLoading(prev => ({ ...prev, tasks: false }));
      return [];
    }
  }, [projectId]);

  /* ----------------------------------------
   * 🔹 로컬 상태 업데이트 (Optimistic UI)
   * ---------------------------------------- */
  const updateTaskLocal = useCallback((taskId, updatedFields) => {
    if (!taskId) return;

    const updateTree = tree => {
      let updated = false;
      const newTree = tree.map(t => {
        if (t.task_id === taskId) {
          updated = true;
          return { ...t, ...updatedFields };
        }
        if (t.children?.length) {
          const nextChildren = updateTree(t.children);
          if (nextChildren !== t.children) {
            updated = true;
            return { ...t, children: nextChildren };
          }
        }
        return t;
      });
      return updated ? newTree : tree;
    };

    setTasks(prev => updateTree(prev));
  }, []);

  /* ----------------------------------------
   * 🔹 전체 데이터 새로고침
   * ---------------------------------------- */
  const reload = useCallback(async () => {
    if (!projectId) return;
    setLoading({ project: true, tasks: true });
    try {
      await Promise.all([fetchProject(), fetchTasks()]);
    } catch (err) {
      console.error("❌ 프로젝트 전체 불러오기 실패:", err);
    }
  }, [projectId, fetchProject, fetchTasks]);

  /* ----------------------------------------
   * 🔹 최초 로딩 + projectId 변경 시 초기화
   * ---------------------------------------- */
  useEffect(() => {
    setProject(null);
    setTasks([]);
    if (projectId) reload();
  }, [projectId, reload]);

  /* ----------------------------------------
   * 📤 반환
   * ---------------------------------------- */
  return {
    project,
    tasks,
    loading,
    reload,
    fetchTasks,
    updateTaskLocal,
    isReady: !loading.project && !loading.tasks && !!project,
  };
}
