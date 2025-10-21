// src/context/ProjectGlobalContext.jsx
import { debounce } from "lodash";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePersistedState } from "../hooks/usePersistedState";
import API from "../services/api/http";

const ProjectGlobalContext = createContext();

export function ProjectGlobalProvider({ children }) {
  // 📁 데이터 상태
  const [projects, setProjects] = useState([]);
  const [tasksByProject, setTasksByProject] = useState({});
  const [loading, setLoading] = useState(false);

  // ⚙️ 통합 UI 상태
  const [uiState, setUiState] = useState({
    drawer: { project: false, task: false, parentTaskId: null },
    panel: { selectedTask: null },
    filter: { keyword: "", status: "ALL", assignee: "ALL" },
    expand: { all: true },
  });

  // ✅ viewType (localStorage 연동)
  const [viewType, setViewType] = usePersistedState("viewType_global", "list");

  // ✅ 언마운트 보호
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ✅ 프로젝트 전체 로드
  const fetchAllProjects = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/projects");
      if (mountedRef.current) setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ 프로젝트 목록 불러오기 실패:", err);
      if (mountedRef.current) setProjects([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  // ✅ 프로젝트별 업무 로드
  const fetchTasksByProjectNow = useCallback(async projectId => {
    if (!projectId) return;
    try {
      const { data } = await API.get(`/projects/${projectId}/tasks/tree`);
      if (mountedRef.current) {
        setTasksByProject(prev => ({
          ...prev,
          [projectId]: Array.isArray(data) ? data : [],
        }));
      }
    } catch (err) {
      console.error(`❌ 업무 로드 실패 (projectId=${projectId}):`, err);
    }
  }, []);

  const fetchTasksByProject = useRef(debounce(pid => fetchTasksByProjectNow(pid), 250)).current;

  // ✅ Optimistic UI 업데이트
  const updateTaskLocal = useCallback((taskId, updatedFields) => {
    if (!taskId || !updatedFields) return;
    setTasksByProject(prev => {
      const updated = { ...prev };
      for (const [pid, list] of Object.entries(updated)) {
        const idx = list.findIndex(t => String(t.task_id) === String(taskId));
        if (idx !== -1) {
          updated[pid] = [
            ...list.slice(0, idx),
            { ...list[idx], ...updatedFields },
            ...list.slice(idx + 1),
          ];
          break;
        }
      }
      return updated;
    });
  }, []);

  // ✅ 마운트 시 전체 프로젝트 로드
  useEffect(() => {
    fetchAllProjects();
    return () => fetchTasksByProject.cancel?.();
  }, [fetchAllProjects, fetchTasksByProject]);

  // ✅ 신규 프로젝트 자동 로드
  useEffect(() => {
    const uncached = projects.filter(p => !tasksByProject[p.project_id]);
    if (uncached.length > 0) {
      setTimeout(() => {
        Promise.all(uncached.map(p => fetchTasksByProjectNow(p.project_id))).catch(err =>
          console.warn("⚠️ 일부 프로젝트 로드 실패:", err),
        );
      }, 200);
    }
  }, [projects, tasksByProject, fetchTasksByProjectNow]);

  // ✅ 뷰 전환 시 패널/드로어 닫기
  useEffect(() => {
    setUiState(prev => ({
      ...prev,
      drawer: { ...prev.drawer, project: false, task: false },
      panel: { selectedTask: null },
    }));
  }, [viewType]);

  // 🌐 제공 값
  const value = {
    projects,
    setProjects,
    tasksByProject,
    fetchAllProjects,
    fetchTasksByProject,
    fetchTasksByProjectNow,
    updateTaskLocal,
    uiState,
    setUiState,
    viewType,
    setViewType,
    loading,
  };

  return <ProjectGlobalContext.Provider value={value}>{children}</ProjectGlobalContext.Provider>;
}

export const useProjectGlobal = () => useContext(ProjectGlobalContext);
