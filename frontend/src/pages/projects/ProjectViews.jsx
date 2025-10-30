// src/pages/projects/ProjectViews.jsx
import { useMemo } from "react";
import ProjectCalendarView from "../../components/projects/ProjectCalendarView";
import ProjectKanbanView from "../../components/projects/ProjectKanbanView";
import ProjectListView from "../../components/projects/ProjectListView";
import { useProjectGlobal } from "../../context/ProjectGlobalContext";
import { mergeTasksAcrossProjects } from "../../utils/taskUtils";

export default function ProjectViews() {
  const { viewType, projects, tasksByProject, setUiState } = useProjectGlobal();
  const allTasks = useMemo(
    () => mergeTasksAcrossProjects(projects, tasksByProject),
    [projects, tasksByProject],
  );

  // ✅ 업무(Task) 클릭 → Task 패널 열기
  const handleTaskClick = task => {
    setUiState(prev => ({
      ...prev,
      panel: { selectedTask: task }, // ProjectPanelSection에서 task_id로 전달됨
    }));
  };

  // ✅ 프로젝트(Project) 클릭 → Project 패널 열기
  const handleProjectClick = project => {
    setUiState(prev => ({
      ...prev,
      panel: {
        selectedTask: {
          project_id: project.project_id,
          isProject: true,
        },
      },
    }));
  };

  if (viewType === "kanban") return <ProjectKanbanView />;
  if (viewType === "calendar")
    return (
      <ProjectCalendarView
        tasks={allTasks}
        onTaskClick={handleTaskClick}
        onProjectClick={handleProjectClick} // ✅ 추가
      />
    );
  return <ProjectListView tasks={allTasks} />;
}
