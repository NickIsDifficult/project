// src/components/projects/ProjectKanbanView/ProjectColumn.jsx
import ProjectCard from "./ProjectCard";

export default function ProjectColumn({
  label,
  items = [],
  colorMap,
  onProjectClick,
  onTaskClick,
}) {
  return (
    <div style={colWrapper}>
      <div style={colHeader}>
        {label} <span style={countBadge}>{items.length}</span>
      </div>
      <div style={colBody}>
        {items.length === 0 ? (
          <p style={emptyText}>프로젝트 없음</p>
        ) : (
          items.map(item => (
            <ProjectCard
              key={item.project_id}
              project={item}
              onClick={onProjectClick}
              onTaskClick={onTaskClick}
              color={colorMap[item.project_id]}
            />
          ))
        )}
      </div>
    </div>
  );
}

const colWrapper = {
  minWidth: 260,
  background: "#f8f9fa",
  borderRadius: 8,
  display: "flex",
  flexDirection: "column",
  height: "calc(100vh - 200px)",
  padding: 8,
  boxShadow: "inset 0 0 0 1px #e0e0e0",
};
const colHeader = {
  display: "flex",
  justifyContent: "space-between",
  fontWeight: 600,
  fontSize: 15,
  borderBottom: "1px solid #ddd",
  marginBottom: 6,
  paddingBottom: 4,
};
const countBadge = {
  background: "#dee2e6",
  borderRadius: 12,
  fontSize: 12,
  padding: "2px 8px",
};
const colBody = { flex: 1, overflowY: "auto", paddingRight: 4 };
const emptyText = { textAlign: "center", color: "#aaa", marginTop: 12, fontSize: 13 };
