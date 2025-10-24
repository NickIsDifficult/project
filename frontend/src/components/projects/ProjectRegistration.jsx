// src/components/projects/ProjectRegistration.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useProjectGlobal } from "../../context/ProjectGlobalContext";
import { useProjectMembers } from "../../hooks/useProjectMembers";
import api from "../../services/api/http";
import AssigneeSelector from "./AssigneeSelector";
import TaskNode from "./TaskNode";

export default function ProjectRegistration({ onClose }) {
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [mainAssignees, setMainAssignees] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [priority, setPriority] = useState("MEDIUM");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tasks, setTasks] = useState([]);
  const [saving, setSaving] = useState(false);

  const { selectedProjectId, fetchAllProjects, setUiState } = useProjectGlobal();
  const { members, loading } = useProjectMembers(selectedProjectId);
  const fileInputRef = useRef(null);

  // ✅ 직원 목록 로드
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = selectedProjectId ? !loading && members : await api.get("/employees");
        setEmployees(selectedProjectId ? members : res.data);
      } catch (err) {
        console.error("❌ 직원 목록 실패:", err);
      }
    };
    fetchEmployees();
  }, [selectedProjectId, members, loading]);

  // ✅ 파일 핸들러
  const handleFileChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("10MB 이하의 파일만 업로드할 수 있습니다.");
      return;
    }
    setAttachments(prev => [...prev, file]);
  };
  const handleFileDelete = i => setAttachments(prev => prev.filter((_, idx) => idx !== i));

  // ✅ 업무 관리
  const handleAddRootTask = () =>
    setTasks(prev => [
      ...prev,
      {
        id: Date.now(),
        title: "",
        startDate: "",
        endDate: "",
        assignees: [],
        children: [],
      },
    ]);

  const handleTaskUpdate = useCallback((i, updated) => {
    setTasks(prev => {
      const copy = [...prev];
      if (updated === null) copy.splice(i, 1);
      else copy[i] = updated;
      return copy;
    });
  }, []);

  // ✅ 하위업무 재귀 직렬화 함수
  const serializeTasks = (list = []) =>
    list.map(t => ({
      title: t.title,
      start_date: t.startDate || null,
      due_date: t.endDate || null,
      priority: "MEDIUM",
      progress: 0,
      assignee_ids: Array.isArray(t.assignees) ? t.assignees : [],
      subtasks: serializeTasks(t.children || []), // ✅ 재귀 호출
    }));

  // ✅ 유효성 검사
  const validateForm = useCallback(() => {
    if (!projectName.trim()) return toast.error("프로젝트 이름을 입력하세요.");
    if (startDate && endDate && new Date(startDate) > new Date(endDate))
      return toast.error("시작일은 종료일보다 이전이어야 합니다.");

    for (const t of tasks) {
      if (!t.title.trim()) return toast.error("모든 업무에 제목을 입력하세요.");
      if (t.startDate && t.endDate && new Date(t.startDate) > new Date(t.endDate))
        return toast.error("하위 업무의 시작일은 종료일보다 이전이어야 합니다.");
    }
    return true;
  }, [projectName, startDate, endDate, tasks]);

  // ✅ 취소 시 확인
  const hasChanges = useMemo(() => {
    return (
      projectName ||
      description ||
      startDate ||
      endDate ||
      tasks.length > 0 ||
      attachments.length > 0
    );
  }, [projectName, description, startDate, endDate, tasks, attachments]);

  const handleCancel = () => {
    if (hasChanges && !window.confirm("작성 중인 내용이 있습니다. 정말 취소하시겠습니까?")) return;
    onClose?.();
  };

  // ✅ 등록 + 자동 새로고침 + Drawer 닫기
  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSaving(true);

    const payload = {
      project_name: projectName,
      description,
      start_date: startDate || null,
      end_date: endDate || null,
      status: "PLANNED",
      main_assignees: mainAssignees,
      tasks: serializeTasks(tasks), // ✅ 재귀 적용
    };

    try {
      const res = await api.post("/projects/full-create", payload);
      const pid = res.data.project_id;

      // 첨부파일 업로드 (병렬)
      if (attachments.length) {
        await Promise.all(
          attachments.map(f => {
            const fd = new FormData();
            fd.append("file", f);
            return api.post(`/projects/${pid}/attachments`, fd, {
              headers: { "Content-Type": "multipart/form-data" },
            });
          }),
        );
      }

      toast.success("✅ 프로젝트가 등록되었습니다!");

      // 🔄 전체 목록 새로고침
      await fetchAllProjects();

      // 🚪 Drawer 닫기
      setUiState(prev => ({
        ...prev,
        drawer: { ...prev.drawer, project: false },
      }));

      onClose?.();
    } catch (err) {
      console.error("❌ 등록 실패:", err);
      toast.error(`등록 중 오류: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
      <h2>📌 프로젝트 등록</h2>

      <label>프로젝트 이름</label>
      <input
        value={projectName}
        onChange={e => setProjectName(e.target.value)}
        style={{ width: "100%", marginBottom: 12 }}
      />

      <button
        onClick={() => setShowDetails(!showDetails)}
        style={{
          background: showDetails ? "#555" : "#1976d2",
          color: "white",
          border: "none",
          borderRadius: 6,
          padding: "8px 12px",
          cursor: "pointer",
          marginBottom: 12,
        }}
      >
        {showDetails ? "▲ 상세입력 닫기" : "▼ 상세입력 보기"}
      </button>

      {showDetails && (
        <div style={{ background: "#f9f9f9", padding: 12, borderRadius: 8 }}>
          <label>시작일</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            style={{ width: "100%", marginBottom: 8 }}
          />
          <label>종료일</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            style={{ width: "100%", marginBottom: 8 }}
          />
          <label>우선순위</label>
          <select
            value={priority}
            onChange={e => setPriority(e.target.value)}
            style={{ width: "100%" }}
          >
            <option value="LOW">낮음</option>
            <option value="MEDIUM">보통</option>
            <option value="HIGH">높음</option>
            <option value="URGENT">긴급</option>
          </select>

          <div style={{ marginTop: 12 }}>
            <strong>업무 담당자:</strong>
            <AssigneeSelector
              employees={employees}
              selected={mainAssignees}
              setSelected={setMainAssignees}
            />
          </div>
        </div>
      )}

      <label style={{ marginTop: 12 }}>프로젝트 설명</label>
      <textarea
        placeholder="프로젝트 설명을 입력하세요..."
        value={description}
        onChange={e => setDescription(e.target.value)}
        style={{
          width: "100%",
          minHeight: 80,
          padding: 8,
          borderRadius: 6,
          border: "1px solid #ccc",
          resize: "none",
        }}
      />

      {/* 첨부파일 */}
      <div style={{ marginTop: 20 }}>
        <h3>📎 첨부파일</h3>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: 6,
            padding: "8px 12px",
            cursor: "pointer",
          }}
        >
          📤 첨부파일 추가
        </button>
        {attachments.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
            {attachments.map((file, index) => (
              <li
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid #eee",
                  padding: "4px 0",
                }}
              >
                <span>{file.name}</span>
                <button
                  onClick={() => handleFileDelete(index)}
                  style={{
                    background: "crimson",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    padding: "4px 8px",
                    cursor: "pointer",
                  }}
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 하위 업무 */}
      <div style={{ marginTop: 20 }}>
        <h3>📋 하위 업무</h3>
        {tasks.map((t, i) => (
          <TaskNode
            key={t.id}
            task={t}
            employees={employees}
            onUpdate={u => handleTaskUpdate(i, u)}
            depth={0}
            onAddSibling={handleAddRootTask}
          />
        ))}
        {tasks.length === 0 && (
          <button
            onClick={handleAddRootTask}
            style={{
              marginTop: 10,
              background: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            ➕ 업무 추가
          </button>
        )}
      </div>

      {/* 하단 버튼 */}
      <div
        style={{
          paddingTop: 12,
          borderTop: "1px solid #eee",
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 16,
        }}
      >
        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            background: saving ? "#999" : "#1976d2",
            color: "white",
            border: "none",
            borderRadius: 6,
            padding: "8px 12px",
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "저장 중..." : "저장"}
        </button>
        <button
          onClick={handleCancel}
          style={{
            background: "#eee",
            border: "1px solid #ccc",
            borderRadius: 6,
            padding: "8px 12px",
            cursor: "pointer",
          }}
        >
          취소
        </button>
      </div>
    </div>
  );
}
