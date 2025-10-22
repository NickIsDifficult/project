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

  // 🎨 헤더 셀 스타일
  const getHeaderStyle = key => ({
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px",
    textAlign: "left",
    userSelect: "none",
    color: sortBy === key ? "#007bff" : "#374151",
    background: "#f3f4f6",
    borderBottom: "1px solid #e5e7eb",
    transition: "background 0.2s",
  });

  // 🎨 테이블 컨테이너 스타일
  const containerStyle = {
    overflowX: "auto",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    background: "#fff",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  };

  // 🎨 테이블 스타일
  const tableStyle = {
    width: "100%",
    fontSize: "14px",
    borderCollapse: "collapse",
  };

  return (
    <div style={containerStyle}>
      <table style={tableStyle}>
        <colgroup>
          <col style={{ width: "38%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "15%" }} />
          <col style={{ width: "25%" }} />
          <col style={{ width: "10%" }} />
        </colgroup>

        {/* 🔹 테이블 헤더 */}
        <thead>
          <tr>
            <th
              style={getHeaderStyle("title")}
              onClick={() => handleSort?.("title")}
              onMouseEnter={e => (e.currentTarget.style.background = "#e5e7eb")}
              onMouseLeave={e => (e.currentTarget.style.background = "#f3f4f6")}
            >
              업무명 {renderSortIcon("title")}
            </th>
            <th
              style={getHeaderStyle("status")}
              onClick={() => handleSort?.("status")}
              onMouseEnter={e => (e.currentTarget.style.background = "#e5e7eb")}
              onMouseLeave={e => (e.currentTarget.style.background = "#f3f4f6")}
            >
              상태 {renderSortIcon("status")}
            </th>
            <th
              style={getHeaderStyle("assignee_name")}
              onClick={() => handleSort?.("assignee_name")}
              onMouseEnter={e => (e.currentTarget.style.background = "#e5e7eb")}
              onMouseLeave={e => (e.currentTarget.style.background = "#f3f4f6")}
            >
              담당자 {renderSortIcon("assignee_name")}
            </th>
            {/* ✅ 시작일과 마감일 묶음 */}
            <th
              style={getHeaderStyle("start_date")}
              onClick={() => handleSort?.("start_date")}
              onMouseEnter={e => (e.currentTarget.style.background = "#e5e7eb")}
              onMouseLeave={e => (e.currentTarget.style.background = "#f3f4f6")}
            >
              기간 (시작~마감) {renderSortIcon("start_date")}
            </th>
            {/* 마감일 컬럼 제거 — 기간 컬럼으로 통합 */}
          </tr>
        </thead>

        {/* 🔹 테이블 바디 */}
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
                <div
                  style={{
                    padding: "40px 0",
                    textAlign: "center",
                    color: "#6b7280",
                    fontStyle: "italic",
                    background: "#f9fafb",
                    borderBottomLeftRadius: "8px",
                    borderBottomRightRadius: "8px",
                  }}
                >
                  표시할 업무가 없습니다.
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
