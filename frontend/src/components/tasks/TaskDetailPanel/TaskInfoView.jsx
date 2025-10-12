// src/components/tasks/TaskDetailPanel/TaskInfoView.jsx
import React from "react";
import { Button } from "../../common/Button";

export default function TaskInfoView({
  task,
  onStatusChange,
  onProgressChange,
  onEdit,
  onAddSubtask,
}) {
  return (
    <>
      <p style={{ marginBottom: 8, color: "#666" }}>{task.description}</p>

      <div style={{ marginBottom: 8 }}>
        <strong>상태: </strong>
        <select
          value={task.status}
          onChange={e => onStatusChange(e.target.value)}
          style={{ marginLeft: 8, padding: "4px 6px", borderRadius: 4 }}
        >
          <option value="TODO">할 일</option>
          <option value="IN_PROGRESS">진행 중</option>
          <option value="REVIEW">검토 중</option>
          <option value="DONE">완료</option>
        </select>
      </div>

      <div style={{ margin: "12px 0" }}>
        <label style={{ fontWeight: "bold" }}>진행률: {task.progress ?? 0}%</label>
        <input
          type="range"
          min="0"
          max="100"
          value={task.progress ?? 0}
          onChange={e => onProgressChange(parseInt(e.target.value))}
          style={{ width: "100%" }}
        />
      </div>

      <p>
        <strong>담당자:</strong> {task.assignee_name || "미지정"}
        <br />
        <strong>기간:</strong> {task.start_date} ~ {task.due_date}
      </p>

      <Button variant="outline" onClick={onEdit}>
        ✏️ 수정
      </Button>
      <Button
        variant="success"
        onClick={() => onAddSubtask(task.task_id)}
        style={{ marginLeft: 10 }}
      >
        ➕ 하위 업무 추가
      </Button>
    </>
  );
}
