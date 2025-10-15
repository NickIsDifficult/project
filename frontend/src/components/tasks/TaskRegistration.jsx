// src/components/tasks/TaskRegistration.jsx
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getEmployees } from "../../services/api/employee";
import { createTask, getTasks } from "../../services/api/task";
import Button from "../common/Button";

export default function TaskRegistration({ projectId, parentTaskId = null, onClose }) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]); // ✅ 상위 업무 선택용

  const [form, setForm] = useState({
    title: "",
    description: "",
    assignee_emp_id: "",
    start_date: "",
    due_date: "",
    priority: "MEDIUM",
    status: "TODO",
    parent_task_id: parentTaskId ? String(parentTaskId) : "",
  });

  // ✅ 담당자 및 상위업무 목록 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empData, taskData] = await Promise.all([getEmployees(), getTasks(projectId)]);
        setEmployees(empData);
        setTasks(taskData);
      } catch (err) {
        console.error("데이터 로드 실패:", err);
      }
    };
    fetchData();
  }, [projectId]);

  // ✅ 입력값 변경
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // ✅ 등록 처리
  const handleSubmit = async e => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("업무 제목을 입력해주세요.");
      return;
    }

    const payload = {
      project_id: Number(projectId),
      title: form.title.trim(),
      description: form.description || null,
      assignee_emp_id: form.assignee_emp_id ? Number(form.assignee_emp_id) : null,
      parent_task_id: form.parent_task_id ? Number(form.parent_task_id) : null,
      start_date: form.start_date ? form.start_date : null,
      due_date: form.due_date ? form.due_date : null,
      priority: form.priority?.toUpperCase?.() || "MEDIUM",
      status: form.status?.toUpperCase?.() || "TODO",
    };

    console.log("📤 전송 payload:", payload);

    try {
      setLoading(true);
      await createTask(projectId, payload);
      toast.success("새 업무가 등록되었습니다.");
      onClose();
    } catch (err) {
      console.error("업무 등록 실패:", err);
      toast.error(err.message || "업무 등록 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: "8px 16px" }}>
      {/* --------------------------- */}
      {/* 기본 정보 */}
      {/* --------------------------- */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>제목 *</label>
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="업무 제목을 입력하세요"
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>설명</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="업무 설명을 입력하세요"
          style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
        />
      </div>

      {/* --------------------------- */}
      {/* 상위 업무 지정 */}
      {/* --------------------------- */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>상위 업무</label>
        <select
          name="parent_task_id"
          value={form.parent_task_id}
          onChange={handleChange}
          style={inputStyle}
          disabled={!!parentTaskId} // ✅ 이미 상위 업무 지정된 경우 수정 불가
        >
          <option value="">(없음 - 최상위)</option>
          {tasks.map(t => (
            <option key={t.task_id} value={t.task_id}>
              {t.title}
            </option>
          ))}
        </select>
      </div>

      {/* --------------------------- */}
      {/* 담당자 / 우선순위 */}
      {/* --------------------------- */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>담당자</label>
          <select
            name="assignee_emp_id"
            value={form.assignee_emp_id}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="">선택 안 함</option>
            {employees.map(emp => (
              <option key={emp.emp_id} value={emp.emp_id}>
                {emp.name} ({emp.department_name})
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <label style={labelStyle}>우선순위</label>
          <select name="priority" value={form.priority} onChange={handleChange} style={inputStyle}>
            <option value="LOW">낮음</option>
            <option value="MEDIUM">보통</option>
            <option value="HIGH">높음</option>
            <option value="URGENT">긴급</option>
          </select>
        </div>
      </div>

      {/* --------------------------- */}
      {/* 일정 */}
      {/* --------------------------- */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>시작일</label>
          <input
            type="date"
            name="start_date"
            value={form.start_date}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        <div style={{ flex: 1 }}>
          <label style={labelStyle}>마감일</label>
          <input
            type="date"
            name="due_date"
            value={form.due_date}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>
      </div>

      {/* --------------------------- */}
      {/* 하단 버튼 */}
      {/* --------------------------- */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 24,
        }}
      >
        <Button variant="secondary" type="button" onClick={onClose}>
          취소
        </Button>
        <Button variant="success" type="submit" disabled={loading}>
          {loading ? "등록 중..." : "등록"}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------
// 스타일
// ---------------------------
const labelStyle = {
  display: "block",
  fontSize: 14,
  fontWeight: 500,
  marginBottom: 6,
  color: "#333",
};

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: 14,
  outline: "none",
};
