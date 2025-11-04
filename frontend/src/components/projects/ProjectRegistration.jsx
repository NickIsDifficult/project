// src/components/projects/ProjectRegistration.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useProjectGlobal } from "../../context/ProjectGlobalContext";
import { useProjectMembers } from "../../hooks/useProjectMembers";
import api from "../../services/api/http";
import AssigneeSelector from "./AssigneeSelector";
import TaskNode from "./TaskNode";

// ✅ 고유 임시 ID 생성기
const generateTempId = () => `tmp_${crypto.randomUUID?.() ?? Date.now()}`;

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

  const focusIdRef = useRef(null); // ✅ 새로 추가된 업무에 포커스 이동 관리
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

  // ✅ Root 업무 추가 (Enter 또는 버튼 클릭 시)
  const handleAddRootTask = useCallback(() => {
    const newTask = {
      task_id: null,
      temp_id: generateTempId(),
      title: "",
      start_date: "",
      end_date: "",
      assignees: [],
      assignee_ids: [],
      subtask: [],
      attachments: [],
      isEditing: true,
    };
    focusIdRef.current = newTask.temp_id; // ✅ 추가된 업무 자동 포커스 대상
    setTasks(prev => [...prev, newTask]);
  }, []);

  // ✅ 업무 업데이트 (root 기준)
  const handleTaskUpdate = useCallback((i, updated) => {
    setTasks(prev => {
      const copy = [...prev];
      if (updated === null) copy.splice(i, 1);
      else copy[i] = updated;
      return copy;
    });
  }, []);

  // ✅ 하위업무 직렬화 (재귀)
  const serializeTasks = (list = []) =>
    (list || []).map(t => ({
      title: (t.title || "").trim(),
      start_date: t.start_date?.trim?.() ? t.start_date : null,
      end_date: t.end_date?.trim?.() ? t.end_date : null,
      priority: t.priority || "MEDIUM",
      progress: t.progress ?? 0,
      assignee_ids: Array.isArray(t.assignee_ids)
        ? t.assignee_ids.map(Number)
        : Array.isArray(t.assignees)
          ? t.assignees.map(a => (typeof a === "object" ? Number(a.emp_id || a.id) : Number(a)))
          : [],
      subtask: serializeTasks(t.subtask || []),
    }));

  // ✅ 유효성 검사
  const validateForm = useCallback(() => {
    if (!projectName.trim()) return toast.error("프로젝트 이름을 입력하세요.");
    if (startDate && endDate && new Date(startDate) > new Date(endDate))
      return toast.error("시작일은 종료일보다 이전이어야 합니다.");

    const checkTasks = list => {
      for (const t of list) {
        if (!t.title.trim()) return false;
        if (t.start_date && t.end_date && new Date(t.start_date) > new Date(t.end_date))
          return false;
        if (t.subtask?.length && !checkTasks(t.subtask)) return false;
      }
      return true;
    };

    if (!checkTasks(tasks)) {
      toast.error("모든 업무의 제목과 날짜를 확인하세요.");
      return false;
    }
    return true;
  }, [projectName, startDate, endDate, tasks]);

  // ✅ 취소 확인
  const hasChanges = useMemo(
    () =>
      projectName ||
      description ||
      startDate ||
      endDate ||
      tasks.length > 0 ||
      attachments.length > 0,
    [projectName, description, startDate, endDate, tasks, attachments],
  );

  const handleCancel = () => {
    if (hasChanges && !window.confirm("작성 중인 내용이 있습니다. 정말 취소하시겠습니까?")) return;
    onClose?.();
  };

  // ✅ 저장
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
      tasks: serializeTasks(tasks),
    };

    console.log("📦 전송 Payload:", payload);

    try {
      const res = await api.post("/projects/full-create", payload);
      const pid = res.data.project_id;

      // 첨부파일 업로드
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
      await fetchAllProjects();
      setUiState(prev => ({ ...prev, drawer: { ...prev.drawer, project: false } }));
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

      {/* 업무 리스트 */}
      <div style={{ marginTop: 20 }}>
        <h3>📋 업무 목록</h3>
        {tasks.map((t, i) => (
          <TaskNode
            key={t.task_id ?? t.temp_id ?? `root-${i}`}
            task={t}
            employees={employees}
            onUpdate={u => handleTaskUpdate(i, u)}
            depth={0}
            parentTask={null}
            onAddSibling={(parent, current, newTask) => {
              // ✅ 기존 형제 추가 코드 유지
              setTasks(prev => {
                let clone = structuredClone(prev);
                if (!parent) {
                  const idx = clone.findIndex(tt => tt.temp_id === current.temp_id);
                  if (idx >= 0) clone.splice(idx + 1, 0, newTask);
                  else clone.push(newTask);
                } else {
                  const insertSibling = list =>
                    list.map(t =>
                      t.temp_id === parent.temp_id
                        ? {
                            ...t,
                            subtask: (() => {
                              const newSubs = [...t.subtask];
                              const idx = newSubs.findIndex(st => st.temp_id === current.temp_id);
                              if (idx >= 0) newSubs.splice(idx + 1, 0, newTask);
                              else newSubs.push(newTask);
                              return newSubs;
                            })(),
                          }
                        : { ...t, subtask: t.subtask ? insertSibling(t.subtask) : [] },
                    );
                  clone = insertSibling(clone);
                }
                return clone;
              });
            }}
            // ✅ 삭제 처리
            onDelete={(parent, current, { focusIdRef, triggerFromKeyboard }) => {
              setTasks(prev => {
                const clone = structuredClone(prev);

                // ✅ 삭제 후 포커스 대상 찾기
                const findFocusTarget = (list, parent) => {
                  for (let i = 0; i < list.length; i++) {
                    if (list[i].temp_id === current.temp_id) {
                      if (i > 0) return list[i - 1].temp_id; // 위 형제
                      if (i < list.length - 1) return list[i + 1].temp_id; // 아래 형제
                      return parent?.temp_id ?? null; // 부모
                    }
                    if (list[i].subtask?.length) {
                      const found = findFocusTarget(list[i].subtask, list[i]);
                      if (found) return found;
                    }
                  }
                  return null;
                };

                const focusTarget = findFocusTarget(clone, null);

                // ✅ 실제 삭제 수행
                const removeTask = list =>
                  list.filter(t => {
                    if (t.temp_id === current.temp_id) return false;
                    if (t.subtask?.length) t.subtask = removeTask(t.subtask);
                    return true;
                  });

                const updated = removeTask(clone);

                // ✅ 삭제 후 포커스 지정 (렌더 이후 적용 보장)
                if (focusTarget && focusIdRef) {
                  setTimeout(() => {
                    focusIdRef.current = focusTarget;
                  }, 50); // 🕐 약간의 지연 후 포커스 타겟 전달
                }

                return updated;
              });
            }}
            isEditing={true}
            focusIdRef={focusIdRef}
            showDetailButton={false}
          />
        ))}

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
