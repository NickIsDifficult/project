// src/components/projects/TaskNode.jsx
import { useCallback, useRef, useState } from "react";
import { useProjectGlobal } from "../../context/ProjectGlobalContext";
import { updateTask } from "../../services/api/task";
import AssigneeSelector from "./AssigneeSelector";
/** 프론트 전용 임시 ID */
const makeTempId = () => `tmp_${crypto?.randomUUID?.() ?? Date.now()}`;

export default function TaskNode({
  task,
  onUpdate,           // 현재 노드 데이터 변경 콜백
  employees,
  depth = 0,
  projectId,
  onAddSibling = () => {}, // 형제업무 추가 콜백
  isEditing = false,
}) {
  const [showDetails, setShowDetails] = useState(false);
  const { setUiState } = useProjectGlobal();
  const fileInputRef = useRef(null);



const handleFieldChange = useCallback((key, value) => {
  const updated = structuredClone ? structuredClone(task) : JSON.parse(JSON.stringify(task));
  updated[key] = value;
  // 부모가 값-형/함수-형 둘 중 무엇을 기대해도 반영되게 이중 호출
  try { onUpdate?.(updated); } catch {}
  try { onUpdate?.(() => updated); } catch {}
}, [task, onUpdate]);

const handleAssigneesChange = useCallback(async (list) => {
  // 선택된 담당자 목록을 emp_id 기반으로 정리
  const ids = (list ?? []).map(v => (typeof v === "object" ? Number(v.emp_id) : Number(v)));

  // 1) 로컬 상태에 즉시 반영 (optimistic update)
  const members = ids.map(id => ({ emp_id: id }));
  const next = {
    ...task,
    taskmember: members,
    assignee_ids: ids,
    __rev: (task.__rev ?? 0) + 1,
  };
  const cloned = structuredClone ? structuredClone(next) : JSON.parse(JSON.stringify(next));
  onUpdate?.(cloned);

  // 2) 서버에 바로 반영(단건 업데이트). task_id가 없으면 저장할 수 없으므로 무시.
  if (!projectId || !task?.task_id) {
    // 신규로 아직 DB에 없는 태스크는 나중에 전체 저장될 때 반영됨.
    return;
  }

  try {
    // 보낼 페이로드는 백엔드 스키마에 맞춰 assignee_ids 사용 (네 api.normalizeTaskPayload도 기대)
    await updateTask(projectId, task.task_id, {

  assignee_ids: ids.map(id => Number(id)),
});
    await fetchTasksByProjectNow(projectId);
    setLastUpdatedAt(Date.now());
    // optional: 성공 로그
    console.log(`✅ assignees updated for task ${task.task_id}:`, ids);
  } catch (err) {
    console.error("❌ 담당자 업데이트 실패:", err);

    // 실패하면 사용자에게 알리고(옵션), 로컬 변경을 롤백할 수 있음.
    // 단순하게는 에러 토스트만 띄우는 방식 권장:
    try { toast?.error?.("담당자 저장에 실패했습니다."); } catch(e) {}

    // 롤백(선택): 이전 상태 정보가 필요하므로 간단한 방법으로 현재 task에서 서버값 다시 fetch 권장.
    // 여기선 안전하게 revert를 시도하려면 부모가 원하면 추가 구현 가능.
  }
}, [task, onUpdate, projectId]);


  /** ✅ 형제업무 추가 (TaskNode 자체에서도 새 항목 생성 가능) */
  const handleAddSibling = useCallback(() => {
    const newSibling = {
      task_id: null,
      temp_id: makeTempId(),
      title: "",
      start_date: "",
      due_date: "",
      assignees: [],
      subtask: [],
      attachments: [],
      isEditing: true,
    };
    // 부모로 콜백 전파 (형제 추가 로직이 부모에서 처리될 수도 있음)
    onAddSibling(task, newSibling);
  }, [task, onAddSibling]);

  /** 하위업무 추가 */
  const handleAddChild = useCallback(() => {
    const newChild = {
  task_id: null,
  temp_id: makeTempId(),
  title: "",
  start_date: "",
  due_date: "",
  assignee_ids: [],      // ✅ 서버용
  taskmember: [],        // ✅ 하위업무 담당자 구조용
  subtask: [],
  attachments: [],
  isEditing: true,
};

    const nextSubtasks = [...(task.subtask || []), newChild];
    onUpdate?.({ ...task, subtask: nextSubtasks });
  }, [task, onUpdate]);

  /** 하위업무 업데이트 */
  const handleChildUpdate = useCallback(
    (index, updated) => {
      const next = Array.isArray(task.subtask) ? [...task.subtask] : [];
      if (updated === null) next.splice(index, 1);
      else next[index] = updated;
      onUpdate?.({ ...task, subtask: next });
    },
    [task, onUpdate]
  );

  /** 우측 패널 열기 */
  const openTaskPanel = useCallback(() => {
    if (!task?.task_id) return;
    setUiState(prev => ({
      ...prev,
      drawer: { ...prev.drawer, project: false, task: true },
      panel: {
        ...prev.panel,
        selectedTask: { ...task, project_id: projectId },
        projectId: projectId ?? task.project_id,
      },
    }));
  }, [task, projectId, setUiState]);

  /** 파일 업로드 */
  const handleFileChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("10MB 이하의 파일만 업로드할 수 있습니다.");
      return;
    }
    const next = [...(task.attachments || []), file];
    handleFieldChange("attachments", next);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /** 파일 삭제 */
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
      {/* 헤더 */}
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
          onKeyDown={e => {
            if (isEditing && e.key === "Enter") {
              e.preventDefault();
              handleAddSibling();
            }
          }}
          disabled={!isEditing}
          placeholder="업무 제목"
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
            style={{
              background: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "6px 10px",
              cursor: "pointer",
            }}
            title={task?.task_id ? "우측 패널로 이동" : "저장 후 이용 가능"}
          >
            자세히
          </button>
        </div>
      </div>

      {/* 버튼 */}
      {isEditing && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            marginTop: "10px",
            paddingTop: "10px",
            borderTop: "1px solid #ddd",
          }}
        >
          <button
            onClick={handleAddSibling}
            style={{
              background: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "6px 10px",
              cursor: "pointer",
            }}
          >
            ➕ 형제업무
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
            ➕ 하위업무
          </button>
        </div>
      )}

      {/* 상세 */}
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
            <label><strong>시작일:</strong></label>
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
            <label><strong>종료일:</strong></label>
            <input
              type="date"
              value={task.due_date || ""}
              onChange={e => handleFieldChange("due_date", e.target.value)}
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
  selected={
    Array.isArray(task.assignee_ids)
      ? task.assignee_ids
      : (task.taskmember ?? []).map(m => Number(m.emp_id))
  }
  setSelected={handleAssigneesChange}
  disabled={false}
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
                  <span>{typeof f === "string" ? f : f.name}</span>
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

      {/* 재귀 렌더링 */}
      {(task.subtask || []).map((sub, i) => (
        <TaskNode
          key={sub.task_id ?? sub.temp_id ?? `sub-${i}`}
          task={sub}
          employees={employees}
          isEditing={isEditing}
          projectId={projectId}
          depth={depth + 1}
          onUpdate={updatedSub => handleChildUpdate(i, updatedSub)}
          onAddSibling={onAddSibling}
        />
      ))}
    </div>
  );
}
