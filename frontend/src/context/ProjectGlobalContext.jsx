// src/context/ProjectGlobalContext.jsx
import { debounce } from "lodash";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  const [lastUpdatedAt, setLastUpdatedAt] = useState(Date.now());

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* ----------------------------------------
   * 🔹 프로젝트 전체 불러오기
   * ---------------------------------------- */
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

  const refreshProjects = useCallback(() => fetchAllProjects(), [fetchAllProjects]);

  /* ----------------------------------------
   * 🔹 프로젝트별 업무 트리 불러오기
   * ---------------------------------------- */
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

  /* ----------------------------------------
   * 🔹 Optimistic Update
   * ---------------------------------------- */
  const updateProjectLocal = useCallback((projectId, updatedFields) => {
    if (!projectId || !updatedFields) return;
    setProjects(prev =>
      prev.map(p => (String(p.project_id) === String(projectId) ? { ...p, ...updatedFields } : p)),
    );
  }, []);

  const updateTaskLocal = useCallback((taskId, updater) => {
    if (!taskId || !updater) return;

    const updateTree = list =>
      list.map(t => {
        if (String(t.task_id) === String(taskId)) {
          const next = typeof updater === "function" ? updater(t) : { ...t, ...updater };
          return { ...t, ...next };
        }
        if (t.subtasks?.length) {
          return { ...t, subtasks: updateTree(t.subtasks) };
        }
        return t;
      });

    setTasksByProject(prev => {
      const updated = {};
      for (const [pid, list] of Object.entries(prev)) {
        updated[pid] = updateTree(list);
      }
      return updated;
    });
  }, []);

  /* ----------------------------------------
   * 🔹 초기 로드
   * ---------------------------------------- */
  useEffect(() => {
    fetchAllProjects();
    return () => {
      fetchTasksByProject.cancel?.();
      fetchTasksByProject.flush?.();
    };
  }, [fetchAllProjects, fetchTasksByProject]);

  /* ----------------------------------------
   * 🔹 신규 프로젝트 자동 로드 (단회 실행)
   * ---------------------------------------- */
  useEffect(() => {
    if (!projects.length) return;
    const uncached = projects.filter(p => !tasksByProject[p.project_id]);
    if (!uncached.length) return;

    // ✅ 한 번만 실행 (tasksByProject 변경 시엔 다시 실행되지 않음)
    uncached.forEach(p => fetchTasksByProjectNow(p.project_id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects.length]); // ← projects 배열 자체가 아닌 길이만 추적

  /* ----------------------------------------
   * 🔹 lastUpdatedAt 시 전체 새로고침 (루프 방지)
   * ---------------------------------------- */
  useEffect(() => {
    let active = true;
    (async () => {
      await fetchAllProjects();
      const currentProjects = projects;
      // ✅ fetchAllProjects 이후 projects가 갱신되더라도 중복 호출 방지
      for (const p of currentProjects) {
        if (!active) break;
        await fetchTasksByProjectNow(p.project_id);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastUpdatedAt]); // ← projects 제거, fetchAllProjects만 유지

  /* ----------------------------------------
   * 🔹 뷰 전환 시 UI 초기화
   * ---------------------------------------- */
  useEffect(() => {
    setUiState(prev => ({
      ...prev,
      drawer: { project: false, task: false },
      panel: { selectedTask: null },
    }));
    setSelectedTask(null);
    setSelectedProject(null);
  }, [viewType]);

  /* ----------------------------------------
   * 🌐 Context value
   * ---------------------------------------- */
  const value = useMemo(
    () => ({
      projects,
      setProjects,
      tasksByProject,
      fetchAllProjects,
      fetchTasksByProject,
      fetchTasksByProjectNow,
      updateProjectLocal,
      updateTaskLocal,
      refreshProjects,
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
    }),
    [
      projects,
      tasksByProject,
      loading,
      selectedTask,
      selectedProject,
      uiState,
      viewType,
      lastUpdatedAt,
    ],
  );

  return <ProjectGlobalContext.Provider value={value}>{children}</ProjectGlobalContext.Provider>;
}

export const useProjectGlobal = () => useContext(ProjectGlobalContext);
