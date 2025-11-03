import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ProjectDetailProvider } from "../../../context/ProjectDetailContext";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import { getEmployees } from "../../../services/api/employee";
import { deleteProject, getProject, updateProject } from "../../../services/api/project";
import TaskNode from "../TaskNode"; // ✅ 외부 TaskNode 가져오기
import TaskDetailPanel from "./TaskInfoView";

const transformTaskFromApi = (t) => {
  // 안전 복사
  const task = { ...t };

  // 1) assignees 필드 보강 (UI가 assignees 배열을 읽음)
  // - 서버가 assignee_ids 로 주면 그걸 사용
  // - 서버가 task_member/employee 구조로 주면 emp_id 추출
  if (Array.isArray(task.assignees)) {
    // already present
  } else if (Array.isArray(task.assignee_ids)) {
    task.assignees = task.assignee_ids.map(id => Number(id));
  } else if (Array.isArray(task.task_member) || Array.isArray(task.taskMembers)) {
    const members = task.task_member || task.taskMembers || [];
    task.assignees = members.map(m => Number(m.emp_id ?? m.empId ?? m.emp_id));
  } else {
    task.assignees = [];
  }

  // 2) 날짜 필드 보강 — UI는 "" 로 렌더링하므로 null -> "" 로 변환
  task.start_date =
  task.start_date ??
  task.startDate ??
  task.start_date ??
  task.start_at ??
  "";
task.end_date =
  task.end_date ??
  task.endDate ??
  task.due_date ??
  task.end_at ??
  "";

  // 3) ensure attachments & subtask arrays exist
  task.attachments = Array.isArray(task.attachments) ? task.attachments : [];
  task.subtask = Array.isArray(task.subtask) ? task.subtask.map(transformTaskFromApi) : [];

  return task;
};

const transformProject = (p) => {
  const proj = { ...p };
  const tasks = Array.isArray(proj.task) ? proj.task : [];
  proj.task = tasks.map(transformTaskFromApi);
  return proj;
};
/* =========================================
 ✅ 담당자 선택 컴포넌트
========================================= */
// ✅ 공통: 빈 문자열 날짜 → null
const normalizeDate = v => (v === "" || v === undefined ? null : v);
function generateNextTaskId(tasks = []) {
  let maxId = 0;
  const traverse = arr => {
    for (const t of arr) {
      if (t.task_id && Number(t.task_id) > maxId) maxId = Number(t.task_id);
      if (t.subtask?.length) traverse(t.subtask);
    }
  };
  traverse(tasks);
  return maxId + 1;
}
// ✅ 태스크/하위태스크 재귀 정규화
const normalizeTask = (t, projectId) => {
  const safe = { ...t };

  // ✅ 숫자 변환 보강
  if (safe.task_id != null) safe.task_id = Number(safe.task_id);
  safe.project_id = Number(safe.project_id ?? projectId);

  // 날짜
  safe.start_date = normalizeDate(safe.start_date);
  safe.end_date = normalizeDate(safe.end_date);
  safe.due_date = normalizeDate(safe.due_date);

  // 기본값 보강
  if (safe.status == null) safe.status = "PLANNED";
  if (safe.priority == null) safe.priority = "MEDIUM";
  if (safe.progress == null) safe.progress = 0;

  // ✅ 담당자 배열 숫자 변환
  if (!Array.isArray(safe.assignee_ids)) {
    safe.assignee_ids = Array.isArray(safe.assignees)
      ? safe.assignees.map(a => Number(a))
      : [];
  } else {
    safe.assignee_ids = safe.assignee_ids.map(a => Number(a));
  }
  delete safe.assignees;

  // 첨부파일 보정
  if (!Array.isArray(safe.attachments)) safe.attachments = [];

  // ✅ 하위업무 재귀 호출
  safe.subtask = (safe.subtask || []).map(st => normalizeTask(st, projectId));

  return safe;
};

