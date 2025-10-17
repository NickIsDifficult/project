import { useMemo } from "react";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import { Loader } from "../../common/Loader";
import TaskListTable from "./TaskListTable";
import { useTaskList } from "./useTaskList";

/**
 * ✅ TaskListView (전역 프로젝트 포함형)
 * - 각 프로젝트를 루트 노드로 하여 업무를 재귀 렌더링
 * - ProjectGlobalContext 기반
 */
export default function TaskListView() {
  const { projects, tasksByProject, loading } = useProjectGlobal();

  // ✅ 프로젝트 + 업무 트리 구조로 통합
  const projectNodes = useMemo(() => {
    if (!projects?.length) return [];
    return projects.map(project => ({
      task_id: project.project_id,
      title: project.project_name,
      isProject: true,
      subtasks: tasksByProject[project.project_id] || [],
    }));
  }, [projects, tasksByProject]);

  const hook = useTaskList({ allTasks: projectNodes });

  if (loading) return <Loader text="업무 불러오는 중..." />;

  if (!projects.length)
    return <div className="p-6 text-gray-600">❌ 등록된 프로젝트가 없습니다.</div>;

  return (
    <div className="p-4">
      <TaskListTable {...hook} />
    </div>
  );
}
