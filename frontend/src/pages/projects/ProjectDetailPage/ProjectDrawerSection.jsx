// ✅ src/pages/projects/ProjectDetailPage/ProjectDrawerSection.jsx
import { Drawer } from "../../../components/common/Drawer";
import ProjectRegistration from "../../../components/projects/ProjectRegistration";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";

export default function ProjectDrawerSection() {
  const {
    openDrawer,
    setOpenDrawer,
    selectedProjectId,
    fetchTasksByProject, // 프로젝트 생성 후 전체 목록 새로고침용
  } = useProjectGlobal();

  // 닫기
  const handleClose = () => {
    setOpenDrawer(false);
  };

  // 저장 후 새로고침
  const handleAfterSubmit = async () => {
    await fetchTasksByProject(selectedProjectId);
    handleClose();
  };

  return (
    <Drawer open={openDrawer} title="새 프로젝트 등록" onClose={handleClose}>
      <ProjectRegistration onClose={handleAfterSubmit} />
    </Drawer>
  );
}
