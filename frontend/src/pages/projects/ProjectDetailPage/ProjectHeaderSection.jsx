// src/pages/projects/ProjectDetailPage/ProjectHeaderSection.jsx
import Button from "../../../components/common/Button";

export default function ProjectHeaderSection({ project, onBack }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
      }}
    >
      <div>
        <h1 style={{ fontSize: 26, fontWeight: "bold", margin: 0 }}>{project.project_name}</h1>
        <p style={{ color: "#666", marginTop: 4 }}>{project.description || "설명 없음"}</p>
        <p style={{ color: "#999", fontSize: 13, marginTop: 4 }}>
          📅 {project.start_date} ~ {project.end_date}
        </p>
      </div>
      <Button variant="secondary" onClick={onBack}>
        ← 프로젝트 목록
      </Button>
    </div>
  );
}
