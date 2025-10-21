// src/pages/projects/ProjectDrawerSection.jsx
import { Drawer } from "../../components/common/Drawer";
import ProjectRegistration from "../../components/projects/ProjectRegistration";
import { useProjectGlobal } from "../../context/ProjectGlobalContext";

export default function ProjectDrawerSection() {
  const { uiState, setUiState, fetchAllProjects } = useProjectGlobal();
  const open = uiState.drawer.project;

  const handleClose = () => {
    setUiState(prev => ({
      ...prev,
      drawer: { ...prev.drawer, project: false },
    }));
  };

  const handleAfterSubmit = async () => {
    await fetchAllProjects();
    handleClose();
  };

  return (
    <Drawer open={open} title="새 프로젝트 등록" onClose={handleClose}>
      <ProjectRegistration onClose={handleAfterSubmit} />
    </Drawer>
  );
}
