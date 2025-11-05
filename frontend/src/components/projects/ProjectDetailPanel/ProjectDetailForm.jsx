// src/components/project/ProjectDetailPanel/ProjectDetailForm.jsx
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ProjectDetailProvider } from "../../../context/ProjectDetailContext";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import { getEmployees } from "../../../services/api/employee";
import { deleteProject, getProject, updateProject } from "../../../services/api/project";
import TaskNode from "../TaskNode";
import TaskInfoView from "./TaskInfoView";

/* ==============================
  ⚙️ 유틸 함수
============================== */
const normalizeDate = v => {
  if (!v) return null;
  const str = String(v).trim();
  if (str === "" || str.toLowerCase() === "null" || str.toLowerCase() === "undefined") return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(str) ? str : null;
};

/** ✅ 업무(Task) 정규화 함수 */
const normalizeTask = (task, projectId, parentTaskId = null) => {
  const safeNum = v => (v === "" || v == null || isNaN(v) ? null : Number(v));

  const obj = {
    project_id: safeNum(projectId),
    parent_task_id: safeNum(parentTaskId),
    title: task.title?.trim() || "제목 없음",
    description: task.description || "",
    status: task.status || "PLANNED",
    priority: task.priority || "MEDIUM",
    progress: safeNum(task.progress ?? 0) ?? 0,
    start_date: normalizeDate(task.start_date),
    due_date: normalizeDate(task.end_date || task.due_date),
    assignee_ids:
      Array.isArray(task.assignees) || Array.isArray(task.assignee_ids)
        ? (task.assignees || task.assignee_ids)
            .filter(v => v !== "" && v != null)
            .map(a => {
              if (typeof a === "object" && a.emp_id != null) return Number(a.emp_id);
              return Number(a);
            })
            .filter(n => !isNaN(n))
        : [],
    subtask: Array.isArray(task.subtask)
      ? task.subtask.map(st => normalizeTask(st, projectId, task.task_id))
      : [],
  };

  const tid = safeNum(task.task_id);
  if (tid !== null) obj.task_id = tid;
  return obj;
};

/** ✅ 평면 배열 → 트리 구조 변환 함수 */
const buildTaskTree = (tasks = []) => {
  const map = {};
  const roots = [];

  // 모든 태스크를 맵에 등록
  tasks.forEach(t => {
    map[t.task_id] = { ...t, subtask: [] };
  });

  // 부모-자식 관계 구성
  tasks.forEach(t => {
    if (t.parent_task_id && map[t.parent_task_id]) {
      map[t.parent_task_id].subtask.push(map[t.task_id]);
    } else {
      roots.push(map[t.task_id]);
    }
  });

  return roots;
};

/** ✅ 트리 안 특정 업무 갱신 */
const updateTaskInTree = (tasks, updatedTask) => {
  if (!Array.isArray(tasks)) return tasks;
  return tasks.map(t => {
    const same =
      (t.task_id && updatedTask.task_id && t.task_id === updatedTask.task_id) ||
      (t.temp_id && updatedTask.temp_id && t.temp_id === updatedTask.temp_id);

    if (same) return updatedTask;

    if (t.subtask && t.subtask.length > 0) {
      return { ...t, subtask: updateTaskInTree(t.subtask, updatedTask) };
    }
    return t;
  });
};

/** ✅ 프로젝트 전체 페이로드 정규화 */
const normalizeProjectPayload = (project, projectId, mainAssignees) => {
  const safeNum = v => (v === "" || v == null || isNaN(v) ? null : Number(v));
  const pid = safeNum(project?.project_id ?? projectId);

  return {
    project_id: pid,
    project_name: project.project_name?.trim() || project.title?.trim() || "제목 없음",
    description: project.description ?? "",
    start_date: normalizeDate(project.start_date),
    end_date: normalizeDate(project.end_date),
    status: project.status || "PLANNED",
    assignee_ids: (mainAssignees || [])
      .filter(v => v !== "" && v != null)
      .map(v => Number(v))
      .filter(n => !isNaN(n)),
    tasks: Array.isArray(project.tasks || project.task)
      ? (project.tasks || project.task).map(t => normalizeTask(t, pid, null))
      : [],
  };
};

