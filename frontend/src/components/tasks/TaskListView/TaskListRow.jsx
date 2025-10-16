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

/**
 * ✅ TaskListRow (프로젝트/업무 통합 재귀형)
 * - project → main task → subtask → detailtask 구조
 * - project도 트리 구조의 루트 노드로 포함됨
 */
export default function TaskListRow({
  task,
  depth = 0,
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
  const isProject = task.isProject; // ✅ 프로젝트 여부 플래그

  return (
    <>
      <tr
        style={{
          ...rowStyle(editingId === task.task_id),
          background: isProject ? "#f5f6f8" : rowStyle().background,
          fontWeight: isProject ? 700 : 400,
        }}
      >
        {/* ---------------------------- */}
        {/* ✅ 업무명 / 프로젝트명 */}
        {/* ---------------------------- */}
        <td style={{ ...td, paddingLeft }}>
          {editingId === task.task_id && !isProject ? (
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
                <div
                  style={{
                    fontWeight: isProject ? 700 : 500,
                    color: isProject ? "#222" : "#333",
                  }}
                >
                  {isProject ? `🏗 ${task.title}` : task.title}
                </div>
              </div>
              {!isProject && task.description && <div style={descStyle}>{task.description}</div>}
            </>
          )}
        </td>

        {/* ---------------------------- */}
        {/* ✅ 상태 / 담당자 / 기간 / 액션버튼 (업무 전용) */}
        {/* ---------------------------- */}
        {!isProject ? (
          <>
            <td style={td}>
              <select
                value={task.status}
                onChange={e => onStatusChange(task.task_id, e.target.value, task.project_id)}
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

            <td style={td}>
              {task.assignee_name ? (
                <span>{task.assignee_name}</span>
              ) : (
                <span style={{ color: "#999" }}>— 미지정 —</span>
              )}
            </td>

            <td style={td}>
              {task.start_date && task.due_date ? (
                `${task.start_date} ~ ${task.due_date}`
              ) : (
                <span style={{ color: "#ff7043", fontStyle: "italic" }}>📅 미지정</span>
              )}
            </td>

            <td style={{ ...td, textAlign: "center", whiteSpace: "nowrap" }}>
              {editingId === task.task_id ? (
                <>
                  <Button
                    variant="success"
                    onClick={() => onEditSave(task.task_id, task.project_id)}
                  >
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
                  <Button variant="outline" onClick={() => onDelete(task.task_id, task.project_id)}>
                    🗑️ 삭제
                  </Button>
                </>
              )}
            </td>
          </>
        ) : (
          <td colSpan={4} style={{ textAlign: "center", color: "#777" }}>
            <em>프로젝트</em>
          </td>
        )}
      </tr>

      {/* ---------------------------- */}
      {/* ✅ 하위 업무 재귀 렌더링 (프로젝트 포함) */}
      {/* ---------------------------- */}
      {hasSubtasks &&
        !isCollapsed &&
        task.subtasks.map(sub => (
          <TaskListRow
            key={`${task.project_id || "proj"}-${sub.task_id}`}
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
