// src/components/tasks/TaskDetailPanel/TaskEditForm.jsx
import React, { useState } from "react";
import { Button } from "../../common/ButtonProject";

export default function TaskEditForm({ task, employees, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || "",
    assignee_id: task.assignee_id || "",
    start_date: task.start_date || "",
    end_date: task.end_date || "",
  });

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        onSave(form);
      }}
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      <label>
        제목:
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          style={{ width: "100%", marginTop: 4 }}
          required
        />
      </label>

      <label>
        설명:
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={4}
          style={{ width: "100%", marginTop: 4 }}
        />
      </label>

      <label>
        담당자:
        <select
          name="assignee_id"
          value={form.assignee_id}
          onChange={handleChange}
          style={{ width: "100%", marginTop: 4 }}
        >
          <option value="">선택 안 함</option>
          {employees.map(emp => (
            <option key={emp.emp_id} value={emp.emp_id}>
              {emp.name}
            </option>
          ))}
        </select>
      </label>

      <div style={{ display: "flex", gap: 8 }}>
        <label>
          시작일:
          <input
            type="date"
            name="start_date"
            value={form.start_date || ""}
            onChange={handleChange}
          />
        </label>
        <label>
          종료일:
          <input type="date" name="end_date" value={form.end_date || ""} onChange={handleChange} />
        </label>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <Button variant="primary" type="submit">
          💾 저장
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          취소
        </Button>
      </div>
    </form>
  );
}
