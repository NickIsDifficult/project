// src/components/projects/tasks/TaskGroup.jsx
import React, { useState } from "react";
import TaskRow from "./TaskRow";
import { createTask } from "../../services/api/task";

export default function TaskGroup({ task, projectId, onTaskClick, onTasksChange }) {
  const [expanded, setExpanded] = useState(false);

  // ✅ 하위업무 추가
  const handleAddSubTask = async () => {
    const title = prompt(`"${task.title}"의 하위 업무 제목을 입력하세요`);
    if (!title?.trim()) return;

    try {
      // ✅ createTask(projectId, payload) 구조
      await createTask(projectId, {
        title: title.trim(),
        project_id: projectId,
        parent_task_id: task.task_id,
        status: "TODO",
        priority: "MEDIUM",
      });

      // 갱신
      onTasksChange?.();
      setExpanded(true);
    } catch (err) {
      console.error("하위 업무 생성 실패:", err);
      alert("하위 업무 생성 실패: " + (err.message || "서버 오류"));
    }
  };

  return (
    <div className="border rounded-md p-2 bg-gray-50 hover:bg-gray-100 transition">
      {/* 📁 상위 업무 */}
      <div className="flex justify-between items-center cursor-pointer">
        <span
          onClick={() => setExpanded(!expanded)}
          className="font-semibold text-gray-800 flex-1"
        >
          {expanded ? "▼" : "▶"} {task.title}
        </span>

        <button
          onClick={handleAddSubTask}
          className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded hover:bg-blue-200"
        >
          + 하위업무
        </button>
      </div>

      {/* 📋 하위 업무들 */}
      {expanded && (
        <div className="ml-4 mt-2 space-y-2">
          {task.subtasks?.length > 0 ? (
            task.subtasks.map((sub) => (
              <div key={sub.task_id} className="border-l-2 pl-2">
                <TaskRow task={sub} onClick={() => onTaskClick(sub)} />

                {/* ✅ 세부 업무 표시 */}
                {sub.details?.length > 0 ? (
                  sub.details.map((detail) => (
                    <div
                      key={detail.task_id}
                      className="ml-4 border-l pl-2 text-sm text-gray-600 hover:text-black cursor-pointer"
                      onClick={() => onTaskClick(detail)}
                    >
                      - {detail.title} ({detail.status})
                    </div>
                  ))
                ) : (
                  <p className="ml-4 text-xs text-gray-400">세부 업무 없음</p>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm ml-2">하위 업무 없음</p>
          )}
        </div>
      )}
    </div>
  );
}
