// src/components/tasks/TaskListView/index.jsx
import { useMemo } from "react";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import { Loader } from "../../common/Loader";
import TaskListTable from "./TaskListTable";
import { useTaskList } from "./useTaskList";

/**
 * ✅ TaskListView (전역 프로젝트 포함형)
 * - 모든 프로젝트를 루트 노드로 하여 업무를 재귀 렌더링
 * - ProjectGlobalContext 기반
 */
export default function TaskListView() {
  const { projects, tasksByProject, loading, setOpenDrawer } = useProjectGlobal();

  /* ----------------------------------------
   * 🧩 프로젝트 + 업무 트리 구조로 변환
   * ---------------------------------------- */
  const projectNodes = useMemo(() => {
  // ✅ projects 배열이 아니라 단일 project 객체일 수도 있음
  if (!projects) return [];

  const list = Array.isArray(projects) ? projects : [projects.project];
  const tasksMap = tasksByProject || {};

  return list.map(project => ({
    project_id: project.project_id,
    task_id: null,
    title: project.project_name,
    isProject: true,
    status: project.status ?? "TODO",
    assignees: project.members
      ? project.members.map(m => ({ emp_id: m.emp_id, name: m.name }))
      : [],
    start_date: project.start_date ?? null,
    due_date: project.end_date ?? null,
    subtasks: tasksMap?.[project.project_id] ?? [],
  }));
  }, [projects, tasksByProject]);
  /* ----------------------------------------
   * 🔁 업무 필터/정렬/검색 등 관리 훅
   * ---------------------------------------- */
  const hook = useTaskList({ allTasks: projectNodes });

  /* ----------------------------------------
   * ⚙️ 상세 클릭 시 Drawer 자동 닫기 보강
   * ---------------------------------------- */
  const handleTaskClick = task => {
    setOpenDrawer(false);
    hook.onTaskClick(task);
  };

  /* ----------------------------------------
   * ⏳ 로딩 / 예외 처리
   * ---------------------------------------- */
  if (loading) return <Loader text="업무 불러오는 중..." />;

  if (!projects?.length)
    return <div className="p-6 text-gray-600">❌ 등록된 프로젝트가 없습니다.</div>;

  /* ----------------------------------------
   * ✅ 메인 렌더링
   * ---------------------------------------- */
  return (
    <div className="p-4">
      <TaskListTable {...hook} onTaskClick={handleTaskClick} />
    </div>
  );
}
