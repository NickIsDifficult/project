// ✅ src/components/projects/TaskNode.jsx
import { memo, useCallback, useState } from "react";
import { useProjectGlobal } from "../../context/ProjectGlobalContext";
import AssigneeSelector from "./AssigneeSelector";

/**
 * ✅ TaskNode
 * - 업무 / 하위업무 재귀 컴포넌트
 * - 담당자 선택, 시작일/종료일, 세부정보 토글, 자세히 보기 기능 포함
 */
function TaskNode({ task, onUpdate, employees, depth = 0, projectId }) {
  const [showDetails, setShowDetails] = useState(false);
  const { setUiState } = useProjectGlobal();

  /* ✅ 필드 변경 */
  const handleFieldChange = useCallback(
    (key, value) => onUpdate?.({ ...task, [key]: value }),
    [task, onUpdate],
  );

  /* ✅ 하위업무 추가 */
  const handleAddChild = () => {
    const newChild = {
      task_id: Date.now(),
      title: "",
      start_date: "",
      end_date: "",
      assignees: [],
      subtask: [],
      isOpen: false,
    };
    onUpdate?.({ ...task, subtask: [...(task.subtask || []), newChild] });
  };

  /* ✅ 하위업무 수정/삭제 */
  const handleChildUpdate = (index, updated) => {
    const next = [...(task.subtask || [])];
    if (updated === null) next.splice(index, 1);
    else next[index] = updated;
    onUpdate?.({ ...task, subtask: next });
  };

  /* ✅ 삭제 */
  const handleDelete = () => onUpdate?.(null);

  /* ✅ 자세히 보기 (우측 패널 이동) */
  const openTaskPanel = () => {
    if (!task?.task_id) {
      console.warn("⚠️ task_id 누락");
      return;
    }
    setUiState(prev => ({
      ...prev,
      drawer: { ...prev.drawer, project: false, task: true },
      panel: {
        ...prev.panel,
        selectedTask: { ...task, project_id: projectId },
        projectId: projectId ?? task.project_id, // ✅ 반드시 포함
      },
    }));
  };

  return (
    <div
      style={{
        marginLeft: depth * 20,
        borderLeft: depth ? "2px solid #ddd" : "none",
        paddingLeft: depth ? 8 : 0,
        marginTop: 10,
      }}
    >
      {/* ================================ */}
      {/* 🧱 제목 + 버튼 그룹 */}
      {/* ================================ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          value={task.title || ""}
          onChange={e => handleFieldChange("title", e.target.value)}
          placeholder="업무 제목"
          style={{
            flex: 1,
            border: "1px solid #ccc",
            borderRadius: 6,
            padding: "6px 8px",
            background: "#fff",
          }}
        />

        {/* ✅ 버튼 그룹 */}
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => setShowDetails(prev => !prev)}
            style={{
              background: "#757575",
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "6px 10px",
              cursor: "pointer",
            }}
          >
            {showDetails ? "▲" : "▼"}
          </button>

          <button
            onClick={openTaskPanel}
            style={{
              background: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "6px 10px",
              cursor: "pointer",
            }}
          >
            자세히
          </button>

          <button
            onClick={handleAddChild}
            style={{
              background: "#4caf50",
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "6px 10px",
              cursor: "pointer",
            }}
          >
            ＋
          </button>

          <button
            onClick={handleDelete}
            style={{
              background: "#f44336",
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "6px 10px",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* ================================ */}
      {/* 🧩 상세입력 토글 */}
      {/* ================================ */}
      {showDetails && (
        <div
          style={{
            background: "#f9f9f9",
            borderRadius: 8,
            padding: 8,
            marginTop: 8,
          }}
        >
          <div style={{ marginBottom: 6 }}>
            <label>시작일</label>
            <input
              type="date"
              value={task.start_date || ""}
              onChange={e => handleFieldChange("start_date", e.target.value)}
              style={{ marginLeft: 8 }}
            />
            <label style={{ marginLeft: 12 }}>종료일</label>
            <input
              type="date"
              value={task.end_date || ""}
              onChange={e => handleFieldChange("end_date", e.target.value)}
              style={{ marginLeft: 8 }}
            />
          </div>

          <div>
            <strong>담당자:</strong>
            <AssigneeSelector
              employees={employees}
              selected={task.assignees ?? []}
              setSelected={newList => handleFieldChange("assignees", newList)}
            />
          </div>
        </div>
      )}

      {/* ================================ */}
      {/* 🔁 하위업무 재귀 렌더링 */}
      {/* ================================ */}
      {(task.subtask || []).map((child, i) => (
        <TaskNode
          key={child.task_id ?? i}
          task={child}
          employees={employees}
          onUpdate={u => handleChildUpdate(i, u)}
          depth={depth + 1}
          projectId={projectId} // ✅ 전달 유지
        />
      ))}
    </div>
  );
}

export default memo(TaskNode);
