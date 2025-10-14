import React, { useState, useEffect } from "react";

export default function TaskList({ onSelectTask }) {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/projects")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProjects(data);
        } else {
          setProjects([]);
        }
      })
      .catch((err) => console.error("Error fetching projects:", err));
  }, []);

  return (
    <div style={{ marginTop: "20px" }}>
      <h3 style={{ marginBottom: "10px" }}>프로젝트 목록</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {projects.map((project) => (
          <li
            key={project.id}
            onClick={() => onSelectTask(project)} // 클릭 시 선택 이벤트 전달
            style={{
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              marginBottom: "8px",
              cursor: "pointer",
              background: "#fff",
            }}
          >
            <strong>{project.title}</strong>
            <p style={{ margin: "4px 0", color: "#666", fontSize: "13px" }}>
              {project.description}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
