// src/components/projects/ProjectKanbanView/ProjectCard.jsx
import { Draggable } from "@hello-pangea/dnd";

export default function ProjectCard({ project, index, color, onClick }) {
  const isDone = project.status?.toUpperCase() === "DONE";
  const progress = Math.min(project.progress ?? 0, 100);

  return (
    <Draggable draggableId={`project-${project.project_id}`} index={index} type="project">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick?.(project)}
          style={{
            ...styles.container,
            borderColor: snapshot.isDragging ? color : "#ddd",
            boxShadow: snapshot.isDragging
              ? `0 4px 10px rgba(0,0,0,0.15)`
              : "0 1px 2px rgba(0,0,0,0.08)",
            background: "#fff",
            ...provided.draggableProps.style,
          }}
        >
          <div style={{ ...styles.colorBar, background: color }} />
          <div style={styles.content}>
            <div style={styles.header}>
              <strong style={styles.name}>{project.project_name}</strong>
              <span style={styles.statusTag(project.status)}>
                {statusIcon(project.status)} {statusLabel(project.status)}
              </span>
            </div>
            <div style={styles.info}>
              👤 {project.owner_name ?? "미지정"}
              <span style={{ marginLeft: "auto" }}>📈 {progress}%</span>
            </div>

            <div style={styles.progressOuter}>
              <div
                style={{
                  ...styles.progressInner,
                  background: color,
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

/* 🎨 스타일 */
const styles = {
  container: {
    display: "flex",
    border: "1px solid #ddd",
    borderRadius: 10,
    marginBottom: 8,
    cursor: "grab",
    overflow: "hidden",
    transition: "all 0.25s ease",
  },
  colorBar: { width: 8, borderRadius: "10px 0 0 10px" },
  content: { flex: 1, padding: "8px 10px" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: 600,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  info: {
    fontSize: 12,
    color: "#555",
    display: "flex",
    gap: 6,
  },
  progressOuter: {
    height: 6,
    borderRadius: 4,
    background: "#e0e0e0",
    overflow: "hidden",
    marginTop: 4,
  },
  progressInner: {
    height: "100%",
    borderRadius: 4,
    transition: "width 0.3s ease",
  },
  statusTag: s => ({
    background: `${statusColor(s)}22`,
    color: statusColor(s),
    borderRadius: 6,
    padding: "2px 6px",
    fontSize: 11,
    fontWeight: 600,
  }),
};

const statusColor = s => {
  switch (s?.toUpperCase()) {
    case "DONE":
      return "#4CAF50";
    case "IN_PROGRESS":
      return "#2196F3";
    case "REVIEW":
      return "#FF9800";
    case "ON_HOLD":
      return "#9E9E9E";
    default:
      return "#BDBDBD";
  }
};
const statusLabel = s =>
  ({ DONE: "완료", IN_PROGRESS: "진행 중", REVIEW: "검토 중", ON_HOLD: "보류" })[
    s?.toUpperCase()
  ] ?? "계획";
const statusIcon = s => {
  switch (s?.toUpperCase()) {
    case "DONE":
      return "✅";
    case "IN_PROGRESS":
      return "🚧";
    case "REVIEW":
      return "🔍";
    case "ON_HOLD":
      return "⏸";
    default:
      return "🗂";
  }
};
