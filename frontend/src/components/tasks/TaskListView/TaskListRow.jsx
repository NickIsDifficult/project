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
  // ---------------------------------------------
  // ✅ 고유 ID 계산 (프로젝트 / 업무 모두 지원)
  // ---------------------------------------------
  const effectiveId = task.isProject ? `proj-${task.project_id}` : `task-${task.task_id}`;
  const numericId = task.isProject ? task.project_id : task.task_id;
  const isProject = !!task.isProject;
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const isCollapsed = collapsedTasks.has(effectiveId);
  const paddingLeft = depth * 20;

  return (
    <>
      <tr
        style={{
          ...rowStyle(editingId === effectiveId),
          background: isProject ? "#f5f6f8" : rowStyle().background,
          fontWeight: isProject ? 700 : 400,
        }}
      >
        {/* ---------------------------- */}
        {/* ✅ 업무명 / 프로젝트명 */}
        {/* ---------------------------- */}
        <td style={{ ...td, paddingLeft }}>
          {editingId === effectiveId ? (
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
                    onClick={() => toggleCollapse(effectiveId)}
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
              {task.description && <div style={descStyle}>{task.description}</div>}
            </>
          )}
        </td>

        {/* ---------------------------- */}
        {/* ✅ 상태 */}
        {/* ---------------------------- */}
        <td style={td}>
          <select
            value={task.status || "TODO"}
            onChange={e => onStatusChange(task, e.target.value)}
            style={{
              ...selectStyle,
              background: STATUS_COLORS[task.status || "TODO"],
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
        {/* ✅ 액션버튼 */}
        {/* ---------------------------- */}
        <td style={{ ...td, textAlign: "center", whiteSpace: "nowrap" }}>
          {editingId === effectiveId ? (
            <>
              <Button variant="success" onClick={() => onEditSave(numericId, task.project_id)}>
                저장
              </Button>
              <Button variant="secondary" onClick={onEditCancel}>
                취소
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() =>
                  onTaskClick({
                    ...task,
                    isProject,
                    project_id: task.project_id,
                    task_id: isProject ? null : task.task_id,
                  })
                }
              >
                🔍 상세
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  onEditStart({
                    ...task,
                    task_id: effectiveId,
                    isProject,
                  })
                }
              >
                ✏️ 수정
              </Button>
              <Button variant="outline" onClick={() => onDelete(effectiveId, task.project_id)}>
                🗑️ 삭제
              </Button>
            </>
          )}
        </td>
      </tr>

      {/* ---------------------------- */}
      {/* ✅ 하위 업무 재귀 렌더링 */}
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
