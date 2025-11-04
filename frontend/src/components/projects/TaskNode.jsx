// src/components/projects/TaskNode.jsx
import { useCallback, useRef, useState } from "react";
import { useProjectDetailContext } from "../../context/ProjectDetailContext";
import { useProjectGlobal } from "../../context/ProjectGlobalContext";
import AssigneeSelector from "./AssigneeSelector";

// ✅ 고유 임시 ID 생성기
const makeTempId = () => `tmp_${crypto?.randomUUID?.() ?? Date.now()}`;

export default function TaskNode({
  task,
  onUpdate,
  employees,
  depth = 0,
  onAddSibling = () => {},
  isEditing = false,
}) {
  const [showDetails, setShowDetails] = useState(false);
  const fileInputRef = useRef(null);
  const { setUiState } = useProjectGlobal();

  /** ✅ 안전한 Context Fallback */
  let handleSaveEdit = async () => {};
  let handleUploadFile = async () => {};
  let handleDeleteFile = async () => {};
  let updateTaskLocal = () => {};

  try {
    const ctx = useProjectDetailContext();
    handleSaveEdit = ctx.handleSaveEdit || handleSaveEdit;
    handleUploadFile = ctx.handleUploadFile || handleUploadFile;
    handleDeleteFile = ctx.handleDeleteFile || handleDeleteFile;
    updateTaskLocal = ctx.updateTaskLocal || updateTaskLocal;
  } catch {
    // 등록 화면에서는 Provider가 없으므로 무시
  }

  /** ✅ 필드 변경 */
  const handleFieldChange = useCallback(
    (key, value) => {
      const updated = { ...task, [key]: value };
      onUpdate?.(updated);
      if (task.task_id) updateTaskLocal?.(task.task_id, updated);
    },
    [task, onUpdate, updateTaskLocal],
  );

  /** ✅ 담당자 변경 */
  const handleAssigneesChange = async list => {
    const ids = (list ?? []).map(v => (typeof v === "object" ? v.emp_id : v));
    const next = { ...task, assignee_ids: ids };
    onUpdate?.(next);
    if (task.task_id) updateTaskLocal?.(task.task_id, next);
    try {
      if (task.task_id) await handleSaveEdit(next);
    } catch (err) {
      console.error("❌ 담당자 업데이트 실패:", err);
    }
  };

  /** ✅ 형제 업무 추가 */
  const handleAddSibling = useCallback(() => {
    const newSibling = {
      task_id: null,
      temp_id: makeTempId(),
      title: "",
      start_date: "",
      end_date: "",
      assignee_ids: [],
      subtask: [],
      attachments: [],
      isEditing: true,
    };
    onAddSibling(task, newSibling);
  }, [task, onAddSibling]);

  /** ✅ 하위 업무 추가 */
  const handleAddChild = useCallback(() => {
    const newChild = {
      task_id: null,
      temp_id: makeTempId(),
      title: "",
      start_date: "",
      end_date: "",
      assignee_ids: [],
      subtask: [],
      attachments: [],
      isEditing: true,
    };
    const updated = { ...task, subtask: [...(task.subtask || []), newChild] };
    onUpdate?.(updated);
  }, [task, onUpdate]);

  /** ✅ 하위 업무 업데이트 */
  const handleChildUpdate = useCallback(
    (index, updated) => {
      const next = [...(task.subtask || [])];
      if (updated === null) next.splice(index, 1);
      else next[index] = updated;
      onUpdate?.({ ...task, subtask: next });
    },
    [task, onUpdate],
  );

  /** ✅ 자세히 보기 → Task Detail Panel */
  const openTaskPanel = useCallback(() => {
    if (!task?.task_id) return;
    setUiState(prev => ({
      ...prev,
      drawer: { ...prev.drawer, project: false, task: true },
      panel: { ...prev.panel, selectedTask: task },
    }));
  }, [task, setUiState]);

  /** ✅ 파일 업로드 */
  const handleFileChange = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await handleUploadFile(file);
    } catch (err) {
      console.error("❌ 파일 업로드 실패:", err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /** ✅ 파일 삭제 */
  const handleFileDelete = async i => {
    const file = (task.attachments || [])[i];
    if (!file) return;
    try {
      await handleDeleteFile(file.attachment_id);
    } catch (err) {
      console.error("❌ 파일 삭제 실패:", err);
    }
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
      {/* 제목 입력 행 */}
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
          disabled={!isEditing}
          onKeyDown={e => {
            if (isEditing && e.key === "Enter") {
              e.preventDefault();
              handleAddSibling();
            }
          }}
          style={{
            flex: 1,
            border: "1px solid #ccc",
            borderRadius: 6,
            padding: "6px 8px",
            background: isEditing ? "#fff" : "#f4f4f4",
          }}
        />

        {/* 버튼 그룹 */}
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => setShowDetails(p => !p)}
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
            disabled={!task.task_id}
            style={{
              background: task.task_id ? "#1976d2" : "#aaa",
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "6px 10px",
              cursor: task.task_id ? "pointer" : "not-allowed",
            }}
            title={task.task_id ? "이 업무로 이동" : "저장 후 이용 가능"}
          >
            자세히
          </button>
        </div>
      </div>

      {/* 상세입력 영역 */}
      {showDetails && (
        <div
          style={{
            background: "#f9f9f9",
            borderRadius: 8,
            padding: 8,
            marginTop: 8,
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <label>
              <strong>시작일:</strong>
            </label>
            <input
              type="date"
              value={task.start_date || ""}
              onChange={e => handleFieldChange("start_date", e.target.value)}
              disabled={!isEditing}
              style={{
                width: "100%",
                marginTop: 4,
                marginBottom: 8,
                border: "1px solid #ccc",
                borderRadius: 6,
                padding: "6px 8px",
              }}
            />

            <label>
              <strong>종료일:</strong>
            </label>
            <input
              type="date"
              value={task.end_date || ""}
              onChange={e => handleFieldChange("end_date", e.target.value)}
              disabled={!isEditing}
              style={{
                width: "100%",
                marginTop: 4,
                border: "1px solid #ccc",
                borderRadius: 6,
                padding: "6px 8px",
              }}
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <strong>담당자:</strong>
            <AssigneeSelector
              employees={employees}
              selected={task.assignee_ids || []}
              setSelected={handleAssigneesChange}
              disabled={!isEditing}
            />
          </div>

          <div>
            <strong>파일:</strong>{" "}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              disabled={!isEditing}
            />
            <ul style={{ marginTop: 6 }}>
              {(task.attachments || []).map((f, i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>{f.file_name || f.name}</span>
                  {isEditing && (
                    <button
                      onClick={() => handleFileDelete(i)}
                      style={{
                        background: "#e53935",
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        padding: "4px 8px",
                        cursor: "pointer",
                      }}
                    >
                      삭제
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 하위 업무 추가 버튼 */}
      {isEditing && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: 10,
            paddingTop: 10,
            borderTop: "1px solid #ddd",
          }}
        >
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
            ➕ 세부 업무 추가
          </button>
        </div>
      )}

      {/* 재귀 렌더링 */}
      {(task.subtask || []).map((sub, i) => (
        <TaskNode
          key={sub.task_id ?? sub.temp_id ?? `sub-${i}`}
          task={sub}
          employees={employees}
          isEditing={isEditing}
          depth={depth + 1}
          onUpdate={updatedSub => handleChildUpdate(i, updatedSub)}
          onAddSibling={onAddSibling}
        />
      ))}
    </div>
  );
}
