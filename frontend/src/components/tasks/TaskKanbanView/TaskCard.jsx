import { Draggable } from "@hello-pangea/dnd";

/**
 * ✅ TaskCard (Kanban 업무 카드)
 * - Drag & Drop 가능
 * - 상태/담당자/기간/진행률 표시
 */
export default function TaskCard({ task, index, onClick }) {
  return (
    <Draggable draggableId={String(task.task_id)} index={index}>
      {provided => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...cardStyle,
            ...provided.draggableProps.style,
            borderLeft: `4px solid ${statusColor(task.status)}`,
          }}
          onClick={onClick}
        >
          {/* 제목 */}
          <div style={titleStyle}>{task.title}</div>

          {/* 담당자 */}
          {task.assignee_name && <div style={assigneeStyle}>👤 {task.assignee_name}</div>}

          {/* 기간 */}
          {(task.start_date || task.due_date) && (
            <div style={dateStyle}>
              📅 {task.start_date || "?"} ~ {task.due_date || "?"}
            </div>
          )}

          {/* 진행률 */}
          {task.progress !== undefined && (
            <div style={progressBarOuter}>
              <div
                style={{
                  ...progressBarInner,
                  width: `${task.progress}%`,
                  background: progressColor(task.progress),
                }}
              />
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

/* ---------------------------
 * 🎨 상태별 색상
 * --------------------------- */
const statusColor = status => {
  switch (status) {
    case "TODO":
      return "#b0bec5";
    case "IN_PROGRESS":
      return "#42a5f5";
    case "REVIEW":
      return "#ffb74d";
    case "DONE":
      return "#81c784";
    default:
      return "#e0e0e0";
  }
};

/* 진행률에 따른 색상 */
const progressColor = progress => {
  if (progress < 30) return "#ef5350";
  if (progress < 70) return "#ffb74d";
  return "#66bb6a";
};

/* ---------------------------
 * 🎨 스타일 정의
 * --------------------------- */
const cardStyle = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 8,
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  padding: "10px 12px",
  marginBottom: 8,
  cursor: "pointer",
  userSelect: "none",
  transition: "transform 0.1s ease, box-shadow 0.1s ease",
};

const titleStyle = {
  fontWeight: 600,
  fontSize: 14,
  marginBottom: 4,
  color: "#333",
};

const assigneeStyle = {
  fontSize: 13,
  color: "#555",
};

const dateStyle = {
  fontSize: 12,
  color: "#777",
  marginTop: 4,
};

const progressBarOuter = {
  marginTop: 6,
  height: 6,
  background: "#eee",
  borderRadius: 4,
  overflow: "hidden",
};

const progressBarInner = {
  height: "100%",
  transition: "width 0.25s ease, background 0.25s ease",
};
