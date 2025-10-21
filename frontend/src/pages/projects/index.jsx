// src/pages/projects/index.jsx
import { Toaster } from "react-hot-toast";
import { Loader } from "../../components/common/Loader";
import { useProjectGlobal } from "../../context/ProjectGlobalContext";
import AppShell from "../../layout/AppShell";
import ProjectDrawerSection from "./ProjectDrawerSection";
import ProjectHeaderSection from "./ProjectHeaderSection";
import ProjectPanelSection from "./ProjectPanelSection";
import ProjectViews from "./ProjectViews";
import ViewSwitcherSection from "./ViewSwitcherSection";

export default function ProjectDashboard() {
  const { loading, projects } = useProjectGlobal();

  if (loading) return <Loader text="전체 프로젝트 불러오는 중..." />;
  if (!projects?.length) return <div className="p-6">❌ 등록된 프로젝트가 없습니다.</div>;

  return (
    <AppShell>
      <div className="p-6">
        <Toaster position="top-right" />
        <ProjectHeaderSection />
        <ViewSwitcherSection />
        <ProjectViews />
        <ProjectDrawerSection />
        <ProjectPanelSection />
      </div>
    </AppShell>
  );
}
