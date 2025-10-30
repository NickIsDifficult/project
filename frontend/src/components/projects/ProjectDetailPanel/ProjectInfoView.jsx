// src/components/project/ProjectDetailPanel/ProjectInfoView.jsx
import ProjectDetailForm from "./ProjectDetailForm";

export default function ProjectInfoView({ project, onClose }) {
  if (!project)
    return <p className="p-4 text-red-500 text-sm">⚠️ 프로젝트 데이터를 불러올 수 없습니다.</p>;

  const projectId = project.project_id || project.id;
  if (!projectId)
    return <p className="p-4 text-red-500 text-sm">⚠️ projectId가 존재하지 않습니다.</p>;

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">📁 프로젝트 상세 정보</h2>
      <ProjectDetailForm projectId={projectId} onClose={onClose} />
    </div>
  );
}
