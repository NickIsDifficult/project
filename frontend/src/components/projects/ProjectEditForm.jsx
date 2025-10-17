import { useState } from "react";
import toast from "react-hot-toast";
import { useProjectGlobal } from "../../context/ProjectGlobalContext";
import { updateProject } from "../../services/api/project";
import Button from "../common/Button";

/**
 * ✅ ProjectEditForm
 * - TaskDetailPanel에서 프로젝트 수정용으로 표시
 * - 저장 시 Drawer 닫기 및 리스트 새로고침 자동 처리
 */
export default function ProjectEditForm({ project, onClose }) {
  const { fetchTasksByProject } = useProjectGlobal();

  const [form, setForm] = useState({
    project_name: project.project_name || "",
    description: project.description || "",
    start_date: project.start_date || "",
    end_date: project.end_date || "",
    status: project.status || "TODO",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.project_name.trim()) {
      toast.error("프로젝트 이름을 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      await updateProject(project.project_id, form);
      toast.success("프로젝트가 수정되었습니다.");
      await fetchTasksByProject(project.project_id);
      onClose?.(); // ✅ Drawer 닫기
    } catch (err) {
      console.error("❌ 프로젝트 수정 실패:", err);
      toast.error("수정 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 16,
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 600 }}>🏗 프로젝트 수정</h2>

      <div>
        <label>프로젝트명</label>
        <input
          type="text"
          name="project_name"
          value={form.project_name}
          onChange={handleChange}
          style={inputStyle}
        />
      </div>

      <div>
        <label>설명</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          style={{ ...inputStyle, minHeight: 80 }}
        />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label>시작일</label>
          <input
            type="date"
            name="start_date"
            value={form.start_date}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>마감일</label>
          <input
            type="date"
            name="end_date"
            value={form.end_date}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label>상태</label>
        <select name="status" value={form.status} onChange={handleChange} style={inputStyle}>
          <option value="TODO">할 일</option>
          <option value="IN_PROGRESS">진행 중</option>
          <option value="REVIEW">검토 중</option>
          <option value="DONE">완료</option>
        </select>
      </div>

      <div style={buttonRow}>
        <Button type="submit" variant="success" disabled={loading}>
          {loading ? "저장 중..." : "저장"}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose}>
          취소
        </Button>
      </div>
    </form>
  );
}

/* ----------------------------- */
/* ✅ 스타일 */
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
