import ProjectCard from "./ProjectCard";

export default function ProjectColumn({ label, tasks = [], onTaskClick, columnKey }) {
  return (
    <div style={colWrapper}>
      <div style={colHeader}>
        <span>{label}</span>
        <span style={countBadge}>{tasks.length}</span>
      </div>

      <div style={colBody}>
        {tasks.length === 0 ? (
          <p style={emptyText}>프로젝트 없음</p>
        ) : (
          tasks.map((proj, index) => (
            <ProjectCard
              key={`col-${columnKey}-proj-${proj.project_id ?? index}`}
              task={proj}
              index={parseInt(index, 10)}
              onClick={() => onTaskClick?.(proj)}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ---------------- 스타일 ---------------- */
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
  alignItems: "center",
  justifyContent: "space-between",
  fontWeight: "bold",
  fontSize: 16,
  margin: "4px 0 8px 4px",
  paddingBottom: 4,
  borderBottom: "1px solid #ddd",
};

const countBadge = {
  background: "#dee2e6",
  borderRadius: 12,
  fontSize: 12,
  padding: "2px 8px",
  color: "#333",
};

const colBody = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  overflowY: "auto",
  paddingRight: 4,
};

const emptyText = {
  textAlign: "center",
  color: "#aaa",
  marginTop: 12,
  fontSize: 13,
};
