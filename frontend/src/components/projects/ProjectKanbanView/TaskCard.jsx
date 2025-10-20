// src/components/projects/ProjectKanbanView/TaskCard.jsx
import { Draggable } from "@hello-pangea/dnd";
import { STATUS_COLORS } from "../constants/statusMaps";

export default function TaskCard({ task, index, onClick, projectColor }) {
  const color = STATUS_COLORS[task.status?.toUpperCase()] ?? "#EEE";

  return (
    <Draggable draggableId={`task-${task.task_id}`} index={index} type="task">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={e => {
            e.stopPropagation();
            onClick?.(task);
          }}
          style={{
            ...styles.card,
            borderLeft: `4px solid ${projectColor ?? "#bbb"}`,
            background: "#fff",
            boxShadow: snapshot.isDragging ? "0 3px 6px rgba(0,0,0,0.15)" : "none",
            transform: snapshot.isDragging ? "scale(1.02)" : "none",
            ...provided.draggableProps.style,
          }}
        >
          <div style={styles.projectLabel}>
            <span style={{ color: projectColor, fontWeight: 600 }}>{task.project_name}</span>
          </div>
          <div style={styles.titleRow}>
            <span style={styles.title}>🧩 {task.title}</span>
            <span style={styles.statusTag(task.status)}>
              {statusIcon(task.status)} {statusLabel(task.status)}
            </span>
          </div>
          <div style={styles.info}>
            👤 {task.assignees?.length ? task.assignees.map(a => a.name).join(", ") : "미지정"}
          </div>
        </div>
      )}
    </Draggable>
  );
}

/* 🎨 스타일 */
const styles = {
  card: {
    borderRadius: 8,
    padding: "8px 10px",
    margin: "6px 0 6px 16px",
    cursor: "grab",
    transition: "all 0.25s ease",
  },
  projectLabel: {
    fontSize: 11,
    color: "#888",
    marginBottom: 3,
    fontStyle: "italic",
  },
  titleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
  },
  title: {
    fontSize: 13,
    fontWeight: 600,
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  info: {
    fontSize: 12,
    color: "#444",
  },
  statusTag: s => ({
    background: `${statusColor(s)}20`,
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
      return "#9E9E9E";
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
