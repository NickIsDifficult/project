// src/components/tasks/TaskDetailPanel/TaskEditForm.jsx
import { useState } from "react";
import toast from "react-hot-toast";
import Button from "../../common/Button";

/**
 * ✅ TaskEditForm
 * - 업무 수정 폼 (TaskDetailPanel에서 호출)
 * - 저장 시 onSave(formData) 실행
 */
export default function TaskEditForm({ task, employees, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: task.title || "",
    description: task.description || "",
    assignee_id: task.assignee_id || "",
    start_date: task.start_date || "",
    end_date: task.end_date || "",
  });

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    if (form.start_date && form.end_date && form.start_date > form.end_date) {
      toast.error("종료일은 시작일 이후여야 합니다.");
      return;
    }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* 제목 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
          placeholder="업무 제목을 입력하세요"
        />
      </div>

      {/* 설명 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={4}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
          placeholder="업무 내용을 입력하세요"
        />
      </div>

      {/* 담당자 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
        <select
          name="assignee_id"
          value={form.assignee_id}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:ring-1 focus:ring-blue-400"
        >
          <option value="">선택 안 함</option>
          {employees.map(emp => (
            <option key={emp.emp_id} value={emp.emp_id}>
              {emp.name}
            </option>
          ))}
        </select>
      </div>

      {/* 날짜 */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
          <input
            type="date"
            name="start_date"
            value={form.start_date || ""}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
          <input
            type="date"
            name="end_date"
            value={form.end_date || ""}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex gap-3 pt-2">
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
