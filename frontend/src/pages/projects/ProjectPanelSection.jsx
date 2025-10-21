// src/pages/projects/ProjectPanelSection.jsx
import TaskDetailPanel from "../../components/tasks/TaskDetailPanel";
import { useProjectGlobal } from "../../context/ProjectGlobalContext";

export default function ProjectPanelSection() {
  const { uiState, setUiState } = useProjectGlobal();
  const selectedTask = uiState.panel.selectedTask;

  if (!selectedTask) return null;

  return (
    <TaskDetailPanel
      projectId={selectedTask.project_id}
      taskId={selectedTask.isProject ? undefined : selectedTask.task_id}
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
