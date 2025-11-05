import { useCallback, useEffect, useRef, useState } from "react";
import { useProjectDetailContext } from "../../context/ProjectDetailContext";
import { useProjectGlobal } from "../../context/ProjectGlobalContext";
import { updateTask } from "../../services/api/task";
import AssigneeSelector from "./AssigneeSelector";

const makeTempId = () => `tmp_${crypto?.randomUUID?.() ?? Date.now()}`;

export default function TaskNode({
  task,
  onUpdate,
  employees,
  projectId,
  depth = 0,
  onAddSibling = () => {},
  onDelete = () => {},
  parentTask = null,
  isEditing = false,
  focusIdRef = null,
  showDetailButton = true,
}) {
  const [showDetails, setShowDetails] = useState(false);
  const fileInputRef = useRef(null);
  const titleInputRef = useRef(null);
  const { setUiState } = useProjectGlobal();

  // ✅ 자동 포커스 이동
  useEffect(() => {
    if (focusIdRef?.current && focusIdRef.current === task.temp_id) {
      titleInputRef.current?.focus();
      focusIdRef.current = null;
    }
  }, [focusIdRef, task.temp_id]);

  // ✅ 안전한 Context
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
  } catch {}

  // ✅ 필드 변경
  const handleFieldChange = useCallback((key, value) => {
  // 🔁 due_date와 end_date를 항상 동기화
  const patch = { [key]: value };
  if (key === "due_date") patch.end_date = value || null;
  if (key === "end_date") patch.due_date = value || null;

  const updated = { ...task, ...patch };
  onUpdate?.(updated);
  if (task.task_id) updateTaskLocal?.(task.task_id, updated);

  if (task.task_id) {
    (async () => {
      try {
        // ✅ 서버에는 due_date만 보내기 (end_date 제거)
        const payload = { ...updated };
        if (payload.end_date && !payload.due_date) {
          payload.due_date = payload.end_date;
        }
        delete payload.end_date;

        const saved = await updateTask(task.project_id, task.task_id, payload);
        console.log("✅ [하위업무 PUT 완료]", saved);
        if (saved) onUpdate?.(saved);
      } catch (e) {
        console.error("❌ 하위업무 저장 실패:", e);
      }
    })();
  }
}, [task, onUpdate, updateTaskLocal]);

  // ✅ 담당자 변경
  const handleAssigneesChange = async list => {
    const ids = (list ?? []).map(v => (typeof v === "object" ? v.emp_id : v));
    const next = { ...task, assignee_ids: ids };
    onUpdate?.(next);
    if (task.task_id) updateTaskLocal?.(task.task_id, next);
    try {
      if (task.task_id) {
        const updated = await handleSaveEdit(next); // ✅ 백엔드 최신 데이터 가져오기
        if (updated) onUpdate?.(updated); // ✅ 부모/로컬 상태 즉시 갱신
      }
    } catch (err) {
      console.error("❌ 담당자 업데이트 실패:", err);
    }
  };

  // ✅ 형제 추가
  const handleAddSibling = useCallback(() => {
    const newTask = {
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
    if (focusIdRef) focusIdRef.current = newTask.temp_id;
    onAddSibling(parentTask, task, newTask);
  }, [parentTask, task, onAddSibling, focusIdRef]);

  // ✅ 세부 업무 추가
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
    if (focusIdRef) focusIdRef.current = newChild.temp_id;
    const updated = { ...task, subtask: [...(task.subtask || []), newChild] };
    onUpdate?.(updated);
  }, [task, onUpdate, focusIdRef]);

  // ✅ 자식 업데이트
  const handleChildUpdate = useCallback(
  (index, updated) => {
    const next = [...(task.subtask || [])];
    if (updated === null) next.splice(index, 1);
    else next[index] = updated;
    onUpdate?.({ ...task, subtask: next });

    // ✅ 자식이 기존 태스크라면 서버에 즉시 반영
    if (updated && updated.task_id) {
      (async () => {
        try {
          const patch = { ...updated };
          if ("end_date" in patch && !("due_date" in patch)) {
            patch.due_date = patch.end_date || null;
            }
          const payload = { ...patch };
          delete payload.end_date;
          delete payload.end_date;
          const saved = await handleSaveEdit(payload);
          if (saved) {
            next[index] = saved;
            onUpdate?.({ ...task, subtask: next });
          }
        } catch (e) {
          console.error("❌ 하위업무 저장 실패:", e);
        }
      })();
    }
  },
  [task, onUpdate, handleSaveEdit],
);

  // ✅ 삭제 처리 (버튼 / Backspace 공통)
  const handleDelete = useCallback(
    (triggerFromKeyboard = false) => {
      // 🔸 삭제 시 포커스 이동 처리
      onDelete?.(parentTask, task, { focusIdRef, triggerFromKeyboard });
    },
    [onDelete, parentTask, task, focusIdRef],
  );

  // ✅ Enter / Shift+Enter / Backspace 처리
  const handleKeyDown = e => {
    if (!isEditing) return;

    // Shift + Enter → 줄바꿈
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const value = task.title || "";
      const newValue = value.slice(0, start) + "\n" + value.slice(end);
      handleFieldChange("title", newValue);
      requestAnimationFrame(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 1;
      });
      return;
    }

    // Enter → 형제 추가
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddSibling();
    }

    // Backspace → 제목이 비어있을 때 삭제
    if (e.key === "Backspace" && (task.title ?? "").trim() === "") {
      e.preventDefault();
      handleDelete(true);
    }
  };

  // ✅ 패널 열기
  const openTaskPanel = useCallback(() => {
    if (!task?.task_id) return;
    setUiState(prev => ({
      ...prev,
      drawer: { ...prev.drawer, project: false, task: true },
      panel: { ...prev.panel, selectedTask: task },
    }));
  }, [task, setUiState]);

  // ✅ 파일 핸들러
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
      {/* 제목 입력 */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <textarea
          ref={titleInputRef}
          value={task.title || ""}
          onChange={e => handleFieldChange("title", e.target.value)}
          placeholder={depth === 0 ? "업무 제목" : "세부 업무 제목"}
          disabled={!isEditing}
          onKeyDown={handleKeyDown}
          rows={1}
          style={{
            flex: 1,
            border: "1px solid #ccc",
            borderRadius: 6,
            padding: "6px 8px",
            background: isEditing ? "#fff" : "#f4f4f4",
            resize: "none",
            lineHeight: 1.5,
          }}
        />

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

          {showDetailButton && (
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
            >
              자세히
            </button>
          )}

          {/* ✅ 삭제 버튼 */}
          <button
            onClick={() => handleDelete(false)}
            style={{
              background: "#e53935",
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "6px 10px",
              cursor: "pointer",
            }}
          >
            🗑
          </button>
        </div>
      </div>

      {/* 상세 입력 */}
      {showDetails && (
        <div style={{ background: "#f9f9f9", borderRadius: 8, padding: 8, marginTop: 8 }}>
          <div style={{ marginBottom: 8 }}>
            <label>
              <strong>시작일:</strong>
            </label>
            <input
              type="date"
              value={task.start_date || ""}
              onChange={e => handleFieldChange("start_date", e.target.value)}
              disabled={!isEditing}
              style={{ width: "100%", marginTop: 4, marginBottom: 8, borderRadius: 6 }}
            />
            <label>
              <strong>종료일:</strong>
            </label>
            <input
              type="date"
              value={task.due_date || task.end_date || ""}
              onChange={e => handleFieldChange("due_date", e.target.value)}
              disabled={!isEditing}
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
        </div>
      )}

      {/* 세부 업무 추가 */}
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
      {Array.isArray(task.subtask) &&
  task.subtask.map((sub, idx) => (
    <TaskNode
      key={sub.task_id ?? `sub-${idx}`}
      task={{
        ...sub,
        due_date: sub.due_date || sub.end_date || null, // ✅ 종료일 보정
        assignees:
          sub.assignees && sub.assignees.length > 0
            ? sub.assignees
            : sub.taskmember?.map(m => ({
                emp_id: m.emp_id,
                name: m.employee?.name || "",
                email: m.employee?.email || "",
                position: m.employee?.position || "",
              })) || [],
      }}
      employees={employees}
      projectId={projectId}
      depth={depth + 1}
      onUpdate={onUpdate}
      isEditing={isEditing}
    />
  ))}
    </div>
  );
}
