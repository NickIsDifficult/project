// src/components/tasks/TaskKanbanView/TaskCard.jsx
import { Draggable } from "@hello-pangea/dnd";
import React from "react";

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
          }}
          onClick={onClick}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{task.title}</div>
          {task.assignee_name && (
            <div style={{ fontSize: 13, color: "#555" }}>👤 {task.assignee_name}</div>
          )}
          <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
            📅 {task.start_date || "?"} ~ {task.due_date || "?"}
          </div>
          {task.progress !== undefined && (
            <div style={progressBarOuter}>
              <div style={{ ...progressBarInner, width: `${task.progress}%` }} />
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

/* styles */
const cardStyle = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 8,
  boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
  padding: "8px 10px",
  marginBottom: 8,
  cursor: "pointer",
  userSelect: "none",
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
  background: "#4caf50",
  transition: "width 0.2s ease",
};
