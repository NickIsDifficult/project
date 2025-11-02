import { useCallback, useRef, useState } from "react";
import { useProjectGlobal } from "../../context/ProjectGlobalContext";
import AssigneeSelector from "./AssigneeSelector";

function TaskNode({ task, onUpdate, employees, depth = 0, projectId, onAddSibling = () => {} }) {
  const [showDetails, setShowDetails] = useState(false);
  const { setUiState } = useProjectGlobal();
  const fileInputRef = useRef(null); // 📎 파일 입력용 ref 추가

  /* ✅ 같은 레벨(형제) 업무 추가 */
  const handleAddSibling = useCallback(() => {
    const newSibling = {
      task_id: Date.now(),
      title: "",
      start_date: "",
      end_date: "",
      assignees: [],
      subtask: [],
      attachments: [], // 📎 새 필드 추가
    };
  }, [task, onUpdate]);

  /* ✅ 필드 변경 */
  const handleFieldChange = useCallback(
    (key, value) => onUpdate?.({ ...task, [key]: value }),
    [task, onUpdate]
  );

  /* ✅ 하위업무 추가 */
  const handleAddChild = useCallback(() => {
    const newChild = {
      task_id: Date.now(),
      title: "",
      start_date: "",
      end_date: "",
      assignees: [],
      subtask: [],
      attachments: [], // 📎 새 필드 추가
    };
    const nextSubtasks = [...(task.subtask || []), newChild];
    onUpdate?.({ ...task, subtask: nextSubtasks });
  }, [task, onUpdate]);

  /* ✅ 하위업무 수정/삭제 */
  const handleChildUpdate = (index, updated) => {
    const next = [...(task.subtask || [])];
    if (updated === null) next.splice(index, 1);
    else next[index] = updated;
    onUpdate?.({ ...task, subtask: next });
  };

  /* ✅ 삭제 */
  const handleDelete = () => onUpdate?.(null);

  /* ✅ ⌨️ 엔터키로 하위업무 추가 */
  const handleKeyDown = e => {
    if (e.key === "Enter") {
      e.preventDefault();
      onAddSibling?.();
    }
  };

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
        projectId: projectId ?? task.project_id,
      },
    }));
  };

  /* 📎 파일 업로드 핸들러 */
  const handleFileChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("10MB 이하의 파일만 업로드할 수 있습니다.");
      return;
    }
    const next = [...(task.attachments || []), file];
    handleFieldChange("attachments", next);
  };

  /* 📎 파일 삭제 */
  const handleFileDelete = i => {
    const next = (task.attachments || []).filter((_, idx) => idx !== i);
    handleFieldChange("attachments", next);
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
          onKeyDown={handleKeyDown}
          placeholder="업무 제목 (Enter로 하위업무 추가)"
          style={{
            flex: 1,
            border: "1px solid #ccc",
            borderRadius: 6,
            padding: "6px 8px",
            background: "#fff",
          }}
        />

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

          {/* 📎 첨부파일 영역 추가 */}
          <div style={{ marginTop: 12 }}>
            <strong>첨부파일:</strong>
            <div style={{ marginTop: 6 }}>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: "#1976d2",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 10px",
                  cursor: "pointer",
                }}
              >
                📤 첨부파일 추가
              </button>

              {(task.attachments || []).length > 0 && (
                <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
                  {(task.attachments || []).map((file, index) => (
                    <li
                      key={index}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottom: "1px solid #eee",
                        padding: "4px 0",
                      }}
                    >
                      <span>{file.name}</span>
                      <button
                        onClick={() => handleFileDelete(index)}
                        style={{
                          background: "crimson",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          padding: "4px 8px",
                          cursor: "pointer",
                        }}
                      >
                        삭제
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {(task.subtask || []).map((child, i) => {
        const handleAddSiblingAtThisLevel = () => {
          const newSibling = {
            task_id: Date.now(),
            title: "",
            start_date: "",
            end_date: "",
            assignees: [],
            subtask: [],
            attachments: [], // 📎 동일하게 추가
          };
          const next = [...(task.subtask || []), newSibling];
          onUpdate?.({ ...task, subtask: next });
        };

        return (
          <TaskNode
            key={child.task_id ?? i}
            task={child}
            employees={employees}
            onUpdate={u => handleChildUpdate(i, u)}
            depth={depth + 1}
            projectId={projectId}
            onAddSibling={handleAddSiblingAtThisLevel}
          />
        );
      })}
    </div>
  );
}

export default TaskNode;
