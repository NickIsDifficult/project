// src/pages/projects/ProjectDetailPage/TaskDrawerSection.jsx
import { Drawer } from "../../../components/common/Drawer";
import TaskRegistration from "../../../components/tasks/TaskRegistration";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";

export default function TaskDrawerSection({
  openDrawer,
  setOpenDrawer,
  parentTaskId,
  setParentTaskId,
  projectId,
}) {
  const { fetchTasksByProject } = useProjectGlobal();

  const handleClose = () => {
    setOpenDrawer(false);
    setParentTaskId(null);
  };

  const handleAfterSubmit = async () => {
    await fetchTasksByProject(projectId);
    handleClose();
  };

  return (
    <Drawer
      open={openDrawer}
      title={parentTaskId ? "하위 업무 등록" : "업무 등록"}
      onClose={handleClose}
    >
      <TaskRegistration
        projectId={projectId}
        parentTaskId={parentTaskId}
        onClose={handleAfterSubmit}
      />
    </Drawer>
  );
}
