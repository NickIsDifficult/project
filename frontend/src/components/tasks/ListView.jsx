import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { deleteTask, updateTask, updateTaskStatus } from "../../services/api/task";
import { Button } from "../common/Button";
import { Loader } from "../common/Loader";

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

export default function ListView({
  projectId,
  tasks: initialTasks = [],
  onTasksChange,
  onTaskClick,
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", description: "" });
  const [collapsedTasks, setCollapsedTasks] = useState(new Set());

  // ✅ 필터 & 정렬 상태
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterAssignee, setFilterAssignee] = useState("ALL");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [sortBy, setSortBy] = useState("start_date");
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => setTasks(initialTasks), [initialTasks]);

  // ✅ 담당자 목록
  const assigneeOptions = useMemo(() => {
    const set = new Set();
    const walk = (list) => {
      list.forEach((t) => {
        if (t.assignee_name) set.add(t.assignee_name);
        if (t.subtasks?.length) walk(t.subtasks);
      });
    };
    walk(initialTasks);
    return ["ALL", ...Array.from(set)];
  }, [initialTasks]);

  // ✅ 필터 + 정렬
  const filteredTasks = useMemo(() => {
    const match = (t) => {
      const status = t.status?.trim()?.toUpperCase?.() || "TODO";
      const statusOk = filterStatus === "ALL" || status === filterStatus;
      const assigneeOk = filterAssignee === "ALL" || t.assignee_name === filterAssignee;
      const keywordOk =
        !searchKeyword || t.title.toLowerCase().includes(searchKeyword.toLowerCase());
      return statusOk && assigneeOk && keywordOk;
    };

    const walk = (list) =>
      list
        .map((t) => ({ ...t, subtasks: t.subtasks ? walk(t.subtasks) : [] }))
        .filter((t) => match(t) || t.subtasks?.length > 0);

    const filtered = walk(tasks);

    const sorted = filtered.sort((a, b) => {
      const valA = a[sortBy] ?? "";
      const valB = b[sortBy] ?? "";
      if (sortBy === "status") {
        const order = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
        return (order.indexOf(valA) - order.indexOf(valB)) * (sortOrder === "asc" ? 1 : -1);
      } else if (sortBy.includes("date")) {
        const dateA = valA ? new Date(valA) : new Date(0);
        const dateB = valB ? new Date(valB) : new Date(0);
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else {
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
    });

    return sorted;
  }, [tasks, filterStatus, filterAssignee, searchKeyword, sortBy, sortOrder]);

  // ✅ 상태 통계
  const stats = useMemo(() => {
    const flat = [];
    const flatten = (list) => {
      list.forEach((t) => {
        flat.push(t);
        if (t.subtasks?.length) flatten(t.subtasks);
      });
    };
    flatten(tasks);
    const total = flat.length;
    const counts = { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, DONE: 0 };
    flat.forEach((t) => (counts[t.status] = (counts[t.status] || 0) + 1));
    const doneRatio = total ? ((counts.DONE / total) * 100).toFixed(1) : 0;
    return { total, ...counts, doneRatio };
  }, [tasks]);

  // ✅ 필터 상태 변경
  const handleStatusFilter = (key) => {
    setFilterStatus((prev) => (prev === key ? "ALL" : key));
  };

  // ✅ 상태 변경
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(projectId, taskId, newStatus);
      toast.success(`상태가 '${STATUS_LABELS[newStatus]}'로 변경되었습니다.`);
      await onTasksChange();
    } catch {
      toast.error("상태 변경 실패");
    }
  };

  // ✅ 삭제
  const handleDelete = async (taskId) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await deleteTask(projectId, taskId);
      toast.success("업무가 삭제되었습니다.");
      await onTasksChange();
    } catch {
      toast.error("삭제 실패");
    }
  };

  // ✅ 수정
  const startEdit = (task) => {
    setEditingId(task.task_id);
    setEditForm({ title: task.title, description: task.description || "" });
  };
  const cancelEdit = () => setEditingId(null);
  const saveEdit = async (taskId) => {
    if (!editForm.title.trim()) return toast.error("제목을 입력하세요.");
    try {
      setLoading(true);
      await updateTask(projectId, taskId, editForm);
      toast.success("업무가 수정되었습니다.");
      setEditingId(null);
      await onTasksChange();
    } catch {
      toast.error("수정 실패");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 접기/펼치기
  const toggleCollapse = (taskId) => {
    setCollapsedTasks((prev) => {
      const next = new Set(prev);
      next.has(taskId) ? next.delete(taskId) : next.add(taskId);
      return next;
    });
  };

  return (
    <div style={{ padding: 8 }}>
      {loading && <Loader text="처리 중..." />}

      {/* ✅ 상태별 요약 바 */}
      <div style={summaryBox}>
        <div>📋 전체 {stats.total}건</div>
        {Object.keys(STATUS_LABELS).map((key) => (
          <div
            key={key}
            onClick={() => handleStatusFilter(key)}
            style={{
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: 6,
              background: filterStatus === key ? "#dbeafe" : "transparent",
              border: filterStatus === key ? "1px solid #60a5fa" : "1px solid transparent",
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

      {/* ✅ 필터 바 */}
      <div style={filterBar}>
        <select
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
          style={filterSelect}
        >
          {assigneeOptions.map((a) => (
            <option key={a} value={a}>
              {a === "ALL" ? "전체 담당자" : a}
            </option>
          ))}
        </select>

        <input
          placeholder="업무 제목 검색..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          style={filterInput}
        />

        <Button
          variant="outline"
          onClick={() => {
            setFilterStatus("ALL");
            setFilterAssignee("ALL");
            setSearchKeyword("");
          }}
        >
          🔄 초기화
        </Button>
      </div>

      {/* ✅ 리스트 테이블 */}
      <table style={table}>
        <colgroup>
          <col style={{ width: "40%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "15%" }} />
          <col style={{ width: "15%" }} />
        </colgroup>

        <thead>
          <tr style={thead}>
            <th style={th}>업무명</th>
            <th style={th}>상태</th>
            <th style={th}>담당자</th>
            <th style={th}>기간</th>
            <th style={th}>작업</th>
          </tr>
        </thead>

        <tbody>
          {filteredTasks.map((t) => (
            <TaskRow
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
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ✅ 하위업무 렌더링 */
function TaskRow({
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
        {/* 업무명 */}
        <td style={{ ...td, paddingLeft }}>
          {editingId === task.task_id ? (
            <>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                style={inputStyle}
              />
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                style={{ ...inputStyle, minHeight: 60, marginTop: 4 }}
              />
            </>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {hasSubtasks && (
                  <button onClick={() => toggleCollapse(task.task_id)} style={collapseBtn}>
                    {isCollapsed ? "▶" : "▼"}
                  </button>
                )}
                <div style={{ fontWeight: 500 }}>{task.title}</div>
              </div>
              {task.description && <div style={descStyle}>{task.description}</div>}
            </>
          )}
        </td>

        {/* 상태 */}
        <td style={td}>
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.task_id, e.target.value)}
            style={{
              ...selectStyle,
              background: STATUS_COLORS[task.status],
            }}
          >
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </td>

        {/* 담당자 */}
        <td style={td}>
          {task.assignee_name || <span style={{ color: "#999" }}>— 미지정 —</span>}
        </td>

        {/* 기간 */}
        <td style={td}>
          {task.start_date && task.due_date ? (
            `${task.start_date} ~ ${task.due_date}`
          ) : (
            <span style={{ color: "#ff7043", fontStyle: "italic" }}>📅 미지정</span>
          )}
        </td>

        {/* 작업 */}
        <td style={{ ...td, textAlign: "center" }}>
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

      {hasSubtasks &&
        !isCollapsed &&
        task.subtasks.map((sub) => (
          <TaskRow
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

/* ✅ 스타일 */
const rowStyle = (editing) => ({
  borderBottom: "1px solid #eee",
  background: editing ? "#fffbe6" : "#fff",
  transition: "background 0.2s",
});

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
const progressInner = { height: "100%", background: "#4caf50", transition: "width 0.3s ease" };
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
const table = { width: "100%", borderCollapse: "collapse", fontSize: 14, tableLayout: "fixed" };
const thead = { background: "#f8f9fa", borderBottom: "1px solid #ddd" };
const th = {
  padding: "10px 8px",
  textAlign: "left",
  fontWeight: 600,
  whiteSpace: "nowrap",
};
const td = {
  padding: "8px",
  verticalAlign: "top",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
const inputStyle = { width: "100%", border: "1px solid #ccc", borderRadius: 6, padding: "6px 8px" };
const selectStyle = { border: "1px solid #ccc", borderRadius: 6, padding: "4px 6px" };
const collapseBtn = { border: "none", background: "transparent", cursor: "pointer" };
const descStyle = { fontSize: 13, color: "#666", marginTop: 2 };
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
