// src/hooks/useProjectDetail.js
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getProject } from "../services/api/project";
import { getTaskTree } from "../services/api/task";

export function useProjectDetail(projectId) {
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProject = useCallback(async () => {
    try {
      const data = await getProject(projectId);
      setProject(data);
    } catch (err) {
      console.error("프로젝트 불러오기 실패:", err);
      toast.error("프로젝트 정보를 불러오지 못했습니다.");
    }
  }, [projectId]);

  const fetchTasks = useCallback(async () => {
    try {
      const data = await getTaskTree(projectId);
      setTasks([...data]);
    } catch (err) {
      console.error("업무 불러오기 실패:", err);
      toast.error("업무 목록을 불러오지 못했습니다.");
    }
  }, [projectId]);

  const updateTaskLocal = useCallback((taskId, updatedFields) => {
    const updateTree = tree =>
      tree.map(t =>
        t.task_id === taskId
          ? { ...t, ...updatedFields }
          : t.children
            ? { ...t, children: updateTree(t.children) }
            : t,
      );
    setTasks(prev => updateTree(prev));
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchProject(), fetchTasks()]);
    } finally {
      setLoading(false);
    }
  }, [fetchProject, fetchTasks]);

  useEffect(() => {
    reload();
  }, [projectId]);

  return {
    project,
    tasks,
    loading,
    reload,
    fetchTasks,
    updateTaskLocal,
  };
}
