import React, { useState, useEffect } from "react";
import { createProject } from "../../services/api/project";
import { createTask } from "../../services/api/task";

export default function ProjectRegistration({ onClose }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignees, setAssignees] = useState([]); // 선택된 담당자
  const [employees, setEmployees] = useState([]); // 전체 직원 목록
  const [assigneeInput, setAssigneeInput] = useState(""); // 검색 입력
  const [subtasks, setSubtasks] = useState([]); // 하위 업무 목록
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // 담당자 선택 / 제거
  const toggleAssignee = (id) => {
    if (assignees.includes(id)) {
      setAssignees(assignees.filter((emp) => emp !== id));
    } else {
      setAssignees([...assignees, id]);
    }
  };

  // 하위업무 추가 / 삭제
  const handleAddSubtask = () => {
    setSubtasks([...subtasks, { title: "", endDate: "", details: [] }]);
  };
  const handleRemoveSubtask = (index) => {
    const newSubs = [...subtasks];
    newSubs.splice(index, 1);
    setSubtasks(newSubs);
  };

  // 세부업무 추가 / 삭제
  const handleAddSubDetail = (subIndex) => {
    const newSubs = [...subtasks];
    newSubs[subIndex].details.push({ title: "", endDate: "" });
    setSubtasks(newSubs);
  };

  const handleRemoveSubDetail = (subIndex, detailIndex) => {
    const newSubs = [...subtasks];
    newSubs[subIndex].details.splice(detailIndex, 1);
    setSubtasks(newSubs);
  };

  // 값 변경 핸들러
  const handleSubtaskChange = (index, field, value) => {
    const newSubs = [...subtasks];
    newSubs[index][field] = value;
    setSubtasks(newSubs);
  };
  const handleDetailChange = (subIndex, detailIndex, field, value) => {
    const newSubs = [...subtasks];
    newSubs[subIndex].details[detailIndex][field] = value;
    setSubtasks(newSubs);
  };

  // 제출
  const handleSubmit = async () => {
    try {
      console.log("상위 업무:", title);
      console.log("업무 내용:", description);
      console.log("담당자:", assignees);
      console.log("하위업무:", subtasks);

      // ✅ 여기서 실제 API 호출
      const task = await createTask(title, description, startDate, endDate);

      for (const sub of subtasks) {
        if (!sub.title.trim()) continue;
        const subtask = await createSubtask(task.id, sub.title, sub.startDate, sub.endDate);

        for (const detail of sub.details) {
          if (!detail.title.trim()) continue;
          await createSubDetail(subtask.id, detail.title, detail.startDate, detail.endDate);
        }
      }

      alert("등록 완료!");
      onClose();
    } catch (err) {
      console.error(err);
      alert("등록 중 오류 발생");
    }
  };

  return (
    <div style={{ padding: "16px", maxHeight: "80vh", overflowY: "auto" }}>
      <h2 style={{ marginBottom: "12px", fontSize: "18px" }}>📌 업무 등록</h2>

      {/* 상위 업무 제목 */}
      <label>상위 업무 제목</label>
      <input
        placeholder="상위 업무 제목 입력"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{
          width: "100%",
          padding: "8px",
          marginBottom: "12px",
          fontSize: "15px",
        }}
      />

      {/* 담당자 지정 */}
      <label>담당자 지정</label>
      <div style={{ marginBottom: "15px", position: "relative" }}>
        {/* 선택된 담당자 박스 */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
          {assignees.map((id) => {
            const emp = employees.find((e) => e.emp_id === id);
            return (
              <span
                key={id}
                style={{
                  background: "#e0f0ff",
                  padding: "4px 8px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {emp?.name}
                <button
                  onClick={() => setAssignees(assignees.filter((x) => x !== id))}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>

        {/* 검색 입력칸 */}
        <input
          type="text"
          placeholder="담당자 검색"
          value={assigneeInput}
          onChange={(e) => setAssigneeInput(e.target.value)}
          style={{ width: "100%", padding: "8px" }}
        />

        {/* 자동완성 드롭다운 */}
        {assigneeInput && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "#fff",
              border: "1px solid #ccc",
              borderRadius: "4px",
              maxHeight: "150px",
              overflowY: "auto",
              zIndex: 10,
            }}
          >
            {employees
              .filter((emp) => emp.name.includes(assigneeInput) && !assignees.includes(emp.emp_id))
              .map((emp) => (
                <div
                  key={emp.emp_id}
                  onClick={() => {
                    setAssignees([...assignees, emp.emp_id]);
                    setAssigneeInput("");
                  }}
                  style={{
                    padding: "8px",
                    cursor: "pointer",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  {emp.name}
                </div>
              ))}
          </div>
        )}
      </div>
      <label>시작일</label>
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        style={{ marginBottom: "12px", display: "block" }}
      />
      <label>종료일</label>
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        style={{ marginBottom: "20px", display: "block" }}
      />
      {/* 상위업무 내용 */}
      <label>상위 업무 내용</label>
      <textarea
        placeholder="상위 업무 내용 입력"
        value={description}
        onChange={(e) => {
          setDescription(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = `${e.target.scrollHeight}px`;
        }}
        style={{
          width: "100%",
          padding: "8px",
          marginBottom: "15px",
          resize: "none",
          overflow: "hidden",
          minHeight: "70px",
          fontSize: "15px",
        }}
      />

      {/* 하위업무 목록 */}
      {subtasks.map((sub, subIndex) => (
        <div
          key={subIndex}
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            marginBottom: "12px",
            borderRadius: "5px",
          }}
        >
          <label style={{ fontWeight: "bold" }}>하위 업무</label>
          <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <input
              placeholder="하위 업무 제목"
              value={sub.title}
              onChange={(e) => handleSubtaskChange(subIndex, "title", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSubtask();
                }
              }}
              style={{ flex: 1, padding: "6px", fontSize: "15px" }}
            />
            <input
              type="date"
              value={sub.endDate}
              onChange={(e) => handleSubtaskChange(subIndex, "endDate", e.target.value)}
            />
            <button onClick={() => handleAddSubtask(subIndex)}>➕</button>
            <button onClick={() => handleRemoveSubtask(subIndex)}>➖</button>
          </div>

          {/* 세부업무 목록 */}
          {sub.details.length > 0 ? (
            sub.details.map((d, detailIndex) => (
              <div
                key={detailIndex}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginLeft: "20px",
                  marginBottom: "6px",
                }}
              >
                <span style={{ color: "#777" }}>-</span>
                <input
                  placeholder="세부 업무 제목"
                  value={d.title}
                  onChange={(e) =>
                    handleDetailChange(subIndex, detailIndex, "title", e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSubDetail(subIndex);
                    }
                  }}
                  style={{ flex: 1, padding: "6px", fontSize: "14px" }}
                />
                <input
                  type="date"
                  value={d.endDate}
                  onChange={(e) =>
                    handleDetailChange(subIndex, detailIndex, "endDate", e.target.value)
                  }
                />
                <button onClick={() => handleAddSubDetail(subIndex)}>➕</button>
                <button onClick={() => handleRemoveSubDetail(subIndex, detailIndex)}>➖</button>
              </div>
            ))
          ) : (
            <div style={{ marginLeft: "20px", marginTop: "6px" }}>
              <button onClick={() => handleAddSubDetail(subIndex)}>➕ 세부업무 추가</button>
            </div>
          )}
        </div>
      ))}

      {/* 하위업무 없으면 버튼 표시 */}
      {subtasks.length === 0 && (
        <button onClick={handleAddSubtask} style={{ marginBottom: "15px" }}>
          ➕ 하위업무 추가
        </button>
      )}

      {/* Footer */}
      <div style={{ marginTop: "20px" }}>
        <button onClick={handleSubmit} style={{ marginRight: "10px" }}>
          저장
        </button>
        <button onClick={onClose}>취소</button>
      </div>
    </div>
  );
}
