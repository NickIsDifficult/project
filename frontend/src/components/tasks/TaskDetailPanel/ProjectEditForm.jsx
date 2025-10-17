import { useState } from "react";
import toast from "react-hot-toast";
import Button from "../../common/Button";

/**
 * ✅ ProjectEditForm
 * - 프로젝트 수정 폼
 * - 수정 완료 시 onSave(updatedData) 호출
 */
export default function ProjectEditForm({ project, onSave, onClose }) {
  const [form, setForm] = useState({
    title: project.title || project.project_name || "",
    description: project.description || "",
    start_date: project.start_date || "",
    end_date: project.end_date || "",
    status: project.status || "IN_PROGRESS",
    progress: project.progress || 0,
  });

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("프로젝트 제목을 입력해주세요.");
      return;
    }
    if (form.start_date && form.end_date && form.start_date > form.end_date) {
      toast.error("종료일은 시작일 이후여야 합니다.");
      return;
    }

    try {
      await onSave?.(form);
      toast.success("프로젝트 수정 완료!");
      onClose?.();
    } catch (err) {
      console.error("❌ 프로젝트 수정 실패:", err);
      toast.error("수정 중 오류가 발생했습니다.");
    }
  };

  const statuses = [
    { key: "PLANNING", label: "🗓️ 계획중" },
    { key: "IN_PROGRESS", label: "🚧 진행중" },
    { key: "DONE", label: "✅ 완료" },
    { key: "ON_HOLD", label: "⏸️ 보류" },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* 제목 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-blue-400"
          required
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
          className="w-full border border-gray-300 rounded px-3 py-2 resize-none focus:ring-1 focus:ring-blue-400"
        />
      </div>

      {/* 기간 */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
          <input
            type="date"
            name="start_date"
            value={form.start_date || ""}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
          <input
            type="date"
            name="end_date"
            value={form.end_date || ""}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
      </div>

      {/* 상태 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
        >
          {statuses.map(s => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* 진행률 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          진행률: {form.progress}%
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          name="progress"
          value={form.progress}
          onChange={e => setForm(prev => ({ ...prev, progress: Number(e.target.value) }))}
          className="w-full accent-blue-500"
        />
      </div>

      {/* 버튼 */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" variant="primary">
          💾 저장
        </Button>
        <Button type="button" variant="secondary" onClick={onClose}>
          취소
        </Button>
      </div>
    </form>
  );
}
