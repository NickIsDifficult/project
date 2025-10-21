// src/pages/projects/ProjectViews.jsx
import { useMemo } from "react";
import ProjectKanbanView from "../../components/projects/ProjectKanbanView";
import TaskListView from "../../components/projects/ProjectListView";
import TaskCalendarView from "../../components/tasks/TaskCalendarView";
import { useProjectGlobal } from "../../context/ProjectGlobalContext";
import { mergeTasksAcrossProjects } from "../../utils/taskUtils";

export default function ProjectViews() {
  const { viewType, projects, tasksByProject } = useProjectGlobal();
  const allTasks = useMemo(
    () => mergeTasksAcrossProjects(projects, tasksByProject),
    [projects, tasksByProject],
  );

  if (viewType === "kanban") return <ProjectKanbanView />;
  if (viewType === "calendar") return <TaskCalendarView tasks={allTasks} />;
  return <TaskListView tasks={allTasks} />;
}
