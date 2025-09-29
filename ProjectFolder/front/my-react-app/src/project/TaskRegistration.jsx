import React, { useState } from "react";
import { createTask, createSubtask, createSubDetail } from "./api";

export default function TaskRegistration({ onClose, refreshTasks }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subtasks, setSubtasks] = useState([
    { title: "", startDate: "", endDate: "", details: [{ title: "", startDate: "", endDate: "" }] }
  ]);

  // 하위업무 변경
  const handleSubtaskChange = (index, field, value) => {
    const newSubs = [...subtasks];
    newSubs[index][field] = value;
    setSubtasks(newSubs);
  };

  // 세부업무 변경
  const handleDetailChange = (subIndex, detailIndex, field, value) => {
    const newSubs = [...subtasks];
    newSubs[subIndex].details[detailIndex][field] = value;
    setSubtasks(newSubs);
  };

  const handleAddSubtask = () => {
    setSubtasks([
      ...subtasks,
      { title: "", startDate: "", endDate: "", details: [{ title: "", startDate: "", endDate: "" }] }
    ]);
  };

  const handleAddSubDetail = (subIndex) => {
    const newSubs = [...subtasks];
    newSubs[subIndex].details.push({ title: "", startDate: "", endDate: "" });
    setSubtasks(newSubs);
  };

  // 최종 등록
  const handleSubmit = async () => {
    if (!title.trim()) return alert("상위 업무 제목을 입력하세요.");

    try {
      const task = await createTask(title, description);

      for (const sub of subtasks) {
        if (!sub.title.trim()) continue;
        const subtask = await createSubtask(task.id, sub.title, sub.startDate, sub.endDate);

        for (const detail of sub.details) {
          if (!detail.title.trim()) continue;
          await createSubDetail(subtask.id, detail.title, detail.startDate, detail.endDate);
        }
      }

      alert("업무 등록 완료!");
      refreshTasks();
      onClose();
    } catch (err) {
      console.error(err);
      alert("등록 중 오류 발생");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "#fff",
        padding: "30px",
        borderRadius: "10px",
        border: "1px solid #ddd",
        boxShadow: "0px 4px 15px rgba(0,0,0,0.15)",
        width: "600px",
        zIndex: 10000,
        fontFamily: "Arial, sans-serif"
      }}
    >
      <h2 style={{ marginBottom: "15px", textAlign: "center", color: "#333" }}>📌 업무 등록</h2>

      {/* 상위업무 */}
      <input
        placeholder="상위 업무 제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{
          display: "block",
          marginBottom: "12px",
          width: "100%",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "6px"
        }}
      />
      <textarea
        placeholder="상위 업무 내용"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{
          display: "block",
          marginBottom: "20px",
          width: "100%",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "6px",
          resize: "none",
          height: "80px"
        }}
      />

      {/* 하위업무 + 세부업무 */}
      {subtasks.map((sub, subIndex) => (
        <div
          key={subIndex}
          style={{
            marginBottom: "15px",
            padding: "10px",
            border: "1px solid #eee",
            borderRadius: "8px",
            background: "#fafafa"
          }}
        >
          <input
            placeholder="하위 업무 제목"
            value={sub.title}
            onChange={(e) => handleSubtaskChange(subIndex, "title", e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddSubtask();
              }
            }}
            style={{
              display: "block",
              marginBottom: "8px",
              width: "80%",
              padding: "8px",
              border: "1px solid #bbb",
              borderRadius: "6px"
            }}
          />

          {/* 날짜 */}
          <div style={{ marginBottom: "10px" }}>
            <input
              type="date"
              value={sub.startDate}
              onChange={(e) => handleSubtaskChange(subIndex, "startDate", e.target.value)}
            />{" "}
            ~{" "}
            <input
              type="date"
              value={sub.endDate}
              onChange={(e) => handleSubtaskChange(subIndex, "endDate", e.target.value)}
            />
          </div>

          {sub.details.map((d, detailIndex) => (
            <div
              key={detailIndex}
              style={{
                marginLeft: "20px",
                marginTop: "10px",
                padding: "8px",
                borderLeft: "3px solid #ddd"
              }}
            >
              <input
                placeholder="세부 업무 제목"
                value={d.title}
                onChange={(e) =>
                  handleDetailChange(subIndex, detailIndex, "title", e.target.value)
                }
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSubDetail(subIndex);
                  }
                }}
                style={{
                  display: "block",
                  marginBottom: "8px",
                  width: "70%",
                  padding: "7px",
                  border: "1px solid #bbb",
                  borderRadius: "6px"
                }}
              />

              <div>
                <input
                  type="date"
                  value={d.startDate}
                  onChange={(e) =>
                    handleDetailChange(subIndex, detailIndex, "startDate", e.target.value)
                  }
                />{" "}
                ~{" "}
                <input
                  type="date"
                  value={d.endDate}
                  onChange={(e) =>
                    handleDetailChange(subIndex, detailIndex, "endDate", e.target.value)
                  }
                />
              </div>
            </div>
          ))}
          <button
            onClick={() => handleAddSubDetail(subIndex)}
            style={{
              marginTop: "8px",
              background: "#eee",
              border: "none",
              padding: "6px 12px",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            ➕ 세부 업무 추가
          </button>
        </div>
      ))}

      <button
        onClick={handleAddSubtask}
        style={{
          background: "#ddd",
          border: "none",
          padding: "8px 14px",
          borderRadius: "6px",
          cursor: "pointer"
        }}
      >
        ➕ 하위 업무 추가
      </button>

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <button
          onClick={handleSubmit}
          style={{
            background: "#4CAF50",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            borderRadius: "6px",
            cursor: "pointer",
            marginRight: "10px"
          }}
        >
          ✅ 등록 완료
        </button>
        <button
          onClick={onClose}
          style={{
            background: "#f44336",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          ❌ 취소
        </button>
      </div>
    </div>
  );
}
