import { debounce } from "lodash";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import API from "../services/api/http";

const ProjectGlobalContext = createContext();

/**
 * 🌐 ProjectGlobalProvider
 * - 전체 프로젝트 / 업무 트리 / 선택 상태를 전역으로 관리
 */
export function ProjectGlobalProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [tasksByProject, setTasksByProject] = useState({});
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [viewType, setViewType] = useState(() => localStorage.getItem("viewType_global") || "list");
  const [loading, setLoading] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [parentTaskId, setParentTaskId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterAssignee, setFilterAssignee] = useState([]);

  // 언마운트 보호용
  const mountedRef = useRef(true);
  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  /* ----------------------------------------
   * ✅ viewType 로컬 스토리지 자동 저장
   * ---------------------------------------- */
  useEffect(() => {
    localStorage.setItem("viewType_global", viewType);
  }, [viewType]);

  /* ----------------------------------------
   * ✅ 프로젝트 목록 불러오기
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

  /* ----------------------------------------
   * ✅ 특정 프로젝트의 업무 트리 불러오기
   * ---------------------------------------- */
  const _fetchTasksDirect = useCallback(async projectId => {
    if (!projectId) return;
    try {
      const { data } = await API.get(`/projects/${projectId}/tasks/tree`);
      if (mountedRef.current) {
        setTasksByProject(prev => ({ ...prev, [projectId]: data }));
      }
    } catch (err) {
      console.error(`❌ 업무 로드 실패 (projectId=${projectId}):`, err);
    }
  }, []);

  // ✅ 외부(컴포넌트)에서 쓰는 "부드러운" 호출
  const fetchTasksByProject = useCallback(
    debounce(projectId => {
      _fetchTasksDirect(projectId);
    }, 250),
    [_fetchTasksDirect],
  );
  // ✅ 내부 배치/초기 로드용 즉시 호출
  const fetchTasksByProjectNow = _fetchTasksDirect;

  /* ----------------------------------------
   * ✅ 특정 업무 로컬 업데이트 (부분 업데이트 최적화)
   * ---------------------------------------- */
  const updateTaskLocal = useCallback((taskId, updatedFields) => {
    if (!taskId || !updatedFields) return;

    setTasksByProject(prev => {
      const updated = { ...prev }; // ✅ shallow copy로 빠른 처리

      for (const [pid, taskList] of Object.entries(updated)) {
        const idx = taskList.findIndex(t => String(t.task_id) === String(taskId));
        if (idx !== -1) {
          updated[pid] = [
            ...taskList.slice(0, idx),
            { ...taskList[idx], ...updatedFields },
            ...taskList.slice(idx + 1),
          ];
          break;
        }
      }

      return updated;
    });
  }, []);

  /* ----------------------------------------
   * ✅ 전체 프로젝트 초기 로드
   * ---------------------------------------- */
  useEffect(() => {
    fetchAllProjects();
    return () => {
      // ✅ debounce 정리
      try {
        fetchTasksByProject.cancel?.();
      } catch {}
    };
  }, [fetchAllProjects, fetchTasksByProject]);

  /* ----------------------------------------
   * ✅ 신규 프로젝트의 업무 트리 자동 로드
   * ---------------------------------------- */
  useEffect(() => {
    if (projects.length > 0) {
      const uncached = projects.filter(p => !tasksByProject[p.project_id]);
      if (uncached.length > 0) {
        // ✅ 실제로 Promise를 기다릴 수 있게 즉시 호출 사용
        Promise.all(uncached.map(p => fetchTasksByProjectNow(p.project_id))).catch(err =>
          console.warn("⚠️ 일부 프로젝트 로드 실패:", err),
        );
      }
    }
  }, [projects, tasksByProject, fetchTasksByProjectNow]);

  /* ----------------------------------------
   * ✅ 선택된 프로젝트 변경 시 자동 로드
   * ---------------------------------------- */
  useEffect(() => {
    if (selectedProjectId && !tasksByProject[selectedProjectId]) {
      // ✅ 선택 전환 시도 정확히 로드 보장
      fetchTasksByProjectNow(selectedProjectId);
    }
  }, [selectedProjectId, tasksByProject, fetchTasksByProjectNow]);

  /* ----------------------------------------
   * 🌐 Context 값 제공
   * ---------------------------------------- */
  const value = {
    projects,
    setProjects,
    tasksByProject,
    loading,
    selectedProjectId,
    setSelectedProjectId,
    selectedTask,
    setSelectedTask,
    viewType,
    setViewType,
    fetchAllProjects,
    fetchTasksByProject,
    fetchTasksByProjectNow,
    updateTaskLocal,
    openDrawer,
    setOpenDrawer,
    parentTaskId,
    setParentTaskId,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    filterAssignee,
    setFilterAssignee,
  };

  return <ProjectGlobalContext.Provider value={value}>{children}</ProjectGlobalContext.Provider>;
}

/* ----------------------------------------
 * ✅ 전역 훅
 * ---------------------------------------- */
export function useProjectGlobal() {
  const ctx = useContext(ProjectGlobalContext);
  if (!ctx) throw new Error("useProjectGlobal must be used within ProjectGlobalProvider");
  return ctx;
}
