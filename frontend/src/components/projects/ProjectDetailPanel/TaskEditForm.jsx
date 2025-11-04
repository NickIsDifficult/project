import { useState } from "react";
import toast from "react-hot-toast";

/**
 * ✅ TaskEditForm (인라인 스타일 + Context 호환)
 * - ProjectDetailPanel(TaskInfoView)에서 사용
 * - 다중 담당자 구조 및 유효성 검사 강화
 */
export default function TaskEditForm({ task, employees = [], onSave, onCancel }) {
  const [form, setForm] = useState({
    title: task.title || task.task_name || "",
    description: task.description || "",
    assignees:
      task.assignees || task.assignee_ids || (task.assignee_emp_id ? [task.assignee_emp_id] : []),
    start_date: task.start_date || task.due_date || "",
    end_date: task.end_date || task.due_date || "",
  });

  const [saving, setSaving] = useState(false);

  /* -----------------------------
   * 🔹 입력 핸들러
   * ----------------------------- */
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAssigneeToggle = id => {
    setForm(prev => {
      const ids = new Set(prev.assignees);
      ids.has(id) ? ids.delete(id) : ids.add(id);
      return { ...prev, assignees: Array.from(ids) };
    });
  };

  /* -----------------------------
   * 🔹 저장 처리
   * ----------------------------- */
  const handleSubmit = async e => {
    e.preventDefault();

    if (!form.title.trim()) return toast.error("제목을 입력해주세요.");
    if (form.start_date && form.end_date && form.start_date > form.end_date)
      return toast.error("종료일은 시작일 이후여야 합니다.");

    try {
      setSaving(true);
      const payload = {
        title: form.title,
        description: form.description,
        assignee_ids: form.assignees.map(Number),
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      };
      await onSave(payload);
      toast.success("업무가 수정되었습니다.");
    } catch (err) {
      console.error("❌ 업무 수정 실패:", err);
      toast.error("업무 수정 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  /* -----------------------------
   * 🔹 렌더링
   * ----------------------------- */
  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 제목 */}
      <div>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>제목</label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          required
          placeholder="업무 제목을 입력하세요"
          style={{
            width: "100%",
            border: "1px solid #ccc",
            borderRadius: 6,
            padding: "8px 10px",
            fontSize: 14,
          }}
        />
      </div>

      {/* 설명 */}
      <div>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>설명</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={4}
          placeholder="업무 내용을 입력하세요"
          style={{
            width: "100%",
            border: "1px solid #ccc",
            borderRadius: 6,
            padding: "8px 10px",
            fontSize: 14,
            resize: "vertical",
          }}
        />
      </div>

      {/* 담당자 */}
      <div>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>담당자</label>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: 6,
            background: "#f9f9f9",
          }}
        >
          {employees.map(emp => {
            const id = Number(emp.emp_id);
            const selected = form.assignees.includes(id);
            return (
              <button
                type="button"
                key={id}
                onClick={() => handleAssigneeToggle(id)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 16,
                  cursor: "pointer",
                  border: selected ? "1px solid #1976d2" : "1px solid #ccc",
                  background: selected ? "#1976d2" : "white",
                  color: selected ? "white" : "#333",
                  fontSize: 13,
                }}
              >
                {emp.name}
              </button>
            );
          })}
          {employees.length === 0 && (
            <span style={{ color: "#999", fontSize: 13 }}>등록된 직원이 없습니다.</span>
          )}
        </div>
      </div>

      {/* 날짜 */}
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>시작일</label>
          <input
            type="date"
            name="start_date"
            value={form.start_date || ""}
            onChange={handleChange}
            style={{
              width: "100%",
              border: "1px solid #ccc",
              borderRadius: 6,
              padding: "6px 8px",
              fontSize: 14,
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>종료일</label>
          <input
            type="date"
            name="end_date"
            value={form.end_date || ""}
            onChange={handleChange}
            style={{
              width: "100%",
              border: "1px solid #ccc",
              borderRadius: 6,
              padding: "6px 8px",
              fontSize: 14,
            }}
          />
        </div>
      </div>

      {/* 버튼 */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            background: saving ? "#90caf9" : "#1976d2",
            color: "white",
            border: "none",
            borderRadius: 6,
            padding: "8px 14px",
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          💾 저장
        </button>
        <button
          type="button"
          onClick={onCancel}
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
      </div>
    </form>
  );
}
