// src/pages/projects/ProjectDetailPage/ProjectHeaderSection.jsx
import Button from "../../../components/common/Button";

export default function ProjectHeaderSection({ project, onBack }) {
  if (!project) return null;

  const { project_name, description, start_date, end_date } = project;

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
        <h1 style={{ fontSize: 26, fontWeight: "bold", margin: 0 }}>{project_name}</h1>
        <p style={{ color: "#666", marginTop: 4 }}>{description || "설명 없음"}</p>
        {(start_date || end_date) && (
          <p style={{ color: "#999", fontSize: 13, marginTop: 4 }}>
            📅 {start_date || "시작일 미정"} ~ {end_date || "종료일 미정"}
          </p>
        )}
      </div>

      <Button variant="secondary" onClick={onBack}>
        ← 프로젝트 목록
      </Button>
    </div>
  );
}
