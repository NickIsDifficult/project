// src/components/tasks/TaskListView/TaskListRow.jsx
import Button from "../../common/Button";

const STATUS_LABELS = {
  TODO: "할 일",
  IN_PROGRESS: "진행 중",
  REVIEW: "검토 중",
  DONE: "완료",
};

const STATUS_COLORS = {
  TODO: "#eeeeee",
  IN_PROGRESS: "#bbdefb",
  REVIEW: "#ffe0b2",
  DONE: "#c8e6c9",
};

export default function TaskListRow({
  task,
  depth,
  editingId,
  editForm,
  setEditForm,
  onTaskClick,
  onEditStart,
  onEditCancel,
  onEditSave,
  onDelete,
  onStatusChange,
  collapsedTasks,
  toggleCollapse,
}) {
  const paddingLeft = depth * 20;
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const isCollapsed = collapsedTasks.has(task.task_id);

  return (
    <>
      <tr style={rowStyle(editingId === task.task_id)}>
        {/* ---------------------------- */}
        {/* ✅ 업무명 (계층 + 제목 + 설명) */}
        {/* ---------------------------- */}
        <td style={{ ...td, paddingLeft }}>
          {editingId === task.task_id ? (
            <>
              <input
                type="text"
                value={editForm.title}
                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                style={inputStyle}
              />
              <textarea
                value={editForm.description}
                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                style={{ ...inputStyle, minHeight: 60, marginTop: 4 }}
              />
            </>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {hasSubtasks && (
                  <button
                    onClick={() => toggleCollapse(task.task_id)}
                    style={collapseBtn}
                    title={isCollapsed ? "펼치기" : "접기"}
                  >
                    {isCollapsed ? "▶" : "▼"}
                  </button>
                )}
                <div style={{ fontWeight: 500 }}>{task.title}</div>
              </div>
              {task.description && <div style={descStyle}>{task.description}</div>}
            </>
          )}
        </td>

        {/* ---------------------------- */}
        {/* ✅ 상태 변경 */}
        {/* ---------------------------- */}
        <td style={td}>
          <select
            value={task.status}
            onChange={e => onStatusChange(task.task_id, e.target.value)}
            style={{
              ...selectStyle,
              background: STATUS_COLORS[task.status],
            }}
          >
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </td>

        {/* ---------------------------- */}
        {/* ✅ 담당자 */}
        {/* ---------------------------- */}
        <td style={td}>
          {task.assignee_name ? (
            <span>{task.assignee_name}</span>
          ) : (
            <span style={{ color: "#999" }}>— 미지정 —</span>
          )}
        </td>

        {/* ---------------------------- */}
        {/* ✅ 기간 */}
        {/* ---------------------------- */}
        <td style={td}>
          {task.start_date && task.due_date ? (
            `${task.start_date} ~ ${task.due_date}`
          ) : (
            <span style={{ color: "#ff7043", fontStyle: "italic" }}>📅 미지정</span>
          )}
        </td>

        {/* ---------------------------- */}
        {/* ✅ 액션 버튼 영역 */}
        {/* ---------------------------- */}
        <td style={{ ...td, textAlign: "center", whiteSpace: "nowrap" }}>
          {editingId === task.task_id ? (
            <>
              <Button variant="success" onClick={() => onEditSave(task.task_id)}>
                저장
              </Button>
              <Button variant="secondary" onClick={onEditCancel}>
                취소
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onTaskClick(task)}>
                🔍 상세
              </Button>
              <Button variant="outline" onClick={() => onEditStart(task)}>
                ✏️ 수정
              </Button>
              <Button variant="outline" onClick={() => onDelete(task.task_id)}>
                🗑️ 삭제
              </Button>
            </>
          )}
        </td>
      </tr>

      {/* ---------------------------- */}
      {/* ✅ 하위 업무 (재귀 렌더링) */}
      {/* ---------------------------- */}
      {hasSubtasks &&
        !isCollapsed &&
        task.subtasks.map(sub => (
          <TaskListRow
            key={sub.task_id}
            task={sub}
            depth={depth + 1}
            editingId={editingId}
            editForm={editForm}
            setEditForm={setEditForm}
            onTaskClick={onTaskClick}
            onEditStart={onEditStart}
            onEditCancel={onEditCancel}
            onEditSave={onEditSave}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
            collapsedTasks={collapsedTasks}
            toggleCollapse={toggleCollapse}
          />
        ))}
    </>
  );
}

/* ---------------------------- */
/* ✅ 스타일 (inline 유지) */
/* ---------------------------- */
const rowStyle = editing => ({
  borderBottom: "1px solid #eee",
  background: editing ? "#fffbe6" : "#fff",
  transition: "background 0.2s",
});
const td = {
  padding: "8px",
  verticalAlign: "top",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
const inputStyle = {
  width: "100%",
  border: "1px solid #ccc",
  borderRadius: 6,
  padding: "6px 8px",
  fontSize: 13,
  resize: "vertical",
};
const selectStyle = {
  border: "1px solid #ccc",
  borderRadius: 6,
  padding: "4px 6px",
  fontSize: 13,
};
const collapseBtn = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontSize: 12,
  lineHeight: 1,
  padding: 2,
  color: "#555",
};
const descStyle = {
  fontSize: 13,
  color: "#666",
  marginTop: 2,
  whiteSpace: "normal",
  lineHeight: 1.4,
};
