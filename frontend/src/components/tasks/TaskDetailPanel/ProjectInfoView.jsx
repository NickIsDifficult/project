import { useEffect, useState } from "react";

// =========================================
// ✅ 담당자 선택 컴포넌트
// =========================================
function AssigneeSelector({ employees, selected, setSelected, disabled }) {
  const [query, setQuery] = useState("");
  const filtered = employees.filter(
    emp =>
      emp.name.toLowerCase().includes(query.toLowerCase()) &&
      !selected.includes(emp.emp_id)
  );

  return (
    <div style={{ marginTop: 6, position: "relative" }}>
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
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    setSelected(selected.filter(sid => sid !== id))
                  }
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
                  key={emp.emp_id}
                  style={{
                    padding: 8,
                    cursor: "pointer",
                    borderBottom: "1px solid #eee",
                  }}
                  onClick={() => {
                    setSelected([...selected, emp.emp_id]);
                    setQuery("");
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

// =========================================
// ✅ 재귀형 업무 노드
// =========================================
function TaskNode({ task, onUpdate, employees, depth = 0, disabled }) {
  const [showDetails, setShowDetails] = useState(false);

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
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          placeholder="업무 제목"
          value={task.title}
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
          {showDetails ? "▲ 상세 닫기" : "▼ 상세 보기"}
        </button>
      </div>

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
              value={task.startDate}
              onChange={e => onUpdate({ ...task, startDate: e.target.value })}
              style={{
                marginLeft: 8,
                background: disabled ? "#f6f6f6" : "white",
              }}
            />
            <label style={{ marginLeft: 12 }}>종료일</label>
            <input
              type="date"
              disabled={disabled}
              value={task.endDate}
              onChange={e => onUpdate({ ...task, endDate: e.target.value })}
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
              selected={task.assignees}
              setSelected={newList =>
                onUpdate({ ...task, assignees: newList })
              }
              disabled={disabled}
            />
          </div>
        </div>
      )}

      {task.children.map((child, index) => (
        <TaskNode
          key={child.id}
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

// =========================================
// ✅ 상세 보기 + 수정 모드 통합
// =========================================
export default function ProjectDetailForm({ projectData, onClose }) {
  const [isEditing, setIsEditing] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [project, setProject] = useState(
    projectData || {
      project_name: "스마트팩토리 구축 프로젝트",
      description: "ERP / MES 통합 시스템 개발 및 운영",
      startDate: "2025-10-01",
      endDate: "2025-12-31",
      priority: "HIGH",
      attachments: [{ name: "요구사항정의서.pdf" }],
      main_assignees: [1],
      tasks: [
        {
          id: 1,
          title: "MES 서버 구축",
          startDate: "2025-10-02",
          endDate: "2025-10-20",
          assignees: [2],
          children: [],
        },
      ],
    }
  );

  useEffect(() => {
    setEmployees([
      { emp_id: 1, name: "홍길동" },
      { emp_id: 2, name: "김철수" },
      { emp_id: 3, name: "이영희" },
    ]);
  }, []);

  const handleTaskUpdate = (index, updated) => {
    const newTasks = [...project.tasks];
    newTasks[index] = updated;
    setProject({ ...project, tasks: newTasks });
  };

  const handleSave = async () => {
  try {
    const payload = {
      project_name: project.project_name,
      description: project.description,
      start_date: project.startDate,
      end_date: project.endDate,
      priority: project.priority,
      main_assignees: project.main_assignees,
      tasks: project.tasks,
    };

    console.log("📤 수정된 데이터:", JSON.stringify(payload, null, 2));

    await updateProject(project.id, payload);
    toast.success("✅ 프로젝트 수정 완료!");
    setIsEditing(false);
  } catch (err) {
    console.error("❌ 프로젝트 수정 실패:", err);
    toast.error("프로젝트 수정 중 오류가 발생했습니다.");
  }
};

  return (
    <div style={{ padding: 16, overflowY: "auto" }}>
      <h2>📌 프로젝트 상세정보</h2>

      <label>프로젝트 이름</label>
      <input
        value={project.project_name}
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
        value={project.description}
        onChange={e =>
          setProject({ ...project, description: e.target.value })
        }
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

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <label>시작일</label>
          <input
            type="date"
            value={project.startDate}
            onChange={e => setProject({ ...project, startDate: e.target.value })}
            disabled={!isEditing}
            style={{
              width: "100%",
              background: !isEditing ? "#f6f6f6" : "white",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>종료일</label>
          <input
            type="date"
            value={project.endDate}
            onChange={e => setProject({ ...project, endDate: e.target.value })}
            disabled={!isEditing}
            style={{
              width: "100%",
              background: !isEditing ? "#f6f6f6" : "white",
            }}
          />
        </div>
      </div>

      <label style={{ marginTop: 12 }}>우선순위</label>
      <select
        value={project.priority}
        onChange={e => setProject({ ...project, priority: e.target.value })}
        disabled={!isEditing}
        style={{
          width: "100%",
          marginBottom: 12,
          background: !isEditing ? "#f6f6f6" : "white",
        }}
      >
        <option value="LOW">낮음</option>
        <option value="MEDIUM">보통</option>
        <option value="HIGH">높음</option>
        <option value="URGENT">긴급</option>
      </select>

      <div style={{ marginTop: 12 }}>
        <strong>상위업무 담당자:</strong>
        <AssigneeSelector
          employees={employees}
          selected={project.main_assignees}
          setSelected={newList => setProject({ ...project, main_assignees: newList })}
          disabled={!isEditing}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>📋 하위 업무</h3>
        {project.tasks.map((task, index) => (
          <TaskNode
            key={task.id}
            task={task}
            employees={employees}
            onUpdate={updated => handleTaskUpdate(index, updated)}
            disabled={!isEditing}
          />
        ))}
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
              onClick={onClose}
              style={{
                background: "#f1f1f1",
                border: "1px solid #ccc",
                borderRadius: 6,
                padding: "8px 14px",
                cursor: "pointer",
              }}
            >
              닫기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
