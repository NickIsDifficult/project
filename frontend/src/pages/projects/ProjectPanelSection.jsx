// src/pages/projects/ProjectPanelSection.jsx
import ProjectDetailPanel from "../../components/projects/ProjectDetailPanel";
import { useProjectGlobal } from "../../context/ProjectGlobalContext";

export default function ProjectPanelSection() {
  const { uiState, setUiState } = useProjectGlobal();
  const selectedTask = uiState.panel.selectedTask;

  if (!selectedTask) return null;

  const isProject = !!selectedTask.isProject;

  return (
    <ProjectDetailPanel
      projectId={selectedTask.project_id}
      taskId={isProject ? undefined : selectedTask.task_id}
      isProject={selectedTask.isProject}
      onClose={() =>
        setUiState(prev => ({
          ...prev,
          panel: { selectedTask: null },
        }))
      }
      onAddSubtask={taskId => {
        setUiState(prev => ({
          ...prev,
          drawer: { ...prev.drawer, task: true, parentTaskId: taskId },
          panel: { selectedTask: null },
        }));
      }}
    />
  );
}
