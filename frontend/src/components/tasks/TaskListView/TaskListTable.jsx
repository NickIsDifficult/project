// src/components/tasks/TaskListView/TaskListTable.jsx
import TaskListRow from "./TaskListRow";

const STATUS_LABELS = {
  TODO: "할 일",
  IN_PROGRESS: "진행 중",
  REVIEW: "검토 중",
  DONE: "완료",
};

/**
 * ✅ TaskListTable (전역 프로젝트/업무 통합 리스트뷰)
 * - 상단 요약바 / 필터바 / 정렬기능 포함
 * - 프로젝트 및 업무 트리형 구조를 렌더링
 */
export default function TaskListTable({
  filteredTasks,
  stats,
  assigneeOptions,
  filterStatus,
  filterAssignee,
  searchKeyword,
  sortBy,
  sortOrder,
  editingId,
  editForm,
  collapsedTasks,
  onTaskClick,
  setSearchKeyword,
  setFilterAssignee,
  handleSort,
  resetFilters,
  handleStatusFilter,
  handleStatusChange,
  handleDelete,
  startEdit,
  cancelEdit,
  saveEdit,
  toggleCollapse,
  setEditForm,
}) {
  const renderSortIcon = key => (sortBy === key ? (sortOrder === "asc" ? "▲" : "▼") : "⇅");

  return (
    <>
      {/* ------------------------------------------- */}
      {/* 📋 업무 리스트 테이블 */}
      {/* ------------------------------------------- */}
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
    </>
  );
}

/* ------------------------------------------- */
/* ✅ 스타일 (inline 유지) */
/* ------------------------------------------- */
const summaryBox = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  background: "#f8f9fa",
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: "8px 12px",
  marginBottom: 10,
  fontSize: 14,
};
const progressOuter = {
  flex: 1,
  height: 8,
  background: "#e0e0e0",
  borderRadius: 4,
  overflow: "hidden",
};
const progressInner = {
  height: "100%",
  background: "#4caf50",
  transition: "width 0.3s ease",
};
const filterBar = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginBottom: 10,
  background: "#fafafa",
  border: "1px solid #e0e0e0",
  borderRadius: 8,
  padding: "8px 12px",
};
const table = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 14,
  tableLayout: "fixed",
};
const thead = {
  background: "#f8f9fa",
  borderBottom: "1px solid #ddd",
};
const th = {
  padding: "10px 8px",
  textAlign: "left",
  fontWeight: 600,
  whiteSpace: "nowrap",
  cursor: "pointer",
};
const filterSelect = {
  border: "1px solid #ccc",
  borderRadius: 6,
  padding: "6px 10px",
  fontSize: 13,
};
const filterInput = {
  border: "1px solid #ccc",
  borderRadius: 6,
  padding: "6px 10px",
  minWidth: 160,
  fontSize: 13,
};
const noDataCell = {
  textAlign: "center",
  color: "#666",
  padding: "20px 0",
  fontSize: 14,
};
