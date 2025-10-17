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
    if (!projects?.length) return [];
    return projects.map(project => ({
      project_id: project.project_id,
      task_id: null, // ✅ 프로젝트는 task_id 없음
      title: project.project_name,
      isProject: true,
      status: project.status ?? "TODO", // 기본값 보정
      assignee_name: project.manager_name ?? "미지정",
      start_date: project.start_date ?? null,
      due_date: project.due_date ?? null,
      subtasks: tasksByProject?.[project.project_id] ?? [],
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
