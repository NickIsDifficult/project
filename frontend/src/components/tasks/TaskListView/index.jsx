import { Loader } from "../../common/Loader";
import TaskListTable from "./TaskListTable";
import { useTaskList } from "./useTaskList";

export default function TaskListView({ tasks = [] }) {
  const hook = useTaskList({ allTasks: tasks });

  if (hook.loading) return <Loader text="업무 불러오는 중..." />;

  // ✅ 프로젝트별로 그룹화 + 가짜 루트 노드 생성
  const projectNodes = Object.entries(
    tasks.reduce((acc, t) => {
      const project = t.project_name || "미분류 프로젝트";
      if (!acc[project]) acc[project] = [];
      acc[project].push(t);
      return acc;
    }, {}),
  ).map(([projectName, projectTasks]) => ({
    task_id: `project-${projectName}`,
    title: projectName,
    description: "",
    status: "PROJECT",
    assignee_name: "",
    start_date: null,
    due_date: null,
    subtasks: projectTasks, // ✅ 하위 업무 연결
    isProject: true,
  }));

  return (
    <div className="p-2">
      <TaskListTable {...hook} filteredTasks={projectNodes} />
    </div>
  );
}
