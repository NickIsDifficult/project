// ✅ 수정된 src/pages/projects/ProjectPanelSection.jsx
import ProjectDetailPanel from "../../components/projects/ProjectDetailPanel";
import { ProjectDetailProvider } from "../../context/ProjectDetailContext";
import { useProjectGlobal } from "../../context/ProjectGlobalContext";

export default function ProjectPanelSection() {
  const { uiState, setUiState } = useProjectGlobal();
  const selectedTask = uiState.panel.selectedTask;

  if (!selectedTask) return null;

  const isProject = !!selectedTask.isProject;
  const projectId = selectedTask.project_id;

  return (
    // ✅ Context Provider로 감싸기
    <ProjectDetailProvider projectId={projectId}>
      <ProjectDetailPanel
        projectId={projectId}
        taskId={isProject ? undefined : selectedTask.task_id}
        isProject={isProject}
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
    </ProjectDetailProvider>
  );
}
