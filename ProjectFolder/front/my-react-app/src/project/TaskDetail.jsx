import React, { useEffect, useState } from "react";
import { getTaskDetail, deleteTask, deleteSubtask, deleteDetail } from "./api";
import { useParams, useNavigate } from "react-router-dom";

export default function TaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);

  useEffect(() => {
    fetchTaskDetail();
  }, [taskId]);

  const fetchTaskDetail = async () => {
    const data = await getTaskDetail(taskId);
    setTask(data);
  };

  const handleDelete = async (type, id) => {
    if (type === "task") {
      await deleteTask(id);
      navigate("/tasks"); // 삭제 후 목록으로
    } else if (type === "subtask") {
      await deleteSubtask(id);
      fetchTaskDetail();
    } else if (type === "detail") {
      await deleteDetail(id);
      fetchTaskDetail();
    }
  };

  if (!task) return <p>Loading...</p>;

  return (
    <div>
      <h2>{task.title} ({task.status})</h2>
      <button onClick={() => handleDelete("task", task.id)}>상위업무 삭제</button>

      <h3>하위업무</h3>
      <ul>
        {task.subtasks.map((sub) => (
          <li key={sub.id}>
            <strong>{sub.title}</strong>
            <button onClick={() => handleDelete("subtask", sub.id)}>삭제</button>
            <ul>
              {sub.details.map((d) => (
                <li key={d.id}>
                  {d.title}
                  <button onClick={() => handleDelete("detail", d.id)}>삭제</button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
