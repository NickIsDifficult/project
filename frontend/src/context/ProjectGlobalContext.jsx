// src/context/ProjectGlobalContext.jsx
import { debounce } from "lodash";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePersistedState } from "../hooks/usePersistedState";
import API from "../services/api/http";

const ProjectGlobalContext = createContext();

export function ProjectGlobalProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [tasksByProject, setTasksByProject] = useState({});
  const [loading, setLoading] = useState(false);

  const [uiState, setUiState] = useState({
    drawer: { project: false, task: false, parentTaskId: null },
    panel: { selectedTask: null },
    filter: { keyword: "", status: "ALL", assignee: "ALL" },
    expand: { list: true, kanban: true },
  });

  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [viewType, setViewType] = usePersistedState("viewType_global", "list");

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

  // ✅ 리스트 리프레시용 별도 함수
  const refreshProjects = useCallback(async () => {
    await fetchAllProjects();
  }, [fetchAllProjects]);

  // ✅ 프로젝트별 업무 로드
  const fetchTasksByProjectNow = useCallback(async (projectId) => {
    if (!projectId) return;
    try {
      const { data } = await API.get(`/projects/${projectId}/tasks/tree`);
      if (mountedRef.current) {
        setTasksByProject((prev) => ({
          ...prev,
          [projectId]: Array.isArray(data) ? data : [],
        }));
      }
    } catch (err) {
      console.error(`❌ 업무 로드 실패 (projectId=${projectId}):`, err);
    }
  }, []);

  const fetchTasksByProject = useRef(debounce((pid) => fetchTasksByProjectNow(pid), 250)).current;

  // ✅ Optimistic Update
  const updateProjectLocal = useCallback((projectId, updatedFields) => {
    if (!projectId || !updatedFields) return;
    setProjects((prev) => {
    const updated = prev.map((p) =>
      String(p.project_id) === String(projectId)
        ? { ...p, ...updatedFields }
        : p
    );
    return [...updated];
    });
}, []);

  const updateTaskLocal = useCallback((taskId, updater) => {
    if (!taskId || !updater) return;
    const updateTree = (list) =>
      list.map((t) => {
        if (String(t.task_id) === String(taskId)) {
          const next = typeof updater === "function" ? updater(t) : { ...t, ...updater };
          return { ...t, ...next };
        }
        if (t.subtasks && t.subtasks.length) {
          return { ...t, subtasks: updateTree(t.subtasks) };
        }
        return t;
      });

    setTasksByProject((prev) => {
      const updated = {};
      for (const [pid, list] of Object.entries(prev)) {
        updated[pid] = updateTree(list);
      }
      return updated;
    });
  }, []);

  // ✅ 마운트 시 프로젝트 불러오기
  useEffect(() => {
    fetchAllProjects();
    return () => fetchTasksByProject.cancel?.();
  }, [fetchAllProjects, fetchTasksByProject]);

  // ✅ 신규 프로젝트 자동 로드
  useEffect(() => {
    const uncached = projects.filter((p) => !tasksByProject[p.project_id]);
    if (uncached.length === 0) return;
    const timer = setTimeout(() => {
      uncached.forEach((p) => fetchTasksByProjectNow(p.project_id));
    }, 300);
    return () => clearTimeout(timer);
  }, [projects]);

  // ✅ 뷰 전환 시 패널/드로어 닫기
  useEffect(() => {
    setUiState((prev) => ({
      ...prev,
      drawer: { project: false, task: false },
      panel: { selectedTask: null },
    }));
    setSelectedTask(null);
    setSelectedProject(null);
  }, [viewType]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(Date.now());
  useEffect(() => {
  if (!lastUpdatedAt) return;
  const timer = setTimeout(async () => {
    await fetchAllProjects();
    for (const p of projects) {
      await fetchTasksByProjectNow(p.project_id);
    }
  }, 500);
  return () => clearTimeout(timer);
}, [lastUpdatedAt]);
  // 🌐 Context
  const value = {
    projects,
    setProjects,
    tasksByProject,
    fetchAllProjects,
    fetchTasksByProject,
    fetchTasksByProjectNow,
    updateProjectLocal,
    updateTaskLocal,
    refreshProjects, // ✅ 올바른 함수 export
    loading,

    selectedTask,
    setSelectedTask,
    selectedProject,
    setSelectedProject,

    uiState,
    setUiState,
    viewType,
    setViewType,
    lastUpdatedAt,
  setLastUpdatedAt,
  };

  return (
    <ProjectGlobalContext.Provider value={value}>
      {children}
    </ProjectGlobalContext.Provider>
  );
}

export const useProjectGlobal = () => useContext(ProjectGlobalContext);
