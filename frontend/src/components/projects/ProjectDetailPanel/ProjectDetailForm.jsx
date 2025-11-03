import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ProjectDetailProvider } from "../../../context/ProjectDetailContext";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import { getEmployees } from "../../../services/api/employee";
import { deleteProject, getProject, updateProject } from "../../../services/api/project";
import TaskNode from "../TaskNode"; // ✅ 외부 TaskNode 가져오기
import TaskDetailPanel from "./TaskInfoView"; // ✅ 패널 컴포넌트 연결
/* =========================================
 ✅ 담당자 선택 컴포넌트
========================================= */

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
  const { setProjects, uiState, setUiState } = useProjectGlobal();
  const [isEditing, setIsEditing] = useState(false);
  const [project, setProject] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [mainAssignees, setMainAssignees] = useState([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (projectId) {
      console.log("🧾 Project DetailForm check:", {
        project_id: project?.project_id,
        name: project?.project_name,
        raw: project,
      });
    } else {
      console.warn("⚠️ ProjectDetailForm: projectId가 없습니다!");
    }

    const fetchData = async () => {
      if (!projectId) return; // projectId 없으면 호출하지 않음
      try {
        console.log("📡 getProject 호출:", projectId);
        const [projectData, employeeData] = await Promise.all([
          getProject(projectId),
          getEmployees(),
        ]);
        console.log("📦 getProject 응답:", projectData);
        setProject(projectData);
        setEmployees(employeeData);
        const ownerIds = projectData?.projectmember?.map(pm => pm.emp_id) || [];
        setMainAssignees(ownerIds);
      } catch (err) {
        console.error("❌ 데이터 로드 실패:", err);
        toast.error("데이터를 불러오지 못했습니다.");
      }
    };
    fetchData();
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
    const newTask = {
      task_id: Date.now(),
      title: "",
      start_date: "",
      end_date: "",
      assignees: [],
      subtask: [],
      isOpen: false,
    };
    setProject({
      ...project,
      task: [...(project.task || []), newTask],
    });
  };

  const handleSave = async () => {
    try {
      await updateProject(projectId, project);
      toast.success("수정 완료!");
      setIsEditing(false);
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
      setProjects(prev => prev.filter(p => p.project_id !== projectId));
      onClose?.();
    } catch (err) {
      console.error("❌ 삭제 실패:", err);
      toast.error("삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>📌 프로젝트 상세정보</h2>

      <label>프로젝트 이름</label>
      <input
        value={project.project_name || ""}
        onChange={e => setProject({ ...project, project_name: e.target.value })}
        disabled={!isEditing}
        style={{
          width: "100%",
          marginBottom: 12,
          background: !isEditing ? "#f6f6f6" : "white",
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

      {/* 상세입력 버튼 */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        style={{
          background: showDetails ? "#555" : "#1976d2",
          color: "white",
          border: "none",
          borderRadius: 6,
          padding: "8px 12px",
          cursor: "pointer",
          marginTop: 10,
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
      <div style={{ marginTop: 20 }}>
        <h3>📋 업무 목록</h3>
        {rootTasks.length > 0 ? (
          rootTasks.map((task, i) => (
            <TaskNode
              key={task.task_id ?? `root-${i}`}
              task={task}
              employees={employees}
              onUpdate={updatedTask => {
                const newTasks = [...project.task];
                const index = newTasks.findIndex(t => t.task_id === task.task_id);
                if (updatedTask === null) newTasks.splice(index, 1);
                else newTasks[index] = updatedTask;
                setProject({ ...project, task: newTasks });
              }}
              disabled={!isEditing}
              depth={0}
              projectId={project?.project_id ?? projectId}
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
          paddingTop: 16,
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 20,
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
