import React, { useEffect, useState } from "react";

const MOCK_TASKS = [
  {
    id: 1,
    title: "프로젝트 킥오프 준비",
    description: "프로젝트 일정과 범위를 정리합니다.",
    assignees: ["홍길동", "김철수"],
    subtasks: [
      {
        id: 11,
        title: "Kick-off 자료 작성",
        startDate: "2024-09-01",
        endDate: "2024-09-02",
        details: [
          {
            id: 111,
            title: "요약본 정리",
            startDate: "2024-09-01",
            endDate: "2024-09-01",
          },
        ],
      },
    ],
  },
  {
    id: 2,
    title: "디자인 시안 검토",
    description: "1차 시안을 검토하고 피드백을 정리합니다.",
    assignees: ["이영희"],
    subtasks: [],
  },
];

export default function TaskList({ onSelectTask }) {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    setTasks(MOCK_TASKS);
  }, []);

  return (
    <div className="task-list">
      <h2 className="section-title">업무 목록</h2>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <button type="button" onClick={() => onSelectTask(task)}>
              <strong>{task.title}</strong>
              <p>{task.description}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
