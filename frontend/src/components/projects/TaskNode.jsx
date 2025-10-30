// src/components/projects/TaskNode.jsx
import { memo, useCallback, useState } from "react";
import AssigneeSelector from "./AssigneeSelector";

/**
 * 재귀형 하위 업무 입력
 */
function TaskNode({ task, onUpdate, employees, depth = 0, onAddSibling }) {
  const [showDetails, setShowDetails] = useState(false);

  const handleFieldChange = useCallback(
    (key, value) => onUpdate({ ...task, [key]: value }),
    [task, onUpdate],
  );

  const handleAddChild = () => {
    const newChild = {
      id: Date.now(),
      title: "",
      startDate: "",
      endDate: "",
      assignees: [],
      children: [],
    };
    onUpdate({ ...task, children: [...task.children, newChild] });
  };

  const handleChildUpdate = (index, updated) => {
    const newChildren = [...task.children];
    if (updated === null) newChildren.splice(index, 1);
    else newChildren[index] = updated;
    onUpdate({ ...task, children: newChildren });
  };

  const handleDelete = () => onUpdate(null);

  return (
    <div
      style={{
        marginLeft: depth * 20,
        borderLeft: depth > 0 ? "2px solid #ddd" : "none",
        paddingLeft: depth > 0 ? 8 : 0,
        marginTop: 10,
      }}
    >
      {/* 제목줄 */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          placeholder="업무 제목"
          value={task.title}
          onChange={e => handleFieldChange("title", e.target.value)}
          style={{
            flex: 1,
            padding: "4px 8px",
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{
            background: showDetails ? "#555" : "#1976d2",
            color: "white",
            border: "none",
            borderRadius: 6,
            padding: "4px 8px",
            cursor: "pointer",
          }}
        >
          {showDetails ? "▲ 닫기" : "▼ 상세"}
        </button>
        <button onClick={onAddSibling}>➕ 형제</button>
        <button onClick={handleAddChild}>↳ 하위</button>
        <button
          onClick={handleDelete}
          style={{
            color: "crimson",
            border: "none",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>

      {/* 상세입력 */}
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
              value={task.startDate}
              onChange={e => handleFieldChange("startDate", e.target.value)}
              style={{ marginLeft: 8 }}
            />
            <label style={{ marginLeft: 12 }}>종료일</label>
            <input
              type="date"
              value={task.endDate}
              onChange={e => handleFieldChange("endDate", e.target.value)}
              style={{ marginLeft: 8 }}
            />
          </div>

          <div>
            <strong>담당자:</strong>
            <AssigneeSelector
              employees={employees}
              selected={task.assignees}
              setSelected={newList => handleFieldChange("assignees", newList)}
            />
          </div>
        </div>
      )}

      {/* 재귀 하위업무 */}
      {task.children.map((child, i) => (
        <TaskNode
          key={child.id}
          task={child}
          employees={employees}
          onUpdate={u => handleChildUpdate(i, u)}
          depth={depth + 1}
          onAddSibling={() => {
            const newChildren = [...task.children];
            const newTask = {
              id: Date.now(),
              title: "",
              startDate: "",
              endDate: "",
              assignees: [],
              children: [],
            };
            newChildren.splice(i + 1, 0, newTask);
            onUpdate({ ...task, children: newChildren });
          }}
        />
      ))}
    </div>
  );
}

export default memo(TaskNode);
