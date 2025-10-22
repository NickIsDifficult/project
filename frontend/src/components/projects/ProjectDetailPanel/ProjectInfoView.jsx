// src/components/project/ProjectDetailPanel/ProjectInfoView.jsx
import ProjectDetailForm from "./ProjectDetailForm";

export default function ProjectInfoView({ project, onClose }) {
  if (!project) return <p style={{ padding: 20, color: "crimson" }}>⚠️ 프로젝트 데이터 없음</p>;

  const projectId = project.id || project.project_id;
  if (!projectId) return <p style={{ padding: 20, color: "crimson" }}>⚠️ projectId가 없습니다.</p>;

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 16 }}>📁 프로젝트 상세 보기</h2>
      <ProjectDetailForm projectId={projectId} onClose={onClose} />
    </div>
  );
}
