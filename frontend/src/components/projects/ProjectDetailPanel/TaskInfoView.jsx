// src/components/project/ProjectDetailPanel/TaskInfoView.jsx
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useMemo } from "react";
import Button from "../../common/Button";

/**
 * ✅ TaskInfoView
 * - 업무 상세보기 (읽기 전용)
 */
export default function TaskInfoView({
  task,
  onEdit,
  onStatusChange,
  onProgressChange,
  onAddSubtask,
  onDeleteTask, // 🔹 추가
}) {
  if (!task)
    return (
      <p className="text-gray-500 text-sm text-center mt-6">업무 데이터를 불러올 수 없습니다.</p>
    );

  const formattedDate = useMemo(() => {
    if (!task.start_date && !task.end_date) return "기간 미정";
    const start = task.start_date
      ? format(new Date(task.start_date), "yyyy.MM.dd", { locale: ko })
      : "";
    const end = task.end_date ? format(new Date(task.end_date), "yyyy.MM.dd", { locale: ko }) : "";
    return `${start} ~ ${end}`;
  }, [task.start_date, task.end_date]);

  const STATUS_LABELS = {
    TODO: "🕓 대기중",
    IN_PROGRESS: "🚧 진행중",
    REVIEW: "🔍 검토중",
    DONE: "✅ 완료",
    ON_HOLD: "⏸️ 보류",
  };

  const PRIORITY_LABELS = {
    HIGH: "🔥 높음",
    MEDIUM: "⚖️ 보통",
    LOW: "🌱 낮음",
  };

  const title = task.title || task.task_name || "제목 없음";

  return (
    <div className="space-y-4">
      {/* 🏷️ 기본 정보 */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-600 whitespace-pre-wrap">{task.description || "설명 없음"}</p>
      </div>

      {/* 📋 세부 정보 */}
      <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-700">
        <p>
          <span className="font-medium text-gray-600">📁 프로젝트:</span> {task.project_name || "-"}
        </p>
        <p>
          <span className="font-medium text-gray-600">👤 담당자:</span>{" "}
          {task.assignee_name || "미지정"}
        </p>
        <p>
          <span className="font-medium text-gray-600">🏷️ 우선순위:</span>{" "}
          {PRIORITY_LABELS[task.priority] || "미정"}
        </p>
        <p>
          <span className="font-medium text-gray-600">📅 기간:</span> {formattedDate}
        </p>
      </div>

      {/* 🚦 상태 변경 */}
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-600">상태:</span>
        <select
          value={task.status || "TODO"}
          onChange={e => onStatusChange(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-400"
        >
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* 📊 진행률 */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          진행률: {task.progress || 0}%
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={task.progress || 0}
          onChange={e => onProgressChange(Number(e.target.value))}
          className="w-full accent-blue-500"
        />
      </div>

      {/* 🔘 버튼 */}
      <div className="flex gap-2 pt-2">
        <Button variant="primary" onClick={onEdit}>
          ✏️ 수정
        </Button>
        <Button variant="success" onClick={onAddSubtask}>
          ➕ 하위 업무 추가
        </Button>
        {/* 🔹 삭제 버튼 추가 */}
        <Button variant="danger" onClick={onDeleteTask}>
          🗑️ 삭제
        </Button>
      </div>
    </div>
  );
}
