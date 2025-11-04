// src/components/project/ProjectDetailPanel/index.jsx
import { useEffect, useState } from "react";
import {
  ProjectDetailProvider,
  useProjectDetailContext,
} from "../../../context/ProjectDetailContext";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import Button from "../../common/Button";
import { Drawer } from "../../common/Drawer";
import { Loader } from "../../common/Loader";
import ProjectInfoView from "./ProjectInfoView";
import TaskEditForm from "./TaskEditForm";
import TaskInfoView from "./TaskInfoView";

export default function ProjectDetailPanel({ projectId, taskId, onClose }) {
  return (
    <ProjectDetailProvider projectId={projectId} taskId={taskId}>
      <PanelContent onClose={onClose} />
    </ProjectDetailProvider>
  );
}

function PanelContent({ onClose }) {
  const {
    project,
    task,
    loading,
    employees,
    handleSaveEdit,
    handleProgressChange,
    handleStatusChange,
    reload,
  } = useProjectDetailContext();
  const { fetchTasksByProject, setUiState } = useProjectGlobal();

  const [openEditDrawer, setOpenEditDrawer] = useState(false);

  const handleClose = () => {
    setUiState(prev => ({
      ...prev,
      panel: { selectedTask: null },
      drawer: { ...prev.drawer, task: false, project: false },
    }));
    onClose?.();
  };

  useEffect(() => {
    const esc = e => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);

  if (loading.project || loading.tasks)
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: 480,
          height: "100%",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 20px rgba(0,0,0,0.15)",
        }}
      >
        <Loader text="상세 불러오는 중..." />
      </div>
    );

  if (!project && !task)
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: 480,
          height: "100%",
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 20px rgba(0,0,0,0.15)",
        }}
      >
        <p style={{ color: "#777", marginBottom: 16 }}>❌ 데이터를 찾을 수 없습니다.</p>
        <Button variant="secondary" onClick={handleClose}>
          닫기
        </Button>
      </div>
    );

  const isTask = !!task;

  return (
    <>
      <Drawer open title={isTask ? "🧩 업무 상세" : "📁 프로젝트 상세"} onClose={handleClose}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 24 }}>
          {isTask ? (
            <TaskInfoView
              task={task}
              onRefresh={reload}
              employees={employees}
              onProgressChange={handleProgressChange}
              onStatusChange={handleStatusChange}
              onEdit={() => setOpenEditDrawer(true)}
            />
          ) : (
            <ProjectInfoView project={project} onClose={handleClose} />
          )}
        </div>
      </Drawer>

      {isTask && (
        <Drawer open={openEditDrawer} title="✏️ 업무 수정" onClose={() => setOpenEditDrawer(false)}>
          <TaskEditForm
            task={task}
            employees={employees}
            onSave={async formData => {
              await handleSaveEdit(formData);
              await reload();
              await fetchTasksByProject(project.project_id);
              setOpenEditDrawer(false);
            }}
            onCancel={() => setOpenEditDrawer(false)}
          />
        </Drawer>
      )}
    </>
  );
}
