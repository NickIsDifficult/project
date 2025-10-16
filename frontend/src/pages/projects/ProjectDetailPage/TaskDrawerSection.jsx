// src/pages/projects/ProjectDetailPage/TaskDrawerSection.jsx
import { Drawer } from "../../../components/common/Drawer";
import TaskRegistration from "../../../components/tasks/TaskRegistration";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";

export default function TaskDrawerSection() {
  const {
    openDrawer,
    setOpenDrawer,
    parentTaskId,
    setParentTaskId,
    selectedProjectId,
    fetchTasksByProject,
  } = useProjectGlobal();

  const handleClose = () => {
    setOpenDrawer(false);
    setParentTaskId(null);
  };

  const handleAfterSubmit = async () => {
    if (selectedProjectId) {
      await fetchTasksByProject(selectedProjectId);
    }
    handleClose();
  };

  return (
    <Drawer
      open={openDrawer}
      title={parentTaskId ? "하위 업무 등록" : "새 업무 등록"}
      onClose={handleClose}
    >
      <TaskRegistration
        projectId={selectedProjectId}
        parentTaskId={parentTaskId}
        onClose={handleAfterSubmit}
      />
    </Drawer>
  );
}
