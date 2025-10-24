// src/components/projects/ProjectListView/TaskListRow.jsx
import { ChevronDown, ChevronRight, Search, Trash2 } from "lucide-react";
import Button from "../../common/Button";
import { STATUS_COLORS, STATUS_LABELS } from "../../projects/constants/statusMaps";

export default function TaskListRow({
  task,
  depth = 0,
  editingId,
  editForm,
  setEditForm,
  onTaskClick,
  onEditCancel,
  onEditSave,
  onDelete,
  onStatusChange,
  collapsedTasks,
  toggleCollapse,
}) {
  const effectiveId = task.isProject ? `proj-${task.project_id}` : `task-${task.task_id}`;
  const numericId = task.isProject ? task.project_id : task.task_id;
  const isProject = !!task.isProject;
  const hasSubtasks = Array.isArray(task.subtasks) && task.subtasks.length > 0;
  const isCollapsed = collapsedTasks?.has?.(effectiveId) ?? false;

  // ✅ 색상 및 배경 강조
  const statusColor = STATUS_COLORS[task.status || "PLANNED"] || "#ffffff";
  const backgroundTint = `${statusColor}20`;

  // ✅ 안전한 담당자 이름 (useTaskList에서 전처리됨)
  const assigneeNames = task.assigneeNames || [];

  return (
    <>
      <tr
        style={{
          borderBottom: "1px solid #e5e7eb",
          background:
            editingId === effectiveId ? "#fff9c4" : isProject ? "#f9fafb" : backgroundTint,
          transition: "background 0.2s ease",
          cursor: "default",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
        onMouseLeave={e => {
          e.currentTarget.style.background =
            editingId === effectiveId ? "#fff9c4" : isProject ? "#f9fafb" : backgroundTint;
        }}
      >
        {/* ---------------------------- */}
        {/* 제목 / 설명 */}
        {/* ---------------------------- */}
        <td
          style={{
            padding: "8px 12px",
            verticalAlign: "top",
            paddingLeft: `${depth * 20}px`,
          }}
        >
          {editingId === effectiveId ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <input
                type="text"
                value={editForm.title}
                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="제목을 입력하세요"
                style={inputStyle}
              />
              <textarea
                value={editForm.description}
                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="설명을 입력하세요"
                rows={2}
                style={{ ...inputStyle, resize: "vertical", minHeight: "48px" }}
              />
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {hasSubtasks && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      toggleCollapse(effectiveId);
                    }}
                    title={isCollapsed ? "펼치기" : "접기"}
                    style={collapseBtnStyle}
                    onMouseEnter={e => (e.currentTarget.style.color = "#007bff")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#6b7280")}
                  >
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  </button>
                )}

                <span
                  style={{
                    fontWeight: isProject ? 700 : 500,
                    color: isProject ? "#1f2937" : "#374151",
                    fontSize: "14px",
                  }}
                >
                  {isProject
                    ? `🏗 ${task.project_name ?? task.title}`
                    : task.title || "(제목 없음)"}
                </span>
              </div>

              {/* ✅ 설명 항상 표시 (빈 문자열도 처리) */}
              <p
                style={{
                  ...descStyle,
                  marginTop: "4px",
                  marginLeft: hasSubtasks ? "22px" : "0px", // 접기 버튼 여백 보정
                  whiteSpace: "pre-line", // 줄바꿈(\n) 반영
                  display: task.description?.trim() ? "block" : "none", // 공백만 있는 경우 숨김
                }}
              >
                {task.description}
              </p>
            </>
          )}
        </td>

        {/* ---------------------------- */}
        {/* 상태 */}
        {/* ---------------------------- */}
        <td style={{ padding: "4px 8px" }}>
          <select
            value={task.status || "PLANNED"}
            onChange={e => onStatusChange(task, e.target.value)}
            style={{
              fontSize: "14px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              padding: "4px 6px",
              background: STATUS_COLORS[task.status || "PLANNED"],
              cursor: "pointer",
              outline: "none",
            }}
            onFocus={e => (e.target.style.border = "1px solid #007bff")}
            onBlur={e => (e.target.style.border = "1px solid #ccc")}
          >
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </td>

        {/* ---------------------------- */}
        {/* 담당자 */}
        {/* ---------------------------- */}
        <td style={{ padding: "4px 8px", fontSize: "14px", color: "#374151" }}>
          {(() => {
            // ✅ 1️⃣ 프로젝트 행 (isProject === true)
            if (isProject) {
              // ✅ 소유자 ID 및 이름 확인
              const ownerId = task.owner_emp_id ?? null;
              const ownerName =
                task.owner_name || // 백엔드 스키마에 추가된 owner_name
                task.manager_name || // 혹시 기존 필드가 있다면
                null;

              return ownerName ? (
                <span style={{ color: "#1e40af", fontWeight: 500 }}>{ownerName}</span>
              ) : ownerId ? (
                // owner_emp_id는 있지만 이름 필드가 없을 때 (백엔드 미수정 상태)
                <span style={{ color: "#6b7280" }}>ID: {ownerId}</span>
              ) : (
                <span style={{ color: "#9ca3af", fontStyle: "italic" }}>— 미지정 —</span>
              );
            }

            // ✅ 2️⃣ 업무 행 (task)
            const assignees = task.assignees || [];
            return assignees.length > 0 ? (
              <span>{assignees.map(a => a.name).join(", ")}</span>
            ) : (
              <span style={{ color: "#9ca3af", fontStyle: "italic" }}>— 미지정 —</span>
            );
          })()}
        </td>

        {/* ---------------------------- */}
        {/* 기간 (시작~마감) */}
        {/* ---------------------------- */}
        <td style={{ padding: "4px 8px", fontSize: "14px", color: "#374151" }}>
          {(() => {
            // ✅ 1️⃣ 프로젝트 (isProject === true)
            if (isProject) {
              const start = task.start_date ?? null;
              const end = task.end_date ?? task.due_date ?? null; // end_date 우선, 없으면 due_date
              if (start && end) return `${start} ~ ${end}`;
              return <span style={dateMissingStyle}>📅 미지정</span>;
            }

            // ✅ 2️⃣ 업무 또는 하위 업무
            const start = task.start_date ?? null;
            const due = task.due_date ?? task.end_date ?? null; // due_date 우선, 없으면 end_date
            if (start && due) return `${start} ~ ${due}`;
            return <span style={dateMissingStyle}>📅 미지정</span>;
          })()}
        </td>

        {/* ---------------------------- */}
        {/* 액션 버튼 */}
        {/* ---------------------------- */}
        <td style={{ padding: "4px 8px", textAlign: "center", whiteSpace: "nowrap" }}>
          {editingId === effectiveId ? (
            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
              <Button onClick={() => onEditSave(numericId, task.project_id)}>저장</Button>
              <Button variant="secondary" onClick={onEditCancel}>
                취소
              </Button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
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
                style={iconBtn}
              >
                <Search size={14} /> 상세
              </Button>

              <Button
                variant="outline"
                onClick={() => onDelete(effectiveId, task.project_id)}
                style={{ ...iconBtn, color: "#dc2626", borderColor: "#e5e7eb" }}
              >
                <Trash2 size={14} /> 삭제
              </Button>
            </div>
          )}
        </td>
      </tr>

      {/* ---------------------------- */}
      {/* 재귀 렌더링 */}
      {/* ---------------------------- */}
      {hasSubtasks &&
        !isCollapsed &&
        task.subtasks.map(sub => (
          <TaskListRow
            key={`${task.project_id}-${sub.task_id}`}
            task={sub}
            depth={depth + 1}
            editingId={editingId}
            editForm={editForm}
            setEditForm={setEditForm}
            onTaskClick={onTaskClick}
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

/* -----------------------------------
 * 🎨 스타일 세트
 * ----------------------------------- */
const inputStyle = {
  width: "100%",
  border: "1px solid #ccc",
  borderRadius: "6px",
  padding: "6px 8px",
  fontSize: "14px",
  outline: "none",
  transition: "border 0.2s",
};

const selectStyle = {
  fontSize: "14px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  padding: "4px 6px",
  cursor: "pointer",
  outline: "none",
};

const descStyle = {
  fontSize: "12px",
  color: "#6b7280",
  marginTop: "4px",
  whiteSpace: "normal",
  lineHeight: 1.4,
};

const collapseBtnStyle = {
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
  color: "#6b7280",
  transition: "color 0.2s",
};

const iconBtn = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
  fontSize: "13px",
};

const dateMissingStyle = {
  color: "#f97316",
  fontStyle: "italic",
  display: "flex",
  alignItems: "center",
  gap: "4px",
};
