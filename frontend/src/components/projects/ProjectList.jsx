import React from "react";

export default function ProjectList({ projects = [], onSelectProject }) {
  return (
    <div style={{ marginTop: "20px" }}>
      <h3 style={{ marginBottom: "10px" }}>프로젝트 목록</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {projects.length > 0 ? (
          projects.map((project) => (
            <li
              key={project.project_id}
              onClick={() => onSelectProject(project)}
              style={{
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                marginBottom: "8px",
                cursor: "pointer",
                background: "#fff",
              }}
            >
              <strong>{project.project_name}</strong>
              <p style={{ margin: "4px 0", color: "#555", fontSize: "13px" }}>
                {project.description || "설명 없음"}
              </p>
            </li>
          ))
        ) : (
          <p style={{ color: "#aaa", textAlign: "center" }}>등록된 프로젝트가 없습니다.</p>
        )}
      </ul>
    </div>
  );
}
