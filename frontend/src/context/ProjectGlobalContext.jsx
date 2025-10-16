// src/context/ProjectGlobalContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import API from "../services/api/http";

const ProjectGlobalContext = createContext();

/**
 * 🌐 ProjectGlobalProvider
 * - 전체 프로젝트 / 업무 트리 / 선택 상태를 전역으로 관리
 * - ProjectDetailPage, TaskDetailPanel, Kanban/List/Calendar에서 공통 사용
 */
export function ProjectGlobalProvider({ children }) {
  const [projects, setProjects] = useState([]); // 전체 프로젝트 목록
  const [tasksByProject, setTasksByProject] = useState({}); // 프로젝트별 업무 트리
  const [selectedProjectId, setSelectedProjectId] = useState(null); // 현재 선택된 프로젝트
  const [selectedTask, setSelectedTask] = useState(null); // 현재 선택된 업무(상세 패널)
  const [viewType, setViewType] = useState("list"); // 현재 뷰 타입
  const [loading, setLoading] = useState(false); // 전역 로딩 상태
  const [openDrawer, setOpenDrawer] = useState(false);
  const [parentTaskId, setParentTaskId] = useState(null);

  /** ✅ 프로젝트 목록 불러오기 */
  async function fetchAllProjects() {
    try {
      setLoading(true);
      const { data } = await API.get("/projects");
      setProjects(data || []);
    } catch (err) {
      console.error("❌ 프로젝트 목록 불러오기 실패:", err);
    } finally {
      setLoading(false);
    }
  }

  /** ✅ 특정 프로젝트 업무 트리 불러오기 */
  async function fetchTasksByProject(projectId) {
    if (!projectId) return;
    try {
      const { data } = await API.get(`/projects/${projectId}/tasks/tree`);
      setTasksByProject(prev => ({
        ...prev,
        [projectId]: data || [],
      }));
    } catch (err) {
      console.error(`❌ 프로젝트(${projectId}) 업무 불러오기 실패:`, err);
    }
  }

  /** ✅ 로컬 상태에서 특정 업무 즉시 업데이트 (서버 반영 전 Optimistic Update용)
   *  - 트리형 데이터에서도 하위 업무까지 안전하게 갱신됨
   */
  function updateTaskLocal(taskId, updatedTask) {
    if (!taskId || !updatedTask) return;

    // 내부 재귀 업데이트 함수
    const updateRecursive = tasks =>
      tasks.map(t => {
        if (t.task_id === taskId) return updatedTask;
        if (t.subtasks?.length) {
          return { ...t, subtasks: updateRecursive(t.subtasks) };
        }
        return t;
      });

    setTasksByProject(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(pid => {
        newState[pid] = updateRecursive(newState[pid]);
      });
      return newState;
    });
  }

  /** ✅ 초기 전체 프로젝트 로드 */
  useEffect(() => {
    fetchAllProjects();
  }, []);

  /** ✅ projects 변경 시 캐싱되지 않은 프로젝트의 업무 트리 자동 로드 */
  useEffect(() => {
    if (projects.length > 0) {
      const uncached = projects.filter(p => !tasksByProject[p.project_id]);
      if (uncached.length > 0) {
        Promise.all(uncached.map(p => fetchTasksByProject(p.project_id)));
      }
    }
  }, [projects]);

  /** ✅ 선택된 프로젝트 변경 시 자동 데이터 로드 */
  useEffect(() => {
    if (selectedProjectId && !tasksByProject[selectedProjectId]) {
      fetchTasksByProject(selectedProjectId);
    }
  }, [selectedProjectId]);

  /** 🌐 전역 값 제공 */
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

/** ✅ 전역 훅 */
export function useProjectGlobal() {
  const ctx = useContext(ProjectGlobalContext);
  if (!ctx) throw new Error("useProjectGlobal must be used within ProjectGlobalProvider");
  return ctx;
}
