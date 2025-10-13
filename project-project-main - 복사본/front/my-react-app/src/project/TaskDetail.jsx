import React from "react";

export default function TaskDetail({ task }) {
  return (
    <div
      style={{
        marginTop: "20px",
        padding: "15px",
        border: "1px solid #ddd",
        borderRadius: "6px",
        background: "#fafafa",
      }}
    >
      <h3>업무 상세</h3>
      <p>
        <strong>ID:</strong> {task.id}
      </p>
      <p>
        <strong>제목:</strong> {task.title}
      </p>
    </div>
  );
}
