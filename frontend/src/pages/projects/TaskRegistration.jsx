import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import { createTask } from "../../../services/api/task"; // ✅ 기존 API 구조 가정

export default function TaskRegistration({ onClose }) {
  const { selectedProjectId, parentTaskId, fetchTasksByProject } = useProjectGlobal();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  // ESC 키로 닫기
  useEffect(() => {
    const onKey = e => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // ✅ 업무 등록
  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("업무 제목을 입력해주세요.");
      return;
    }

    try {
      const payload = {
        project_id: selectedProjectId,
        title,
        description,
        assignee_emp_id: assigneeId ? Number(assigneeId) : null,
        start_date: startDate || null,
        due_date: dueDate || null,
        parent_task_id: parentTaskId || null,
      };

      await createTask(selectedProjectId, payload);
      toast.success(parentTaskId ? "하위 업무가 등록되었습니다." : "업무가 등록되었습니다.");
      await fetchTasksByProject(selectedProjectId);
      onClose?.();
    } catch (err) {
      console.error("❌ 업무 등록 실패:", err);
      toast.error("업무 등록 실패");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: 16,
        height: "100%",
        overflowY: "auto",
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 600 }}>
        {parentTaskId ? "📎 하위 업무 등록" : "📝 새 업무 등록"}
      </h2>

      {/* 제목 */}
      <div>
        <label>업무 제목</label>
        <input
          type="text"
          placeholder="업무 제목을 입력하세요"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* 설명 */}
      <div>
        <label>업무 설명</label>
        <textarea
          placeholder="업무 설명을 입력하세요"
          value={description}
          onChange={e => setDescription(e.target.value)}
          style={{ ...inputStyle, minHeight: 80 }}
        />
      </div>

      {/* 담당자 */}
      <div>
        <label>담당자 ID</label>
        <input
          type="number"
          placeholder="예: 101"
          value={assigneeId}
          onChange={e => setAssigneeId(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* 날짜 */}
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label>시작일</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>마감일</label>
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {/* 버튼 */}
      <div style={buttonRow}>
        <button onClick={handleSubmit} style={saveBtn}>
          저장
        </button>
        <button onClick={onClose} style={cancelBtn}>
          취소
        </button>
      </div>
    </div>
  );
}

/* ----------------------------- */
/* ✅ 스타일 (inline 유지) */
/* ----------------------------- */
const inputStyle = {
  width: "100%",
  border: "1px solid #ccc",
  borderRadius: 6,
  padding: "8px",
  fontSize: 14,
  boxSizing: "border-box",
};

const buttonRow = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
  borderTop: "1px solid #eee",
  paddingTop: 12,
  marginTop: 16,
};

const saveBtn = {
  background: "#1976d2",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "8px 14px",
  cursor: "pointer",
};

const cancelBtn = {
  background: "#f1f1f1",
  border: "1px solid #ccc",
  borderRadius: 6,
  padding: "8px 14px",
  cursor: "pointer",
};
