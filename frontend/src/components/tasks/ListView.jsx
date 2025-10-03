import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { updateTask, deleteTask, updateTaskStatus } from "../../services/api/task";
import { Button } from "../common/Button";
import { Loader } from "../common/Loader";

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

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const toggleCollapse = (taskId) => {
    setCollapsedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  // ---------------------------
  // 상태 변경
  // ---------------------------
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(projectId, taskId, newStatus);
      toast.success(`상태가 '${newStatus}'로 변경되었습니다.`);
      await onTasksChange();
    } catch (err) {
      console.error("상태 변경 실패:", err);
      toast.error("상태 변경 실패");
    }
  };

  // ---------------------------
  // 삭제
  // ---------------------------
  const handleDelete = async (taskId) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await deleteTask(projectId, taskId);
      toast.success("업무가 삭제되었습니다.");
      await onTasksChange();
    } catch (err) {
      console.error("삭제 실패:", err);
      toast.error("삭제 실패");
    }
  };

  // ---------------------------
  // 인라인 수정
  // ---------------------------
  const startEdit = (task) => {
    setEditingId(task.task_id);
    setEditForm({ title: task.title, description: task.description || "" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: "", description: "" });
  };

  const saveEdit = async (taskId) => {
    if (!editForm.title.trim()) {
      toast.error("제목을 입력하세요.");
      return;
    }
    try {
      setLoading(true);
      await updateTask(projectId, taskId, editForm);
      toast.success("업무가 수정되었습니다.");
      setEditingId(null);
      await onTasksChange();
    } catch (err) {
      console.error("수정 실패:", err);
      toast.error("수정 실패");
    } finally {
      setLoading(false);
    }
  };

  if (!tasks.length) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#777" }}>
        📋 등록된 업무가 없습니다.
      </div>
    );
  }

  return (
    <div style={{ padding: 8 }}>
      {loading && <Loader text="처리 중..." />}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 14,
        }}
      >
        <thead>
          <tr style={{ background: "#f8f9fa", borderBottom: "1px solid #ddd" }}>
            <th style={th}>업무명</th>
            <th style={th}>상태</th>
            <th style={th}>담당자</th>
            <th style={th}>기간</th>
            <th style={th}>작업</th>
          </tr>
        </thead>

        <tbody>
          {tasks.map((task) => (
            <TaskRow
              key={task.task_id}
              task={task}
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

// ✅ 하위업무 재귀 렌더링용 컴포넌트
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
  const isCollapsed = collapsedTasks.has(task.task_id);
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

  return (
    <>
      <tr
        key={task.task_id}
        style={{
          borderBottom: "1px solid #eee",
          background: editingId === task.task_id ? "#fffbe6" : "#fff",
          cursor: "pointer",
        }}
      >
        <td
          style={{ ...td, paddingLeft }}
          onClick={() => {
            if (editingId) return;
            onTaskClick(task);
          }}
        >
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
                {/* ▼/▶ 버튼 */}
                {hasSubtasks && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCollapse(task.task_id);
                    }}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: 14,
                    }}
                  >
                    {isCollapsed ? "▶" : "▼"}
                  </button>
                )}
                <div style={{ fontWeight: 500 }}>{task.title}</div>
              </div>

              {task.description && (
                <div
                  style={{
                    fontSize: 13,
                    color: "#666",
                    marginTop: 2,
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    maxWidth: 400,
                  }}
                >
                  {task.description}
                </div>
              )}
            </>
          )}
        </td>

        {/* 상태 */}
        <td style={td}>
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.task_id, e.target.value)}
            style={selectStyle}
          >
            <option value="TODO">할 일</option>
            <option value="IN_PROGRESS">진행 중</option>
            <option value="REVIEW">검토 중</option>
            <option value="DONE">완료</option>
          </select>
        </td>

        {/* 담당자 */}
        <td style={td}>{task.assignee_name || "—"}</td>

        {/* 일정 */}
        <td style={td}>
          {task.start_date || "-"} ~ {task.due_date || "-"}
        </td>

        {/* 작업 버튼 */}
        <td style={{ ...td, textAlign: "center" }}>
          {editingId === task.task_id ? (
            <>
              <Button
                variant="success"
                style={{ marginRight: 6 }}
                onClick={() => onEditSave(task.task_id)}
              >
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
                style={{ marginRight: 6 }}
                onClick={() => onEditStart(task)}
              >
                ✏️
              </Button>
              <Button
                variant="outline"
                style={{ marginRight: 6 }}
                onClick={() => onDelete(task.task_id)}
              >
                🗑️
              </Button>
            </>
          )}
        </td>
      </tr>

      {/* ✅ 하위 업무: 부모가 접혀있으면 렌더링 안 함 */}
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

// -----------------------------
// 스타일 정의
// -----------------------------
const th = {
  padding: "10px 8px",
  borderBottom: "1px solid #ddd",
  textAlign: "left",
  color: "#333",
  fontWeight: 600,
};

const td = {
  padding: "8px",
  verticalAlign: "top",
};

const inputStyle = {
  width: "100%",
  border: "1px solid #ccc",
  borderRadius: "6px",
  padding: "6px 8px",
  fontSize: 14,
  outline: "none",
};

const selectStyle = {
  border: "1px solid #ccc",
  borderRadius: "6px",
  padding: "4px 6px",
  fontSize: 14,
  outline: "none",
};