// ✅ 프로젝트 저장용 정규화
const normalizeProjectForSave = (project, fallbackProjectId) => {
  const pid = Number(project?.project_id ?? fallbackProjectId);
  const safe = { ...project, project_id: pid };

  safe.start_date = normalizeDate(safe.start_date);
  safe.end_date = normalizeDate(safe.end_date);

  // ✅ 태스크 정규화
  const normalizeTask2 = (t, projectId) => {
    const safeTask = { ...t };
    safeTask.task_id = Number(safeTask.task_id ?? 0);
    safeTask.project_id = Number(projectId);
    safeTask.start_date = normalizeDate(safeTask.start_date);
    safeTask.end_date = normalizeDate(safeTask.end_date);
    safeTask.due_date = normalizeDate(safeTask.due_date);

    // ✅ assignee_ids → taskmember 변환
    let ids = [];
    if (Array.isArray(safeTask.assignee_ids)) {
      ids = safeTask.assignee_ids.map(a => Number(a));
    } else if (Array.isArray(safeTask.assignees)) {
      ids = safeTask.assignees.map(a => Number(a));
    }

    // ✅ taskmember 생성
    safeTask.taskmember = ids.map(id => ({
      emp_id: Number(id),
      project_id: Number(projectId),
    }));

    // ✅ 하위업무 재귀
    safeTask.subtask = (safeTask.subtask || []).map(st => normalizeTask2(st, projectId));

    // 불필요한 필드 제거
    delete safeTask.assignee_ids;
    delete safeTask.assignees;

    return safeTask;
  };

  const tasks = Array.isArray(safe.task)
    ? safe.task.map(t => normalizeTask2(t, pid))
    : [];

  return {
    project_id: pid,
    project_name: safe.project_name || safe.title || "",
    description: safe.description ?? "",
    start_date: safe.start_date,
    end_date: safe.end_date,
    status: safe.status ?? "PLANNED",
    assignee_ids: Array.isArray(safe.assignee_ids)
    ? safe.assignee_ids.map(id => Number(id))
    : Array.isArray(safe.projectmember)
      ? safe.projectmember.map(pm => Number(pm.emp_id))
      : [],
    task: tasks,
  };
};
function AssigneeSelector({ employees, selected, setSelected, disabled }) {
  const [query, setQuery] = useState("");

  const findEmployee = id => {
    const numId = Number(id);
    return (
      employees.find(
        e =>
          Number(e.emp_id) === numId ||
          Number(e.id) === numId ||
          Number(e.employee?.emp_id) === numId ||
          Number(e.employee?.id) === numId,
      ) || null
    );
  };

  const selectedEmployees = selected.map(id => findEmployee(id)).filter(Boolean);
  const filtered = employees.filter(e => {
    const name = e.name || e.employee?.name || e.employee?.employee_name || "";
    const id = e.emp_id || e.id || e.employee?.emp_id || e.employee?.id;
    return (
      name.toLowerCase().includes(query.toLowerCase()) &&
      !selected.some(sid => Number(sid) === Number(id))
    );
  });

  return (
    <div style={{ marginTop: 6, position: "relative" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {selectedEmployees.map(emp => {
          const id = emp?.emp_id || emp?.id || emp?.employee?.emp_id || emp?.employee?.id;
          const name =
            emp?.name || emp?.employee?.name || emp?.employee?.employee_name || `ID:${id}`;
          return (
            <span
              key={id}
              style={{
                background: "#e3f2fd",
                color: "#1976d2",
                padding: "4px 8px",
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {name}
              {!disabled && (
                <button
                  onClick={() => setSelected(selected.filter(sid => Number(sid) !== Number(id)))}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              )}
            </span>
          );
        })}
      </div>

      {!disabled && (
        <>
          <input
            type="text"
            placeholder="담당자 검색"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ width: "100%", marginTop: 6 }}
          />
          {query && (
            <div
              style={{
                border: "1px solid #ccc",
                borderRadius: 6,
                marginTop: 4,
                maxHeight: 160,
                overflowY: "auto",
                background: "#fff",
                position: "absolute",
                zIndex: 1000,
                width: "100%",
              }}
            >
              {filtered.map(e => {
                const name = e.name || e.employee?.name || e.employee?.employee_name;
                const id = e.emp_id || e.id || e.employee?.emp_id || e.employee?.id;
                return (
                  <div
                    key={id}
                    onClick={() => {
                      setSelected([...selected, Number(id)]);
                      setQuery("");
                    }}
                    style={{
                      padding: 8,
                      cursor: "pointer",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    {name} ({id})
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* =========================================
 ✅ 메인: 프로젝트 상세 폼
========================================= */
export default function ProjectDetailForm({ projectId, onClose }) {
  const { refreshProjects, fetchTasksByProjectNow, updateProjectLocal, setLastUpdatedAt, setProjects, uiState, setUiState } = useProjectGlobal();
  const [isEditing, setIsEditing] = useState(false);
  const [project, setProject] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [mainAssignees, setMainAssignees] = useState([]);
  const [showDetails, setShowDetails] = useState(false);


  useEffect(() => {
  if (projectId) {
    // ✅ 기존 프로젝트 상세 보기
    const fetchData = async () => {
      try {
        console.log("📡 getProject 호출:", projectId);
        const [projectData, employeeData] = await Promise.all([
          getProject(projectId),
          getEmployees(),
        ]);
        console.log("📦 getProject 응답:", projectData);
        setProject(transformProject(projectData));
        setEmployees(employeeData);
        const ownerIds = projectData?.projectmember?.map(pm => pm.emp_id) || [];
        setMainAssignees(ownerIds);
      } catch (err) {
        console.error("❌ 데이터 로드 실패:", err);
        toast.error("데이터를 불러오지 못했습니다.");
      }
    };
    fetchData();
  } else {
    // ✅ 신규 프로젝트 작성 모드
    console.warn("🆕 신규 프로젝트 작성 모드 진입");
    setIsEditing(true); // ✅ 자동 편집 가능 상태로 전환
    setProject({
      project_name: "",
      description: "",
      start_date: "",
      end_date: "",
      status: "PLANNED",
      task: [],
      attachments: [],
    });
    getEmployees().then(setEmployees);
  }
}, [projectId]);

  if (!project) return <p style={{ padding: 20 }}>⏳ 로딩 중...</p>;

  const allTasks = project.task || [];
  const childIds = new Set();
  const collectChildIds = tasks => {
    for (const t of tasks) {
      if (t.subtask?.length) {
        for (const st of t.subtask) {
          childIds.add(st.task_id);
          collectChildIds([st]);
        }
      }
    }
  };
  collectChildIds(allTasks);
  const rootTasks = allTasks.filter(t => !childIds.has(t.task_id));

  const handleAddRootTask = () => {
  const nextId = generateNextTaskId(project.task || []);
  const newTask = {
    task_id: nextId,
    title: "",
    description: "",
    status: "PLANNED",
    priority: "MEDIUM",
    assignees: [],
    subtask: [],
    isEditing: true,
  };
  setProject(prev => ({
    ...prev,
    task: [...(prev.task || []), newTask],
  }));
};

  const handleSave = async () => {
  try {
    console.log("🔎 PROJECT STATE BEFORE SAVE:", project);
    await refreshProjects();
    const projectToSave = {
      ...project,
      task: Array.isArray(project.task) && project.task.length ? project.task : rootTasks,
      assignee_ids: mainAssignees.map(id => Number(id)),
    };

    console.log("🔎 PROJECT TO SAVE (merged with rootTasks if needed):", projectToSave);

    const payload = normalizeProjectForSave(projectToSave, projectId);
    console.log("📤 NORMALIZED PAYLOAD:", payload);
    console.log("🔍 FULL PAYLOAD TO SERVER:", JSON.stringify(payload, null, 2));

    await updateProject(projectId, payload)
    updateProjectLocal(projectId, payload);
    await refreshProjects();
    setLastUpdatedAt(Date.now());
    toast.success("수정 완료!");
    // setIsEditing(false);
  } catch (err) {
    console.error("❌ 수정 실패:", err);
    toast.error("수정 중 오류가 발생했습니다.");
  }
};
  const handleDelete = async () => {
  if (!window.confirm("이 프로젝트를 삭제하시겠습니까?")) return;

  try {
    await deleteProject(projectId);
    toast.success("프로젝트가 삭제되었습니다.");

    setLastUpdatedAt(Date.now());
    // 삭제 후 UI 상태 갱신
    setProjects(prev => prev.filter(p => p.project_id !== projectId));
    setUiState(prev => ({
      ...prev,
      drawer: { ...prev.drawer, project: false },
      panel: { ...prev.panel, selectedTask: null, projectId: null },
    }));
    onClose?.();
  } catch (err) {
    console.error("❌ 프로젝트 삭제 실패:", err);

    // ✅ 백엔드에서 '소유자만 삭제 가능'일 경우 친절한 안내
    if (String(err).includes("소유자만 삭제할 수 있습니다")) {
      toast.error("삭제 권한이 없습니다. 프로젝트 소유자만 삭제할 수 있습니다.");
    } else {
      toast.error("프로젝트 삭제 중 오류가 발생했습니다.");
    }
  }
};
  return (
  <div
    style={{
      padding: 24,
      background: "linear-gradient(180deg,#fdfdfd,#f7f8fa)",
      borderRadius: 12,
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      maxWidth: 900,
      margin: "0 auto",
    }}
  >
    <h2
      style={{
        fontSize: 22,
        fontWeight: 600,
        color: "#222",
        borderBottom: "2px solid #1976d2",
        paddingBottom: 8,
        marginBottom: 20,
      }}
    >
      📌 프로젝트 상세정보
    </h2>


      <label style={{ fontWeight: 500, color: "#444" }}>프로젝트 이름</label>
<input
  value={project.project_name || ""}
  onChange={e => setProject({ ...project, project_name: e.target.value })}
  disabled={!isEditing}
  style={{
    width: "100%",
    marginBottom: 12,
    background: !isEditing ? "#f6f6f6" : "white",
    border: "1px solid #ccc",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 15,
    transition: "all 0.2s",
  }}
/>

      <label>프로젝트 설명</label>
      <textarea
        value={project.description || ""}
        onChange={e => setProject({ ...project, description: e.target.value })}
        disabled={!isEditing}
        style={{
          width: "100%",
          minHeight: 80,
          padding: 8,
          borderRadius: 6,
          border: "1px solid #ccc",
          background: !isEditing ? "#f6f6f6" : "white",
        }}
      />
      {/* 📎 프로젝트 첨부파일 영역 */}
<div
  style={{
    marginTop: 24,
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: 10,
    padding: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  }}
>
  <strong style={{ fontSize: 16, color: "#333" }}>📎 프로젝트 첨부파일</strong>

  {/* 업로드 버튼 */}
  <div style={{ marginTop: 8 }}>
    <input
      type="file"
      id="projectFileInput"
      style={{ display: "none" }}
      onChange={async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
          toast.error("10MB 이하의 파일만 업로드 가능합니다.");
          return;
        }

        // TODO: 백엔드 업로드 API와 연결 필요
        // 지금은 일단 프론트 상태에 추가
        const next = [...(project.attachments || []), {
          file_name: file.name,
          file_path: URL.createObjectURL(file),
          file_size: file.size,
        }];
        setProject({ ...project, attachments: next });
      }}
      disabled={!isEditing}
    />
    <button
      onClick={() => document.getElementById("projectFileInput")?.click()}
      style={{
        background: "#1976d2",
        color: "white",
        border: "none",
        borderRadius: 6,
        padding: "6px 10px",
        cursor: "pointer",
      }}
      disabled={!isEditing}
    >
      📤 파일 추가
    </button>
  </div>

  {/* 파일 목록 */}
  {(project.attachments && project.attachments.length > 0) ? (
    <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
      {project.attachments.map((f, i) => (
        <li
          key={i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #eee",
            padding: "4px 0",
          }}
        >
          <a
            href={f.file_path}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#1976d2", textDecoration: "none" }}
          >
            {f.file_name}
          </a>
          {isEditing && (
          <button
            onClick={() => {
              const next = project.attachments.filter((_, idx) => idx !== i);
              setProject({ ...project, attachments: next });
            }}
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
          )}
        </li>
      ))}
    </ul>
  ) : (
    <p style={{ color: "#888", marginTop: 8 }}>첨부된 파일이 없습니다.</p>
  )}
</div>
      {/* 상세입력 버튼 */}
      <button
  onClick={() => setShowDetails(!showDetails)}
  style={{
    background: showDetails ? "#444" : "#1976d2",
    color: "white",
    border: "none",
    borderRadius: 6,
    padding: "10px 16px",
    cursor: "pointer",
    marginTop: 20,
    fontSize: 15,
    boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
  }}
>
  {showDetails ? "▲ 상세입력 닫기" : "▼ 상세입력 보기"}
</button>

      {showDetails && (
        <div
          style={{
            background: "#f9f9f9",
            padding: 12,
            borderRadius: 8,
            marginTop: 10,
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <label>시작일</label>
            <input
              type="date"
              value={project.start_date || ""}
              disabled={!isEditing}
              onChange={e => setProject({ ...project, start_date: e.target.value })}
              style={{
                marginLeft: 8,
                background: !isEditing ? "#f6f6f6" : "white",
              }}
            />
            <label style={{ marginLeft: 16 }}>종료일</label>
            <input
              type="date"
              value={project.end_date || ""}
              disabled={!isEditing}
              onChange={e => setProject({ ...project, end_date: e.target.value })}
              style={{
                marginLeft: 8,
                background: !isEditing ? "#f6f6f6" : "white",
              }}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <strong>상위업무 담당자:</strong>
            <AssigneeSelector
              employees={employees}
              selected={mainAssignees}
              setSelected={setMainAssignees}
              disabled={!isEditing}
            />
          </div>
        </div>
      )}

      {/* 업무 목록 */}
      <div
  style={{
    marginTop: 30,
    background: "#fafafa",
    border: "1px solid #eee",
    borderRadius: 10,
    padding: 16,
  }}
>
  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>📋 업무 목록</h3>
        {rootTasks.length > 0 ? (
          rootTasks.map((task, i) => (
            <TaskNode
  key={task.task_id ?? `root-${i}`}
  task={{ ...task, attachments: task.attachments || [] }}
  employees={employees}
  isEditing={isEditing}
  projectId={project?.project_id ?? projectId}
  depth={0}
  disabled={!isEditing}
  onUpdate={updatedTask => {
  setProject(prev => {
    const key = (x) => (x?.task_id ?? x?.temp_id);
    const updateRecursive = (tasks) =>
      tasks.map(t => {
        // ✅ 타입 차이/임시ID(temp_id)까지 모두 커버
        if (Number(key(t)) === Number(key(updatedTask))) return updatedTask;
        if (t.subtask?.length)
          return { ...t, subtask: updateRecursive(t.subtask) };
        return t;
      });

    const newTasks = updateRecursive(prev.task || []);
    return { ...prev, task: newTasks };
  });
}}
  onAddSibling={(newSibling, currentTask) => {
    setProject(prev => {
      const newTasks = [...(prev.task || [])];
      const idx = newTasks.findIndex(t => t.task_id === currentTask.task_id);
      if (idx === -1) return prev;
      newTasks.splice(idx + 1, 0, newSibling);
      return { ...prev, task: newTasks };
    });
  }}
/>
          ))
        ) : (
          <p style={{ color: "#999" }}>등록된 업무가 없습니다.</p>
        )}

        {isEditing && (
          <button
            onClick={handleAddRootTask}
            style={{
              background: "#2196f3",
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "6px 12px",
              marginTop: 10,
              cursor: "pointer",
            }}
          >
            ＋ 최상위 업무 추가
          </button>
        )}
      </div>

      {/* 하단 버튼 */}
      <div
  style={{
    borderTop: "1px solid #eee",
    paddingTop: 20,
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 30,
  }}
>
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              style={{
                background: "#1976d2",
                color: "white",
                border: "none",
                borderRadius: 6,
                padding: "8px 14px",
                cursor: "pointer",
              }}
            >
              저장
            </button>
            <button
              onClick={() => setIsEditing(false)}
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
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              style={{
                background: "#4caf50",
                color: "white",
                border: "none",
                borderRadius: 6,
                padding: "8px 14px",
                cursor: "pointer",
              }}
            >
              ✏️ 수정
            </button>
            <button
  onClick={handleDelete}
  style={{
    background: "#f44336",
    color: "white",
    border: "none",
    borderRadius: 6,
    padding: "8px 14px",
    cursor: "pointer",
  }}
>
  🗑️ 삭제
</button>
          </>
        )}
      </div>

      {/* ✅ Task 패널 연결 */}
      {uiState?.panel?.selectedTask && uiState?.panel?.projectId && (
        <ProjectDetailProvider>
          <TaskDetailPanel
            taskId={uiState.panel.selectedTask}
            projectId={uiState.panel.projectId}
            onClose={() =>
              setUiState(prev => ({
                ...prev,
                drawer: { ...prev.drawer, task: false },
                panel: { ...prev.panel, selectedTask: null, projectId: null }, // ✅ null로 초기화
              }))
            }
          />
        </ProjectDetailProvider>
      )}
    </div>
  );
}
