// src/components/tasks/TaskKanbanView/useKanbanData.js
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { updateTaskStatus } from "../../../services/api/task";

const STATUS_COLUMNS = [
  { key: "TODO", label: "할 일 📝" },
  { key: "IN_PROGRESS", label: "진행 중 🚧" },
  { key: "REVIEW", label: "검토 중 🔍" },
  { key: "DONE", label: "완료 ✅" },
];

export function useKanbanData({ projectId, tasks, onTasksChange }) {
  const [localTasks, setLocalTasks] = useState(tasks);
  const [loading, setLoading] = useState(false);

  // tasks prop이 갱신되면 localTasks도 갱신
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // 상태별 그룹화
  const columns = useMemo(() => {
    const map = {};
    STATUS_COLUMNS.forEach(col => (map[col.key] = []));
    localTasks.forEach(task => {
      const key = task.status || "TODO";
      map[key].push(task);
    });
    return STATUS_COLUMNS.map(col => ({
      key: col.key,
      label: col.label,
      tasks: map[col.key] || [],
    }));
  }, [localTasks]);

  // Drag & Drop 후 상태 변경
  const handleDragEnd = useCallback(
    async result => {
      const { destination, source, draggableId } = result;
      if (!destination) return;
      if (destination.droppableId === source.droppableId && destination.index === source.index)
        return;

      const newStatus = destination.droppableId;

      // 즉시 UI 반영
      setLocalTasks(prev =>
        prev.map(t =>
          String(t.task_id) === String(draggableId) ? { ...t, status: newStatus } : t,
        ),
      );

      try {
        setLoading(true);
        await updateTaskStatus(projectId, draggableId, newStatus);
        toast.success("업무 상태가 변경되었습니다.");
        // 서버 동기화용 새 데이터 가져오기
        await onTasksChange?.();
      } catch (err) {
        console.error(err);
        toast.error("상태 변경 실패");
        // 실패 시 UI 롤백
        setLocalTasks(prev =>
          prev.map(t =>
            String(t.task_id) === String(draggableId) ? { ...t, status: source.droppableId } : t,
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [projectId, onTasksChange],
  );

  return { columns, loading, handleDragEnd };
}
