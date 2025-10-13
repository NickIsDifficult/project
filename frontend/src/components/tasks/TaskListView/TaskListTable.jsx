// src/components/tasks/TaskListView/TaskListTable.jsx
import React from "react";
import { Button } from "../../common/ButtonProject";
import TaskListRow from "./TaskListRow";

const STATUS_LABELS = {
  TODO: "할 일",
  IN_PROGRESS: "진행 중",
  REVIEW: "검토 중",
  DONE: "완료",
};

export default function TaskListTable({
  // 데이터
  filteredTasks,
  stats,
  assigneeOptions,

  // 입력/상태
  filterStatus,
  filterAssignee,
  searchKeyword,
  sortBy,
  sortOrder,
  editingId,
  editForm,
  collapsedTasks,

  // 콜백
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
      {/* --------------------------- */}
      {/* ✅ 상태 요약 바 */}
      {/* --------------------------- */}
      <div style={summaryBox}>
        <div>📋 전체 {stats.total}건</div>
        {Object.keys(STATUS_LABELS).map(key => (
          <div
            key={key}
            onClick={() => handleStatusFilter(key)}
            style={{
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: 6,
              background: filterStatus === key ? "#dbeafe" : "transparent",
              border: filterStatus === key ? "1px solid #60a5fa" : "1px solid transparent",
              transition: "background 0.2s ease, border 0.2s ease",
            }}
          >
            {STATUS_LABELS[key]} {stats[key]}
          </div>
        ))}
        <div style={{ marginLeft: "auto", fontWeight: 600 }}>✅ 완료율 {stats.doneRatio}%</div>
        <div style={progressOuter}>
          <div style={{ ...progressInner, width: `${stats.doneRatio}%` }} />
        </div>
      </div>

      {/* --------------------------- */}
      {/* ✅ 필터 바 */}
      {/* --------------------------- */}
      <div style={filterBar}>
        <select
          value={filterAssignee}
          onChange={e => setFilterAssignee(e.target.value)}
          style={filterSelect}
        >
          {assigneeOptions.map(a => (
            <option key={a} value={a}>
              {a === "ALL" ? "전체 담당자" : a}
            </option>
          ))}
        </select>

        <input
          placeholder="업무 제목 검색..."
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
          style={filterInput}
        />

        <Button variant="outline" onClick={resetFilters}>
          🔄 초기화
        </Button>
      </div>

      {/* --------------------------- */}
      {/* ✅ 업무 리스트 테이블 */}
      {/* --------------------------- */}
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
                key={t.task_id}
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

/* --------------------------- */
/* ✅ 스타일 (기존 inline 유지) */
/* --------------------------- */
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
