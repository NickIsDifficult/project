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
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ 프로젝트 목록 불러오기 실패:", err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ----------------------------------------
   * ✅ 특정 프로젝트의 업무 트리 불러오기
   * ---------------------------------------- */
  const _fetchTasksDirect = useCallback(async projectId => {
    if (!projectId) return;
    try {
      const { data } = await API.get(`/projects/${projectId}/tasks/tree`);
      setTasksByProject(prev => ({ ...prev, [projectId]: data }));
    } catch (err) {
      console.error(`❌ 업무 로드 실패 (projectId=${projectId}):`, err);
    }
  }, []);

  // ✅ lodash.debounce 적용 (250ms 내 중복 호출 병합)
  const fetchTasksByProject = useCallback(
    debounce(projectId => {
      _fetchTasksDirect(projectId);
    }, 250),
    [_fetchTasksDirect],
  );

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
  }, [fetchAllProjects]);

  /* ----------------------------------------
   * ✅ 신규 프로젝트의 업무 트리 자동 로드
   * ---------------------------------------- */
  useEffect(() => {
    if (projects.length > 0) {
      const uncached = projects.filter(p => !tasksByProject[p.project_id]);
      if (uncached.length > 0) {
        Promise.all(uncached.map(p => fetchTasksByProject(p.project_id))).catch(err =>
          console.warn("⚠️ 일부 프로젝트 로드 실패:", err),
        );
      }
    }
  }, [projects, tasksByProject, fetchTasksByProject]);

  /* ----------------------------------------
   * ✅ 선택된 프로젝트 변경 시 자동 로드
   * ---------------------------------------- */
  useEffect(() => {
    if (selectedProjectId && !tasksByProject[selectedProjectId]) {
      fetchTasksByProject(selectedProjectId);
    }
  }, [selectedProjectId, tasksByProject, fetchTasksByProject]);

  /* ----------------------------------------
   * ✅ 선택된 Task → Drawer 자동 오픈
   * ---------------------------------------- */
  useEffect(() => {
    if (selectedTask) setOpenDrawer(true);
  }, [selectedTask]);

  /* ----------------------------------------
   * 🌐 Context 값 제공
   * ---------------------------------------- */
  const value = {
    projects,
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
    updateTaskLocal,
    openDrawer,
    setOpenDrawer,
    parentTaskId,
    setParentTaskId,
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
