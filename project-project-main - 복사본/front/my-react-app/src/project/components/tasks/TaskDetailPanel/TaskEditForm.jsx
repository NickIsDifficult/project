// src/components/tasks/TaskDetailPanel/TaskEditForm.jsx
import React, { useState } from "react";
import { Button } from "../../common/Button";

export default function TaskEditForm({ task, employees, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: task.title || "",
    description: task.description || "",
    assignee_emp_id: task.assignee_emp_id || "",
    start_date: task.start_date || "",
    due_date: task.due_date || "",
    progress: task.progress ?? 0,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    const parsedValue =
      ["assignee_emp_id", "progress"].includes(name) && value !== "" ? parseInt(value, 10) : value;
    setForm(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="업무 제목"
        style={{
          fontSize: "18px",
          fontWeight: "bold",
          border: "1px solid #ccc",
          borderRadius: 6,
          padding: "4px 6px",
          width: "100%",
          marginBottom: 8,
        }}
      />

      <textarea
        name="description"
        value={form.description}
        onChange={handleChange}
        rows={4}
        placeholder="업무 설명"
        style={{
          width: "100%",
          border: "1px solid #ccc",
          borderRadius: 6,
          padding: 8,
          marginBottom: 10,
        }}
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <div>
          <label>시작일</label>
          <input type="date" name="start_date" value={form.start_date} onChange={handleChange} />
        </div>
        <div>
          <label>마감일</label>
          <input type="date" name="due_date" value={form.due_date} onChange={handleChange} />
        </div>
      </div>

      <div>
        <label>담당자:</label>
        <select
          name="assignee_emp_id"
          value={form.assignee_emp_id}
          onChange={handleChange}
          style={{ marginLeft: 8 }}
        >
          <option value="">미지정</option>
          {employees.map(emp => (
            <option key={emp.emp_id} value={emp.emp_id}>
              {emp.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: 12 }}>
        <label>진행률: </label>
        <input
          type="range"
          name="progress"
          min="0"
          max="100"
          value={form.progress}
          onChange={handleChange}
          style={{ width: "70%", marginLeft: 8 }}
        />
        <span style={{ marginLeft: 6 }}>{form.progress}%</span>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <Button variant="primary" onClick={handleSubmit} disabled={saving}>
          {saving ? "저장 중..." : "저장"}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          취소
        </Button>
      </div>
    </div>
  );
}
