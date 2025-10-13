// src/hooks/useProjectDetail.js
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getProject } from "../services/api/project";
import { getTaskTree } from "../services/api/task";

export function useProjectDetail(projectId) {
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // ---------------------------
  // 프로젝트 데이터
  // ---------------------------
  const fetchProject = useCallback(async () => {
    try {
      const data = await getProject(projectId);
      setProject(data);
    } catch (err) {
      console.error("프로젝트 불러오기 실패:", err);
      toast.error("프로젝트 정보를 불러오지 못했습니다.");
    }
  }, [projectId]);

  // ---------------------------
  // 업무 트리 데이터
  // ---------------------------
  const fetchTasks = useCallback(async () => {
    try {
      const data = await getTaskTree(projectId);
      setTasks([...data]);
    } catch (err) {
      console.error("업무 불러오기 실패:", err);
      toast.error("업무 목록을 불러오지 못했습니다.");
    }
  }, [projectId]);

  // ---------------------------
  // 초기 로딩 및 새로고침 함수
  // ---------------------------
  const reload = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchProject(), fetchTasks()]);
    setLoading(false);
  }, [fetchProject, fetchTasks]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { project, tasks, loading, reload, fetchTasks };
}
