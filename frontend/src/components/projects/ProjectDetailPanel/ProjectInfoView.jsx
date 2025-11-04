import ProjectDetailForm from "./ProjectDetailForm";

export default function ProjectInfoView({ project, onClose }) {
  if (!project)
    return (
      <p style={{ padding: 16, color: "crimson", fontSize: 14 }}>
        ⚠️ 프로젝트 데이터를 불러올 수 없습니다.
      </p>
    );

  const projectId = project.project_id || project.id;
  if (!projectId)
    return (
      <p style={{ padding: 16, color: "crimson", fontSize: 14 }}>
        ⚠️ projectId가 존재하지 않습니다.
      </p>
    );

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>📁 프로젝트 상세 정보</h2>
      <ProjectDetailForm projectId={projectId} onClose={onClose} />
    </div>
  );
}
