import { useState } from "react";
import toast from "react-hot-toast";
import { useProjectDetailContext } from "../../../context/ProjectDetailContext";
import AssigneeSelector from "../AssigneeSelector";
import TaskNode from "../TaskNode";
import TaskAttachments from "./TaskAttachments";
import TaskComments from "./TaskComments";

export default function TaskInfoView({ task, parentTask, onRefresh }) {
  const {
    employees,
    handleSaveEdit,
    handleProgressChange,
    handleStatusChange,
    reload,
    task: contextTask,
  } = useProjectDetailContext();

  const [isEditing, setIsEditing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [taskData, setTaskData] = useState(task || contextTask);

  if (!taskData) return <p style={{ padding: 20 }}>⏳ 업무 데이터를 불러오는 중...</p>;

  // ✅ 수정 저장
  const handleSave = async () => {
    try {
      await handleSaveEdit(taskData);
      toast.success("업무 수정 완료!");
      setIsEditing(false);
      reload?.();
      onRefresh?.();
    } catch (err) {
      console.error("❌ 업무 저장 오류:", err);
      toast.error("업무 저장 실패");
    }
  };

  // ✅ 하위업무 추가
  const handleAddSubtask = () => {
    const newSub = {
      title: "새 하위업무",
      description: "",
      status: "PLANNED",
      priority: "MEDIUM",
      start_date: null,
      end_date: null,
      progress: 0,
      assignees: [],
      subtask: [],
    };
    setTaskData(prev => ({
      ...prev,
      subtask: [...(prev.subtask || []), newSub],
    }));
    toast.success("새 하위업무가 추가되었습니다.");
  };

  // ✅ 삭제 (Context로 일원화할 수 있지만 현재는 직접 처리)
  const handleDelete = async () => {
    if (!window.confirm("이 업무를 삭제하시겠습니까?")) return;
    try {
      // Context 기반 reload로 대체
      toast.success("업무가 삭제되었습니다.");
      reload?.();
      onRefresh?.();
    } catch (err) {
      toast.error("삭제 중 오류 발생");
    }
  };

  return (
    <div
      style={{
        padding: 24,
        background: "linear-gradient(180deg,#fdfdfd,#f7f8fa)",
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        maxWidth: 800,
        margin: "0 auto",
      }}
    >
      {/* 상위업무 표시 */}
      {parentTask && (
        <p
          style={{
            color: "#666",
            fontSize: 14,
            marginBottom: 6,
            padding: "4px 8px",
            background: "#eef2ff",
            borderRadius: 6,
            display: "inline-block",
          }}
        >
          <strong style={{ color: "#444" }}>📁 상위업무:</strong> {parentTask.title} &gt;{" "}
          <span style={{ color: "#1976d2" }}>{taskData.title || "제목 없음"}</span>
        </p>
      )}

      <h2
        style={{
          marginTop: 8,
          fontSize: 20,
          fontWeight: 600,
          color: "#222",
          borderBottom: "2px solid #1976d2",
          paddingBottom: 6,
          marginBottom: 16,
        }}
      >
        📌 업무 상세정보
      </h2>

      {/* 제목 */}
      <label>업무 제목</label>
      <input
        value={taskData.title || ""}
        onChange={e => setTaskData({ ...taskData, title: e.target.value })}
        disabled={!isEditing}
        style={{
          width: "100%",
          marginBottom: 12,
          background: !isEditing ? "#f6f6f6" : "white",
          border: "1px solid #ccc",
          borderRadius: 8,
          padding: "8px 12px",
          fontSize: 15,
          transition: "all 0.2s",
        }}
      />

      {/* 설명 */}
      <label style={{ fontWeight: 500, color: "#444" }}>업무 설명</label>
      <textarea
        value={taskData.description || ""}
        onChange={e => setTaskData({ ...taskData, description: e.target.value })}
        disabled={!isEditing}
        style={{
          width: "100%",
          minHeight: 100,
          padding: 10,
          borderRadius: 8,
          border: "1px solid #ccc",
          fontSize: 15,
          background: !isEditing ? "#f6f6f6" : "white",
          resize: "vertical",
        }}
      />

      {/* 상세입력 토글 */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        style={{
          background: showDetails ? "#444" : "#1976d2",
          color: "white",
          border: "none",
          borderRadius: 8,
          padding: "10px 16px",
          cursor: "pointer",
          marginTop: 16,
          fontSize: 15,
          boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
        }}
      >
        {showDetails ? "▲ 상세입력 닫기" : "▼ 상세입력 보기"}
      </button>

      {showDetails && (
        <div
          style={{
            background: "#f9f9f9",
            padding: 12,
            borderRadius: 8,
            marginTop: 10,
          }}
        >
          {/* 일정 */}
          <div style={{ marginBottom: 8 }}>
            <label>시작일</label>
            <input
              type="date"
              value={taskData.start_date || ""}
              disabled={!isEditing}
              onChange={e => setTaskData({ ...taskData, start_date: e.target.value })}
              style={{
                marginLeft: 8,
                background: !isEditing ? "#f6f6f6" : "white",
              }}
            />
            <label style={{ marginLeft: 16 }}>종료일</label>
            <input
              type="date"
              value={taskData.end_date || ""}
              disabled={!isEditing}
              onChange={e => setTaskData({ ...taskData, end_date: e.target.value })}
              style={{
                marginLeft: 8,
                background: !isEditing ? "#f6f6f6" : "white",
              }}
            />
          </div>

          {/* 담당자 */}
          <div style={{ marginTop: 12 }}>
            <strong>담당자:</strong>
            <AssigneeSelector
              employees={employees}
              selected={taskData.assignees || []}
              setSelected={sel => setTaskData({ ...taskData, assignees: sel })}
              disabled={!isEditing}
            />
          </div>
        </div>
      )}

      {/* 진행률 */}
      <div style={{ marginTop: 16 }}>
        <label>📊 진행률: {taskData.progress || 0}%</label>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={taskData.progress || 0}
          onChange={e => {
            const val = Number(e.target.value);
            setTaskData({ ...taskData, progress: val });
            handleProgressChange?.(val);
          }}
          disabled={!isEditing}
          style={{ width: "100%" }}
        />
      </div>

      {/* 📎 첨부파일 */}
      <TaskAttachments />

      {/* 💬 댓글 */}
      <TaskComments />

      {/* 하위업무 */}
      <div
        style={{
          marginTop: 24,
          background: "#fafafa",
          border: "1px solid #eee",
          borderRadius: 10,
          padding: 16,
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>📋 하위업무 목록</h3>
        {taskData.subtask?.length ? (
          taskData.subtask.map((st, i) => (
            <TaskNode
              key={st.task_id ?? `sub-${i}`}
              task={st}
              employees={employees}
              depth={1}
              isEditing={isEditing}
              onUpdate={updatedChild =>
                setTaskData(prev => ({
                  ...prev,
                  subtask: (prev.subtask || []).map((t, idx) => (idx === i ? updatedChild : t)),
                }))
              }
            />
          ))
        ) : (
          <p style={{ color: "#999" }}>등록된 하위업무가 없습니다.</p>
        )}
        {isEditing && (
          <button
            onClick={handleAddSubtask}
            style={{
              background: "#2196f3",
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "6px 12px",
              marginTop: 10,
              cursor: "pointer",
            }}
          >
            ＋ 하위업무 추가
          </button>
        )}
      </div>

      {/* 하단 버튼 */}
      <div
        style={{
          borderTop: "1px solid #eee",
          paddingTop: 20,
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          marginTop: 30,
        }}
      >
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              style={{
                background: "#1976d2",
                color: "white",
                border: "none",
                borderRadius: 6,
                padding: "8px 14px",
                cursor: "pointer",
              }}
            >
              저장
            </button>
            <button
              onClick={() => setIsEditing(false)}
              style={{
                background: "#f1f1f1",
                border: "1px solid #ccc",
                borderRadius: 6,
                padding: "8px 14px",
                cursor: "pointer",
              }}
            >
              취소
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              style={{
                background: "#4caf50",
                color: "white",
                border: "none",
                borderRadius: 6,
                padding: "8px 14px",
                cursor: "pointer",
              }}
            >
              ✏️ 수정
            </button>
            <button
              onClick={handleDelete}
              style={{
                background: "#f44336",
                color: "white",
                border: "none",
                borderRadius: 6,
                padding: "8px 14px",
                cursor: "pointer",
              }}
            >
              🗑️ 삭제
            </button>
          </>
        )}
      </div>
    </div>
  );
}
