// src/pages/projects/ProjectDetailPage/TaskDrawerSection.jsx
import { Drawer } from "../../../components/common/Drawer";
import TaskRegistration from "../../../components/tasks/TaskRegistration";
import { useProjectDetailContext } from "../../../context/ProjectDetailContext";

export default function TaskDrawerSection({
  openDrawer,
  setOpenDrawer,
  parentTaskId,
  setParentTaskId,
  projectId,
}) {
  // ✅ Context에서 fetchTasks 직접 사용 (props 제거)
  const { fetchTasks } = useProjectDetailContext();

  const handleClose = () => {
    setOpenDrawer(false);
    setParentTaskId(null);
  };

  const handleAfterSubmit = () => {
    handleClose();
    fetchTasks(); // 등록 후 프로젝트 업무 목록 새로고침
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
