// src/components/projects/ProjectDetailPanel/ProjectDetailForm.jsx
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import { getEmployees } from "../../../services/api/employee";
import { deleteProject, getProject, updateProject } from "../../../services/api/project";

/* =========================================
 ✅ 담당자 선택 컴포넌트
========================================= */
function AssigneeSelector({ employees, selected, setSelected, disabled }) {
  const [query, setQuery] = useState("");

  const filtered = employees.filter(
    emp =>
      emp.name.toLowerCase().includes(query.toLowerCase()) &&
      !selected.includes(emp.emp_id),
  );

  return (
    <div style={{ marginTop: 6, position: "relative" }}>
      {/* 선택된 담당자 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {selected.map(id => {
          const emp = employees.find(e => e.emp_id === id);
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
              {emp?.name}
              {!disabled && (
                <button
                  onClick={() => setSelected(selected.filter(sid => sid !== id))}
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
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
              }}
            >
              {filtered.map(emp => (
                <div
                  key={`emp-${emp.emp_id}`}
                  onClick={() => {
                    setSelected([...selected, emp.emp_id]);
                    setQuery("");
                  }}
                  style={{
                    padding: 8,
                    cursor: "pointer",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  {emp.name}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* =========================================
 ✅ 재귀형 업무 노드
========================================= */
function TaskNode({ task, onUpdate, employees, depth = 0, disabled }) {
  const toggleDetails = () => {
    onUpdate({ ...task, isOpen: !task.isOpen });
  };

  const handleAddChild = () => {
    const newChild = {
      task_id: Date.now(),
      title: "",
      start_date: "",
      end_date: "",
      assignees: [],
      subtask: [],
      isOpen: false,
    };
    onUpdate({
      ...task,
      subtask: [...(task.subtask || []), newChild],
    });
  };

  const handleDelete = () => {
    if (window.confirm("이 업무를 삭제하시겠습니까?")) {
      onUpdate(null);
    }
  };

  const handleChildUpdate = (index, updated) => {
    const newChildren = [...(task.subtask || [])];
    if (updated === null) newChildren.splice(index, 1);
    else newChildren[index] = updated;
    onUpdate({ ...task, subtask: newChildren });
  };

  return (
    <div
      style={{
        marginLeft: depth * 20,
        borderLeft: depth > 0 ? "2px solid #ddd" : "none",
        paddingLeft: depth > 0 ? 10 : 0,
        marginTop: 10,
      }}
    >
      {/* 제목 + 버튼 */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {depth > 0 && <span style={{ color: "#aaa" }}>└─</span>}
        <input
          placeholder="업무 제목"
          value={task.title || ""}
          disabled={disabled}
          onChange={e => onUpdate({ ...task, title: e.target.value })}
          style={{
            flex: 1,
            padding: "4px 8px",
            borderRadius: 6,
            border: "1px solid #ccc",
            background: disabled ? "#f6f6f6" : "white",
          }}
        />

        {!disabled && (
          <>
            <button
              onClick={handleAddChild}
              style={{
                background: "#2196f3",
                color: "white",
                border: "none",
                borderRadius: 6,
                padding: "4px 8px",
                cursor: "pointer",
              }}
            >
              ＋ 하위 추가
            </button>
            {depth > 0 && (
              <button
                onClick={handleDelete}
                style={{
                  background: "#f44336",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 8px",
                  cursor: "pointer",
                }}
              >
                ✕ 삭제
              </button>
            )}
          </>
        )}

        <button
          onClick={toggleDetails}
          style={{
            background: task.isOpen ? "#555" : "#1976d2",
            color: "white",
            border: "none",
            borderRadius: 6,
            padding: "4px 8px",
            cursor: "pointer",
          }}
        >
          {task.isOpen ? "▲ 닫기" : "▼ 상세"}
        </button>
      </div>

      {/* 상세정보 */}
      {task.isOpen && (
        <div
          style={{
            background: "#f9f9f9",
            borderRadius: 8,
            padding: 8,
            marginTop: 8,
          }}
        >
          <div style={{ marginBottom: 6 }}>
            <label>시작일</label>
            <input
              type="date"
              disabled={disabled}
              value={task.start_date || ""}
              onChange={e => onUpdate({ ...task, start_date: e.target.value })}
              style={{
                marginLeft: 8,
                background: disabled ? "#f6f6f6" : "white",
              }}
            />
            <label style={{ marginLeft: 12 }}>종료일</label>
            <input
              type="date"
              disabled={disabled}
              value={task.end_date || ""}
              onChange={e => onUpdate({ ...task, end_date: e.target.value })}
              style={{
                marginLeft: 8,
                background: disabled ? "#f6f6f6" : "white",
              }}
            />
          </div>

          <div>
            <strong>담당자:</strong>
            <AssigneeSelector
              employees={employees}
              selected={task.assignees || []}
              setSelected={newList =>
                onUpdate({ ...task, assignees: newList })
              }
              disabled={disabled}
            />
          </div>
        </div>
      )}

      {/* 하위업무 */}
      {(task.subtask || []).map((child, i) => (
        <TaskNode
          key={child.task_id ?? `${depth}-${i}`}
          task={child}
          employees={employees}
          onUpdate={updated => handleChildUpdate(i, updated)}
          depth={depth + 1}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

/* =========================================
 ✅ 메인: 프로젝트 상세 폼
========================================= */
export default function ProjectDetailForm({ projectId, onClose }) {
  const { setProjects } = useProjectGlobal();
  const [isEditing, setIsEditing] = useState(false);
  const [project, setProject] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [mainAssignees, setMainAssignees] = useState([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    const fetchData = async () => {
      try {
        const [projectData, employeeData] = await Promise.all([
          getProject(projectId),
          getEmployees(),
        ]);
        setProject(projectData);
        setEmployees(employeeData);
        setMainAssignees(projectData?.main_assignees || []);
      } catch (err) {
        console.error("❌ 데이터 로드 실패:", err);
        toast.error("데이터를 불러오지 못했습니다.");
      }
    };
    fetchData();
  }, [projectId]);

  if (!project) return <p style={{ padding: 20 }}>⏳ 로딩 중...</p>;

  // ✅ 중복 제거: subtask에 포함된 ID는 제외
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

      {/* 기본 정보 */}
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

      {/* 상세입력 */}
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
              onChange={e =>
                setProject({ ...project, start_date: e.target.value })
              }
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
              onChange={e =>
                setProject({ ...project, end_date: e.target.value })
              }
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
              onUpdate={() => {}}
              disabled={!isEditing}
              depth={0}
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
    </div>
  );
}
