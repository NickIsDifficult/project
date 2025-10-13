import React from "react";

export default function UndatedTaskList({ tasks = [], onTaskClick }) {
  if (tasks.length === 0)
    return <div style={{ fontSize: 13, color: "#888" }}>모든 업무가 날짜를 가지고 있습니다 🎉</div>;

  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {tasks.map(t => (
        <li
          key={t.task_id}
          onClick={() => onTaskClick?.(t)}
          style={{
            padding: "6px 10px",
            border: "1px solid #eee",
            borderRadius: 6,
            marginBottom: 4,
            cursor: "pointer",
            background: "#fafafa",
            transition: "background 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#f5f5f5")}
          onMouseLeave={e => (e.currentTarget.style.background = "#fafafa")}
        >
          <span style={{ fontWeight: 500 }}>{t.title}</span>
          {t.assignee_name && <span style={{ color: "#777" }}> ({t.assignee_name})</span>}
          <span
            style={{
              background: "#ffecb3",
              color: "#555",
              fontSize: 12,
              padding: "1px 5px",
              borderRadius: 4,
              marginLeft: 6,
            }}
          >
            ⏳ 날짜 미지정
          </span>
        </li>
      ))}
    </ul>
  );
}
