import { createContext, useContext, useEffect, useState } from "react";
import API from "../services/api/http";

const ProjectGlobalContext = createContext();

/**
 * 🌐 ProjectGlobalProvider
 * - 전체 프로젝트 / 업무 트리 / 선택 상태를 전역으로 관리
 * - ProjectDetailPage, TaskDetailPanel, Kanban/List/Calendar 등 공통 사용
 */
export function ProjectGlobalProvider({ children }) {
  const [projects, setProjects] = useState([]); // 전체 프로젝트 목록
  const [tasksByProject, setTasksByProject] = useState({}); // 프로젝트별 업무 트리
  const [selectedProjectId, setSelectedProjectId] = useState(null); // 선택된 프로젝트
  const [selectedTask, setSelectedTask] = useState(null); // 선택된 업무 (상세 패널용)
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
  async function fetchAllProjects() {
    try {
      setLoading(true);
      const { data } = await API.get("/projects");
      if (Array.isArray(data)) setProjects(data);
      else setProjects([]);
    } catch (err) {
      console.error("❌ 프로젝트 목록 불러오기 실패:", err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  /* ----------------------------------------
   * ✅ 특정 프로젝트의 업무 트리 불러오기
   * ---------------------------------------- */
  async function fetchTasksByProject(projectId) {
    const pid = Number(projectId);
    if (!pid) return;
    try {
      const { data } = await API.get(`/projects/${pid}/tasks/tree`);
      setTasksByProject(prev => ({
        ...prev,
        [pid]: Array.isArray(data) ? data : [],
      }));
    } catch (err) {
      console.error(`❌ 프로젝트(${pid}) 업무 불러오기 실패:`, err);
    }
  }

  /* ----------------------------------------
   * ✅ 특정 업무 로컬 업데이트 (Optimistic Update)
   * - 트리형 데이터 구조에서도 하위까지 안전하게 갱신
   * ---------------------------------------- */
  function updateTaskLocal(taskId, updatedTask) {
    if (!taskId || !updatedTask) return;

    const updateRecursive = tasks =>
      tasks.map(t => {
        if (t.task_id === taskId) return { ...t, ...updatedTask };
        if (t.subtasks?.length) {
          return { ...t, subtasks: updateRecursive(t.subtasks) };
        }
        return t;
      });

    setTasksByProject(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(pid => {
        newState[pid] = updateRecursive(newState[pid] || []);
      });
      return newState;
    });
  }

  /* ----------------------------------------
   * ✅ 전체 프로젝트 초기 로드
   * ---------------------------------------- */
  useEffect(() => {
    fetchAllProjects();
  }, []);

  /* ----------------------------------------
   * ✅ 신규 프로젝트의 업무 트리 자동 로드
   * ---------------------------------------- */
  useEffect(() => {
    if (projects.length > 0) {
      const uncached = projects.filter(p => !tasksByProject[p.project_id]);
      if (uncached.length > 0) {
        // ⚙️ 하나 실패해도 나머지는 유지
        Promise.allSettled(uncached.map(p => fetchTasksByProject(p.project_id)));
      }
    }
  }, [projects]);

  /* ----------------------------------------
   * ✅ 선택된 프로젝트 변경 시 자동 로드
   * ---------------------------------------- */
  useEffect(() => {
    if (selectedProjectId && !tasksByProject[selectedProjectId]) {
      fetchTasksByProject(selectedProjectId);
    }
  }, [selectedProjectId]);

  /* ----------------------------------------
   * ✅ 선택된 Task 감지 → Drawer 자동 오픈
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

/**
 * ✅ 전역 훅
 */
export function useProjectGlobal() {
  const ctx = useContext(ProjectGlobalContext);
  if (!ctx) throw new Error("useProjectGlobal must be used within ProjectGlobalProvider");
  return ctx;
}