/* ==============================
  📋 프로젝트 상세 폼
============================== */
export default function ProjectDetailForm({ projectId, onClose }) {
  const {
    refreshProjects,
    updateProjectLocal,
    setLastUpdatedAt,
    setProjects,
    uiState,
    setUiState,
  } = useProjectGlobal();

  const [project, setProject] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [mainAssignees, setMainAssignees] = useState([]);
  const [showDetails, setShowDetails] = useState(false);

  /* ✅ 데이터 로드 */
  useEffect(() => {
    if (!projectId) return;
    const fetchData = async () => {
      try {
        const [projectData, employeeData] = await Promise.all([
          getProject(projectId),
          getEmployees(),
        ]);

        // 🔹 평면 배열 형태로 온 업무 데이터 정리
        const flatTasks = Array.isArray(projectData.task)
          ? projectData.task.map(t => ({
              ...t,
              assignees:
                Array.isArray(t.assignee_ids) && t.assignee_ids.length > 0
                  ? t.assignee_ids
                  : Array.isArray(t.taskmember)
                    ? t.taskmember.map(m => m.emp_id)
                    : [],
            }))
          : [];

        // 🔥 트리형으로 변환
        const treeTasks = buildTaskTree(flatTasks);

        setProject({
          ...projectData,
          task: treeTasks,
        });

        console.log("🌳 트리 변환된 project.task:", treeTasks);

        setEmployees(employeeData);
        setMainAssignees(projectData?.projectmember?.map(pm => pm.emp_id) || []);
      } catch (err) {
        console.error("❌ 데이터 로드 실패:", err);
        toast.error("프로젝트 데이터를 불러오지 못했습니다.");
      }
    };
    fetchData();
  }, [projectId]);

  if (!project)
    return <p style={{ padding: 20, color: "#777" }}>⏳ 프로젝트 데이터를 불러오는 중...</p>;

  /* ✅ 업무 추가 */
  const handleAddTask = () => {
    const newTask = {
      task_id: Date.now(),
      title: "",
      status: "PLANNED",
      priority: "MEDIUM",
      progress: 0,
      assignees: [],
      subtask: [],
      isEditing: true,
    };
    setProject(prev => ({
      ...prev,
      task: [...(prev.task || []), newTask],
    }));
  };

  /* ✅ 저장 */
  const handleSave = async () => {
    try {
      const payload = normalizeProjectPayload(project, projectId, mainAssignees);
      console.log("📤 최종 전송 Payload:", JSON.stringify(payload, null, 2));
      await updateProject(projectId, payload);
      updateProjectLocal(projectId, payload);
      await refreshProjects();
      setLastUpdatedAt(Date.now());
      toast.success("✅ 프로젝트 수정 완료!");
      setIsEditing(false);
    } catch (err) {
      console.error("❌ 프로젝트 저장 실패:", err);
      toast.error("프로젝트 저장 중 오류가 발생했습니다.");
    }
  };

  /* ✅ 삭제 */
  const handleDelete = async () => {
    if (!window.confirm("정말 이 프로젝트를 삭제하시겠습니까?")) return;
    try {
      await deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.project_id !== projectId));
      toast.success("🗑️ 프로젝트가 삭제되었습니다.");
      setUiState(prev => ({
        ...prev,
        drawer: { ...prev.drawer, project: false },
        panel: { selectedTask: null },
      }));
      onClose?.();
    } catch (err) {
      toast.error("프로젝트 삭제 실패");
    }
  };

  /* ==============================
    📦 렌더링
  =============================== */
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

      {/* 🧾 프로젝트 기본정보 */}
      <label>프로젝트 이름</label>
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

      {/* 📅 상세입력 */}
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
        </div>
      )}

      {/* 📋 업무 목록 */}
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

        {Array.isArray(project.task) && project.task.length > 0 ? (
          project.task.map((task, i) => (
            <TaskNode
              key={task.task_id ?? `root-${i}`}
              task={task}
              employees={employees}
              isEditing={isEditing}
              projectId={project.project_id ?? projectId}
              onUpdate={updated => {
                setProject(prev => ({
                  ...prev,
                  task: updateTaskInTree(prev.task || [], updated),
                }));
              }}
            />
          ))
        ) : (
          <p style={{ color: "#999" }}>등록된 업무가 없습니다.</p>
        )}

        {isEditing && (
          <button
            onClick={handleAddTask}
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
            ＋ 업무 추가
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

      {/* ✅ Task Detail 패널 */}
      {uiState?.panel?.selectedTask?.task_id && (
        <ProjectDetailProvider
          projectId={uiState?.panel?.projectId}
          taskId={uiState?.panel?.selectedTask?.task_id}
        >
          <TaskInfoView
            taskId={uiState.panel.selectedTask.task_id}
            projectId={uiState.panel.projectId}
            onClose={() =>
              setUiState(prev => ({
                ...prev,
                drawer: { ...prev.drawer, task: false },
                panel: { ...prev.panel, selectedTask: null, projectId: null },
              }))
            }
          />
        </ProjectDetailProvider>
      )}
    </div>
  );
}
