// src/components/tasks/TaskKanbanView/TaskColumn.jsx
import React from "react";
import TaskCard from "./TaskCard";

export default function TaskColumn({ label, tasks, onTaskClick }) {
  return (
    <div style={colWrapper}>
      <h3 style={colHeader}>{label}</h3>
      <div style={colBody}>
        {tasks.map((task, index) => (
          <TaskCard
            key={task.task_id}
            task={task}
            index={index}
            onClick={() => onTaskClick(task)}
          />
        ))}
      </div>
    </div>
  );
}

/* styles */
const colWrapper = {
  minWidth: 260,
  background: "#f8f9fa",
  borderRadius: 8,
  display: "flex",
  flexDirection: "column",
  height: "calc(100vh - 200px)",
  padding: 8,
};

const colHeader = {
  fontWeight: "bold",
  fontSize: 16,
  margin: "4px 0 8px 4px",
};

const colBody = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  // ❌ overflow 제거 — nested scroll 방지
};
