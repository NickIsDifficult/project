// src/components/projects/tasks/TaskRow.jsx
import React from "react";

export default function TaskRow({ task, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex justify-between items-center bg-white p-2 rounded-md shadow-sm hover:bg-gray-100 cursor-pointer transition"
    >
      <div>
        <div className="font-medium text-gray-800">{task.title}</div>
        <div className="text-xs text-gray-500">
          {task.start_date || "시작 미정"} ~ {task.due_date || "마감 미정"}
        </div>
      </div>
      <div className="text-right">
        <span
          className={`text-xs font-semibold px-2 py-1 rounded ${
            task.status === "DONE"
              ? "bg-green-100 text-green-700"
              : task.status === "IN_PROGRESS"
                ? "bg-blue-100 text-blue-700"
                : task.status === "REVIEW"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-500"
          }`}
        >
          {task.status}
        </span>
      </div>
    </div>
  );
}
