// src/components/projects/ProjectListView/TaskListTable.jsx
import TaskListRow from "./TaskListRow";

export default function TaskListTable({
  filteredTasks,
  editingId,
  editForm,
  collapsedTasks,
  onTaskClick,
  handleSort,
  startEdit,
  cancelEdit,
  saveEdit,
  handleDelete,
  handleStatusChange,
  toggleCollapse,
  setEditForm,
  sortBy,
  sortOrder,
}) {
  // 🔽 정렬 아이콘 렌더러
  const renderSortIcon = key => {
    if (sortBy !== key) return "⇅";
    return sortOrder === "asc" ? "▲" : "▼";
  };

  // 🎨 정돈된 스타일 (밝은 테마용)
  const containerStyle = {
    overflowX: "auto",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    background: "#fff",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
  };

  const tableStyle = {
    width: "100%",
    fontSize: "13.5px",
    borderCollapse: "collapse",
    color: "#1f2937",
  };

  const thBase = {
    fontWeight: 600,
    fontSize: "13.5px",
    color: "#374151",
    background: "#f9fafb",
    borderBottom: "2px solid #e5e7eb",
    padding: "10px 14px",
    textAlign: "left",
    cursor: "pointer",
    userSelect: "none",
    transition: "background 0.2s ease",
  };

  const tdEmpty = {
    padding: "36px 0",
    textAlign: "center",
    color: "#9ca3af",
    fontStyle: "italic",
    background: "#f9fafb",
  };

  return (
    <div style={containerStyle}>
      <table style={tableStyle}>
        <colgroup>
          <col style={{ width: "38%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "22%" }} />
          <col style={{ width: "10%" }} />
        </colgroup>

        <thead>
          <tr>
            {[
              ["title", "업무명"],
              ["status", "상태"],
              ["assignee_name", "담당자"],
              ["start_date", "기간 (시작~마감)"],
            ].map(([key, label]) => (
              <th
                key={key}
                style={{
                  ...thBase,
                  color: sortBy === key ? "#2563eb" : "#374151",
                }}
                onClick={() => handleSort?.(key)}
                onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
                onMouseLeave={e => (e.currentTarget.style.background = "#f9fafb")}
              >
                {label} {renderSortIcon(key)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {filteredTasks.length > 0 ? (
            filteredTasks.map(t => (
              <TaskListRow
                key={`${t.isProject ? "project" : "task"}-${t.project_id}-${t.task_id ?? "root"}`}
                task={t}
                depth={0}
                editingId={editingId}
                editForm={editForm}
                setEditForm={setEditForm}
                onTaskClick={onTaskClick}
                onEditStart={startEdit}
                onEditCancel={cancelEdit}
                onEditSave={saveEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                collapsedTasks={collapsedTasks}
                toggleCollapse={toggleCollapse}
              />
            ))
          ) : (
            <tr>
              <td colSpan={5}>
                <div style={tdEmpty}>표시할 업무가 없습니다.</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
