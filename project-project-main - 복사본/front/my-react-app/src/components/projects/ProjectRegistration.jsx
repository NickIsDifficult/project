import React, { useState, useEffect, useRef } from "react";

// =========================================
// ✅ 담당자 선택 컴포넌트
// =========================================
function AssigneeSelector({ employees, selected, setSelected }) {
  const [query, setQuery] = useState("");
  const filtered = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(query.toLowerCase()) &&
      !selected.includes(emp.emp_id)
  );

  return (
    <div style={{ marginTop: 6, position: "relative" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {selected.map((id) => {
          const emp = employees.find((e) => e.emp_id === id);
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
              <button
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                }}
                onClick={() =>
                  setSelected(selected.filter((sid) => sid !== id))
                }
              >
                ✕
              </button>
            </span>
          );
        })}
      </div>

      <input
        type="text"
        placeholder="담당자 검색"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
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
          {filtered.map((emp) => (
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
    </div>
  );
}

// =========================================
// ✅ 재귀형 업무 노드 (같은레벨 & 하위업무)
// =========================================
function TaskNode({ task, onUpdate, employees, depth = 0, onAddSibling }) {
  const [showDetails, setShowDetails] = useState(false); // ✅ 상세입력 기본 닫힘

  const handleAddChild = () => {
    const newChild = {
      id: Date.now(),
      title: "",
      startDate: "",
      endDate: "",
      assignees: [],
      children: [],
    };
    onUpdate({ ...task, children: [...task.children, newChild] });
  };

  const handleAddSibling = () => onAddSibling();
  const handleDelete = () => onUpdate(null);

  const handleChildUpdate = (index, updated) => {
    const newChildren = [...task.children];
    if (updated === null) newChildren.splice(index, 1);
    else newChildren[index] = updated;
    onUpdate({ ...task, children: newChildren });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddSibling();
    }
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
      {/* 제목줄 */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          placeholder="업무 제목"
          value={task.title}
          onChange={(e) => onUpdate({ ...task, title: e.target.value })}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            padding: "4px 8px",
            borderRadius: 6,
            border: "1px solid #ccc",
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
          {showDetails ? "▲ 상세입력 닫기" : "▼ 상세입력 보기"}
        </button>
        <button onClick={handleAddSibling}>➕ 업무 추가</button>
        <button onClick={handleAddChild}>↳ 하위업무 추가</button>
        <button
          onClick={handleDelete}
          style={{
            color: "crimson",
            border: "none",
            background: "transparent",
          }}
        >
          ✕
        </button>
      </div>

      {/* 상세입력 (토글) */}
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
              value={task.startDate}
              onChange={(e) => onUpdate({ ...task, startDate: e.target.value })}
              style={{ marginLeft: 8 }}
            />
            <label style={{ marginLeft: 12 }}>종료일</label>
            <input
              type="date"
              value={task.endDate}
              onChange={(e) => onUpdate({ ...task, endDate: e.target.value })}
              style={{ marginLeft: 8 }}
            />
          </div>

          <div>
            <strong>담당자:</strong>
            <AssigneeSelector
              employees={employees}
              selected={task.assignees}
              setSelected={(newList) =>
                onUpdate({ ...task, assignees: newList })
              }
            />
          </div>
        </div>
      )}

      {/* 하위 업무 (재귀) */}
      {task.children.map((child, index) => (
        <TaskNode
          key={child.id}
          task={child}
          employees={employees}
          onUpdate={(updated) => handleChildUpdate(index, updated)}
          depth={depth + 1}
          onAddSibling={() => {
            const newChildren = [...task.children];
            const newTask = {
              id: Date.now(),
              title: "",
              startDate: "",
              endDate: "",
              assignees: [],
              children: [],
            };
            newChildren.splice(index + 1, 0, newTask);
            onUpdate({ ...task, children: newChildren });
          }}
        />
      ))}
    </div>
  );
}

// =========================================
// ✅ 메인 등록 컴포넌트
// =========================================
export default function TaskRegistration({ onClose }) {
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

  const fileInputRef = useRef(null);

  useEffect(() => {
    setEmployees([
      { emp_id: 1, name: "홍길동" },
      { emp_id: 2, name: "김철수" },
      { emp_id: 3, name: "이영희" },
    ]);
  }, []);

  // 파일 업로드
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setAttachments((prev) => [...prev, file]);
  };
  const handleFileDelete = (index) =>
    setAttachments((prev) => prev.filter((_, i) => i !== index));

  // 최상위 업무 추가
  const handleAddRootTask = () => {
    const newTask = {
      id: Date.now(),
      title: "",
      startDate: "",
      endDate: "",
      assignees: [],
      children: [],
    };
    setTasks([...tasks, newTask]);
  };

  const handleTaskUpdate = (index, updated) => {
    const newTasks = [...tasks];
    if (updated === null) newTasks.splice(index, 1);
    else newTasks[index] = updated;
    setTasks(newTasks);
  };

  const handleSubmit = () => {
    const payload = {
      project_name: projectName,
      description,
      attachments: attachments.map((f) => f.name),
      priority,
      startDate,
      endDate,
      main_assignees: mainAssignees,
      tasks,
    };
    console.log("📤 전송 데이터:", JSON.stringify(payload, null, 2));
    alert("✅ 저장 완료 (콘솔 확인)");
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
      <h2>📌 프로젝트 등록</h2>

      {/* 기본정보 */}
      <label>프로젝트 이름</label>
      <input
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        style={{ width: "100%", marginBottom: 12 }}
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
            onChange={(e) => setStartDate(e.target.value)}
            style={{ width: "100%", marginBottom: 8 }}
          />
          <label>종료일</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ width: "100%", marginBottom: 8 }}
          />
          <label>우선순위</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            style={{ width: "100%" }}
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
              selected={mainAssignees}
              setSelected={setMainAssignees}
            />
          </div>
        </div>
      )}

      {/* 설명 */}
      <label style={{ marginTop: 12 }}>프로젝트 설명</label>
      <textarea
        placeholder="프로젝트 설명을 입력하세요..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
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

      {/* 업무 구조 */}
      <div style={{ marginTop: 20 }}>
        <h3>📋 하위 업무</h3>
        {tasks.map((task, index) => (
          <TaskNode
            key={task.id}
            task={task}
            employees={employees}
            onUpdate={(updated) => handleTaskUpdate(index, updated)}
            depth={0}
            onAddSibling={() => {
              const newTasks = [...tasks];
              const newTask = {
                id: Date.now(),
                title: "",
                startDate: "",
                endDate: "",
                assignees: [],
                children: [],
              };
              newTasks.splice(index + 1, 0, newTask);
              setTasks(newTasks);
            }}
          />
        ))}

        {/* ✅ 최상위 업무 추가 버튼 (없을 때만 표시) */}
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
        <button onClick={handleSubmit}>저장</button>
        <button onClick={onClose}>취소</button>
      </div>
    </div>
  );
}
