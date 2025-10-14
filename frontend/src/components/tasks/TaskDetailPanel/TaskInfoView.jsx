// src/components/tasks/TaskDetailPanel/TaskInfoView.jsx
import Button from "../../common/Button";

const STATUS_LABELS = {
  TODO: "할 일",
  IN_PROGRESS: "진행 중",
  REVIEW: "검토 중",
  DONE: "완료",
};
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

      {/* ---------- 상태 ---------- */}
      <div style={{ marginBottom: 12 }}>
        <strong>상태:</strong>{" "}
        <select
          value={task.status}
          onChange={e => onStatusChange(e.target.value)}
          style={{ marginLeft: 8, padding: "4px 6px", borderRadius: 4 }}
        >
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* ---------- 진행률 ---------- */}
      <div style={{ marginBottom: 12 }}>
        <strong>진행률:</strong> <span style={{ marginLeft: 8 }}>{task.progress ?? 0}%</span>
        <input
          type="range"
          min={0}
          max={100}
          value={task.progress ?? 0}
          onChange={e => onProgressChange(Number(e.target.value))}
          style={{ width: "100%", marginLeft: 8 }}
        />
      </div>

      {/* ---------- 담당자 ---------- */}
      <div style={{ marginBottom: 12 }}>
        <strong>담당자:</strong> {task.assignee_name || "미지정"}
      </div>

      {/* ---------- 설명 ---------- */}
      <div style={{ marginBottom: 12 }}>
        <strong>설명:</strong>
        <p style={{ marginTop: 4, whiteSpace: "pre-line" }}>{task.description || "내용 없음"}</p>
      </div>

      {/* ---------- 버튼 ---------- */}
      <div style={{ display: "flex", gap: 8 }}>
        <Button variant="primary" onClick={onEdit}>
          ✏️ 수정
        </Button>
        <Button variant="secondary" onClick={() => onAddSubtask(task.task_id)}>
          ➕ 하위업무 추가
        </Button>
      </div>
    </>
  );
}
