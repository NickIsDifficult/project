import React, { useEffect, useState } from "react";
import { getTasks, deleteTask } from "./api";
import TaskRegistration from "./TaskRegistration";

export default function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [showRegistration, setShowRegistration] = useState(false);

  // ✅ 업무 데이터 가져오기
  const fetchTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (error) {
      console.error("업무 조회 실패:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("이 업무를 삭제하시겠습니까?")) {
      await deleteTask(id);
      fetchTasks();
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>업무 관리</h1>

      {/* ✅ 버튼 클릭 → 등록창 열림 */}
      <button onClick={() => setShowRegistration(true)}>업무 등록</button>

      {/* ✅ 등록 모달 */}
      {showRegistration && (
        <TaskRegistration
          onClose={() => setShowRegistration(false)}
          refreshTasks={fetchTasks}
        />
      )}

      <ul>
        {tasks.length === 0 ? (
          <li>등록된 업무가 없습니다.</li>
        ) : (
          tasks.map((task) => (
            <li
              key={task.id}
              style={{
                marginBottom: "10px",
                display: "flex",
                justifyContent: "space-between", // 왼쪽: 제목 / 오른쪽: 날짜
                alignItems: "center",
                borderBottom: "1px solid #eee",
                paddingBottom: "5px",
              }}
            >
              {/* 왼쪽: 업무 제목 + 설명 */}
              <div>
                <strong>{task.title}</strong>
                {task.description && (
                  <em style={{ marginLeft: "10px", color: "#666" }}>
                    {task.description}
                  </em>
                )}
              </div>

              {/* 오른쪽: 날짜 + 삭제버튼 */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#999" }}>
                  {task.start_date && task.end_date
                    ? `${task.start_date} ~ ${task.end_date}`
                    : "날짜 미정"}
                </span>
                <button
                  style={{
                    marginLeft: "10px",
                    color: "red",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                  onClick={() => handleDelete(task.id)}
                >
                  삭제
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
