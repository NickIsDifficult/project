import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useProjectGlobal } from "../../context/ProjectGlobalContext";
import API from "../../services/api/http";
import { createTask } from "../../services/api/task";
import Button from "../common/Button";

export default function TaskDrawerSection({ onClose }) {
  const { projects, selectedProjectId, parentTaskId, fetchTasksByProject, setOpenDrawer } =
    useProjectGlobal();

  const [projectId, setProjectId] = useState(selectedProjectId || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  /* ----------------------------------------
   * 👥 직원 목록 (자동완성용)
   * ---------------------------------------- */
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState([]);

  const fetchEmployees = async () => {
    try {
      const { data } = await API.get("/auth/lookup/employees"); // ✅ 엔드포인트 가정
      setEmployees(data || []);
    } catch (err) {
      console.error("❌ 직원 목록 로드 실패:", err);
      toast.error("직원 목록을 불러오지 못했습니다.");
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredEmployees([]);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredEmployees(
        employees.filter(
          emp => emp.emp_name?.toLowerCase().includes(term) || String(emp.emp_id).includes(term),
        ),
      );
    }
  }, [searchTerm, employees]);

  /* ----------------------------------------
   * 🧠 캘린더에서 전달된 날짜 자동 반영
   * ---------------------------------------- */
  useEffect(() => {
    const start = localStorage.getItem("newTask_start");
    const end = localStorage.getItem("newTask_end");

    if (start || end) {
      setStartDate(start || "");
      setDueDate(end || "");
      localStorage.removeItem("newTask_start");
      localStorage.removeItem("newTask_end");
    }
  }, []);

  /* ----------------------------------------
   * 🧠 프로젝트 기본값
   * ---------------------------------------- */
  useEffect(() => {
    if (selectedProjectId) setProjectId(selectedProjectId);
  }, [selectedProjectId]);

  /* ----------------------------------------
   * 🧹 Drawer 닫기 및 상태 초기화
   * ---------------------------------------- */
  const handleClose = () => {
    setTitle("");
    setDescription("");
    setAssigneeId("");
    setSearchTerm("");
    setStartDate("");
    setDueDate("");
    setOpenDrawer(false);
    onClose?.();
  };

  /* ----------------------------------------
   * ✅ 업무 등록 처리
   * ---------------------------------------- */
  const handleSubmit = async () => {
    if (!projectId) return toast.error("프로젝트를 선택해주세요.");
    if (!title.trim()) return toast.error("업무 제목을 입력해주세요.");

    try {
      await createTask({
        project_id: projectId,
        parent_task_id: parentTaskId,
        title,
        description,
        assignee_emp_id: assigneeId ? Number(assigneeId) : null,
        start_date: startDate || null,
        due_date: dueDate || null,
      });

      toast.success("📝 새 업무가 등록되었습니다!");
      await fetchTasksByProject(projectId);
      handleClose();
    } catch (err) {
      console.error("❌ 업무 등록 실패:", err);
      toast.error("업무 등록에 실패했습니다.");
    }
  };

  /* ----------------------------------------
   * 🧱 렌더링
   * ---------------------------------------- */
  return (
    <div style={drawerWrapper}>
      <h3 style={{ marginBottom: 4 }}>🆕 새 업무 등록</h3>

      {/* 프로젝트 선택 */}
      <label style={labelStyle}>프로젝트 선택</label>
      <select
        value={projectId}
        onChange={e => setProjectId(Number(e.target.value))}
        style={inputStyle}
      >
        <option value="">-- 프로젝트를 선택하세요 --</option>
        {projects.map(p => (
          <option key={p.project_id} value={p.project_id}>
            {p.project_name}
          </option>
        ))}
      </select>

      {/* 제목 */}
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="업무 제목"
        style={inputStyle}
      />

      {/* 설명 */}
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="업무 설명"
        style={{ ...inputStyle, height: 80 }}
      />

      {/* 담당자 자동완성 */}
      <label style={labelStyle}>담당자 검색</label>
      <input
        type="text"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        placeholder="이름 또는 ID로 검색"
        style={inputStyle}
      />

      {filteredEmployees.length > 0 && (
        <ul style={suggestionList}>
          {filteredEmployees.map(emp => (
            <li
              key={emp.emp_id}
              onClick={() => {
                setAssigneeId(emp.emp_id);
                setSearchTerm(emp.emp_name);
                setFilteredEmployees([]);
              }}
              style={suggestionItem}
            >
              👤 {emp.emp_name} ({emp.emp_id}) — {emp.department_name || "부서 미정"}
            </li>
          ))}
        </ul>
      )}

      {/* 선택된 담당자 */}
      {assigneeId && (
        <div style={{ fontSize: 13, color: "#333", marginTop: -6 }}>
          ✅ 선택됨: {searchTerm} (ID: {assigneeId})
        </div>
      )}

      {/* 일정 */}
      <label style={labelStyle}>시작일</label>
      <input
        type="date"
        value={startDate}
        onChange={e => setStartDate(e.target.value)}
        style={inputStyle}
      />

      <label style={labelStyle}>마감일</label>
      <input
        type="date"
        value={dueDate}
        onChange={e => setDueDate(e.target.value)}
        style={inputStyle}
      />

      {/* 버튼 */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
        <Button onClick={handleClose} variant="secondary">
          취소
        </Button>
        <Button onClick={handleSubmit} variant="primary">
          등록
        </Button>
      </div>
    </div>
  );
}

/* ---------------------- 스타일 ---------------------- */
const drawerWrapper = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: 16,
  width: 380,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const inputStyle = {
  width: "100%",
  border: "1px solid #ccc",
  borderRadius: 6,
  padding: "6px 8px",
  fontSize: 13,
};

const labelStyle = {
  fontSize: 13,
  color: "#555",
  marginTop: 4,
};

const suggestionList = {
  listStyle: "none",
  border: "1px solid #ccc",
  borderRadius: 6,
  maxHeight: 120,
  overflowY: "auto",
  padding: 0,
  marginTop: 4,
};

const suggestionItem = {
  padding: "6px 8px",
  fontSize: 13,
  cursor: "pointer",
  background: "#fff",
  borderBottom: "1px solid #eee",
};
