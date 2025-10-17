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
      subtasks: tasksByProject?.[project.project_id] ?? [], // ✅ 안전하게 처리
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
    setOpenDrawer(false); // ✅ Drawer 항상 닫기
    hook.onTaskClick(task); // ✅ 기존 상세 열기 로직 유지
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
      {/* ✅ handleTaskClick 을 onTaskClick 으로 전달 */}
      <TaskListTable {...hook} onTaskClick={handleTaskClick} />
    </div>
  );
}
