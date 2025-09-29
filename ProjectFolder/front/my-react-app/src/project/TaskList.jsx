import React, { useEffect, useState } from "react";
import { getTasks } from "./api";
import { useNavigate } from "react-router-dom";

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const data = await getTasks();
    setTasks(data);
  };

  return (
    <div>
      <h1>상위 업무 목록</h1>
      <ul>
        {tasks.map((task) => (
          <li
            key={task.id}
            style={{ cursor: "pointer", margin: "5px 0" }}
            onClick={() => navigate(`/tasks/${task.id}`)}
          >
            {task.title} ({task.status})
          </li>
        ))}
      </ul>
    </div>
  );
}
