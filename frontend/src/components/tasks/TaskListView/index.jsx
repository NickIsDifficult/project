// src/components/tasks/TaskListView/index.jsx
import React from "react";
import { Loader } from "../../common/Loader";
import TaskListTable from "./TaskListTable";
import { useTaskList } from "./useTaskList";

export default function TaskListView({
  projectId,
  tasks: initialTasks = [],
  onTasksChange,
  onTaskClick,
}) {
  const hook = useTaskList({ projectId, initialTasks, onTasksChange, onTaskClick });

  if (hook.loading) return <Loader text="처리 중..." />;

  return (
    <div style={{ padding: 8 }}>
      <TaskListTable {...hook} />
    </div>
  );
}
