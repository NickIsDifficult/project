// src/components/tasks/TaskListView/index.jsx
import { useProjectDetailContext } from "../../../context/ProjectDetailContext";
import { Loader } from "../../common/Loader";
import TaskListTable from "./TaskListTable";
import { useTaskList } from "./useTaskList";

export default function TaskListView({ onTaskClick }) {
  const { loading } = useProjectDetailContext();
  const hook = useTaskList({ onTaskClick });

  if (loading || hook.loading) return <Loader text="업무 불러오는 중..." />;

  return (
    <div className="p-2">
      <TaskListTable {...hook} />
    </div>
  );
}
