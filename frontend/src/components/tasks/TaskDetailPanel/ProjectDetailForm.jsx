import axios from "axios";
import { useEffect, useState } from "react";

/* =========================================
 ✅ 담당자 선택 컴포넌트
========================================= */
function AssigneeSelector({ employees, selected, setSelected, disabled }) {
  const [query, setQuery] = useState("");

  const filtered = employees.filter(
    emp => emp.name.toLowerCase().includes(query.toLowerCase()) && !selected.includes(emp.emp_id),
  );

  return (
    <div style={{ marginTop: 6, position: "relative" }}>
      {/* 선택된 담당자 목록 */}
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
 ✅ 재귀형 업무 노드 + 하위 업무 추가 기능
========================================= */
function TaskNode({ task, onUpdate, employees, depth = 0, disabled }) {
  const [showDetails, setShowDetails] = useState(false);

  // 하위업무 추가
  const handleAddChild = () => {
    const newChild = {
      id: Date.now(),
      title: "",
      start_date: "",
      end_date: "",
      assignees: [],
      children: [],
    };
    const newChildren = [...(task.children || []), newChild];
    onUpdate({ ...task, children: newChildren });
  };

  // 하위업무 삭제
  const handleDelete = () => {
    if (window.confirm("이 업무를 삭제하시겠습니까?")) {
      onUpdate(null);
    }
  };

  const handleChildUpdate = (index, updated) => {
    const newChildren = [...task.children];
    if (updated === null) newChildren.splice(index, 1);
    else newChildren[index] = updated;
    onUpdate({ ...task, children: newChildren });
  };

  return (
    <div
      style={{
        marginLeft: depth * 20,
        borderLeft: depth > 0 ? "2px solid #ddd" : "none",
        paddingLeft: depth > 0 ? 8 : 0,
        marginTop: 10,
      }}
    >
      {/* 제목 + 버튼 */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
          onClick={() => setShowDetails(!showDetails)}
          style={{
            background: showDetails ? "#555" : "#1976d2",
            color: "white",
            border: "none",
            borderRadius: 6,
            padding: "4px 8px",
            cursor: "pointer",
          }}
        >
          {showDetails ? "▲ 닫기" : "▼ 상세"}
        </button>
      </div>

      {/* 상세 */}
      {showDetails && (
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
              setSelected={newList => onUpdate({ ...task, assignees: newList })}
              disabled={disabled}
            />
          </div>
        </div>
      )}

      {/* 재귀 렌더링 */}
      {task.children?.map((child, index) => (
        <TaskNode
          key={child.id ?? `${depth}-${index}-${task.title ?? "child"}`}
          task={child}
          employees={employees}
          onUpdate={updated => handleChildUpdate(index, updated)}
          depth={depth + 1}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

/* =========================================
 ✅ 메인: 프로젝트 상세보기 + 수정
========================================= */
export default function ProjectDetailForm({ projectId, onClose }) {
  const [isEditing, setIsEditing] = useState(false);
  const [project, setProject] = useState(null);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    if (!projectId) return;
    const fetchData = async () => {
      try {
        const [projectRes, employeeRes] = await Promise.all([
          axios.get(`http://127.0.0.1:8000/projects/${projectId}`),
          axios.get(`http://127.0.0.1:8000/employees`),
        ]);
        setProject(projectRes.data);
        setEmployees(employeeRes.data);
      } catch (err) {
        console.error("❌ 데이터 로드 실패:", err);
        alert("데이터를 불러오지 못했습니다.");
      }
    };
    fetchData();
  }, [projectId]);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const { tasks, ...projectData } = project; // ✅ tasks는 제외하고 전송

      await axios.put(`http://127.0.0.1:8000/projects/${projectId}`, projectData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("✅ 수정 완료!");
      setIsEditing(false);
    } catch (err) {
      console.error("❌ 수정 실패:", err.response?.data || err);
      alert("수정 중 오류가 발생했습니다.");
    }
  };

  const handleTaskUpdate = (index, updated) => {
    if (updated === null) {
      const newTasks = [...project.tasks];
      newTasks.splice(index, 1);
      setProject({ ...project, tasks: newTasks });
    } else {
      const newTasks = [...project.tasks];
      newTasks[index] = updated;
      setProject({ ...project, tasks: newTasks });
    }
  };

  const handleAddRootTask = () => {
    const newTask = {
      id: Date.now(),
      title: "",
      start_date: "",
      end_date: "",
      assignees: [],
      children: [],
    };
    setProject({
      ...project,
      tasks: [...(project.tasks || []), newTask],
    });
  };

  if (!project) return <p style={{ padding: 20 }}>⏳ 로딩 중...</p>;

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

      <div style={{ marginTop: 20 }}>
        <h3>📋 하위 업무</h3>
        {project.tasks?.map((task, i) => (
          <TaskNode
            key={task.id ?? `root-${i}-${projectId}`}
            task={task}
            employees={employees}
            onUpdate={u => handleTaskUpdate(i, u)}
            disabled={!isEditing}
          />
        ))}

        {!isEditing ? null : (
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
          </>
        )}
      </div>
    </div>
  );
}
