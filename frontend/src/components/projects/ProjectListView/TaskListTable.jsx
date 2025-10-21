// src/components/projects/ProjectListView/TaskListTable.jsx
import TaskListRow from "./TaskListRow";

/**
 * ✅ TaskListTable (순수 렌더링 전용)
 * - 상태, 담당자, 기간, 액션만 렌더링
 */
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
  const renderSortIcon = key => (sortBy === key ? (sortOrder === "asc" ? "▲" : "▼") : "⇅");

  return (
    <table style={table}>
      <colgroup>
        <col style={{ width: "38%" }} />
        <col style={{ width: "12%" }} />
        <col style={{ width: "15%" }} />
        <col style={{ width: "20%" }} />
        <col style={{ width: "15%" }} />
      </colgroup>

      <thead>
        <tr style={thead}>
          <th style={th} onClick={() => handleSort("title")}>
            업무명 {renderSortIcon("title")}
          </th>
          <th style={th} onClick={() => handleSort("status")}>
            상태 {renderSortIcon("status")}
          </th>
          <th style={th} onClick={() => handleSort("assignee_name")}>
            담당자 {renderSortIcon("assignee_name")}
          </th>
          <th style={th} onClick={() => handleSort("start_date")}>
            시작일 {renderSortIcon("start_date")}
          </th>
          <th style={th} onClick={() => handleSort("due_date")}>
            마감일 {renderSortIcon("due_date")}
          </th>
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
            <td colSpan={5} style={noDataCell}>
              표시할 업무가 없습니다.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

const table = { width: "100%", borderCollapse: "collapse", fontSize: 14 };
const thead = { background: "#f8f9fa", borderBottom: "1px solid #ddd" };
const th = { padding: "10px 8px", textAlign: "left", fontWeight: 600, cursor: "pointer" };
const noDataCell = { textAlign: "center", color: "#666", padding: "20px 0", fontSize: 14 };
