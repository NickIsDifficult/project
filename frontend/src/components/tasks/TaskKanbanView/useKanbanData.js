// src/components/tasks/TaskKanbanView/useKanbanData.js
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useProjectDetailContext } from "../../../context/ProjectDetailContext";
import { updateTaskStatus } from "../../../services/api/task";

const STATUS_COLUMNS = [
  { key: "TODO", label: "할 일 📝" },
  { key: "IN_PROGRESS", label: "진행 중 🚧" },
  { key: "REVIEW", label: "검토 중 🔍" },
  { key: "DONE", label: "완료 ✅" },
];

export function useKanbanData() {
  const { project, tasks, fetchTasks, updateTaskLocal } = useProjectDetailContext();

  const [localTasks, setLocalTasks] = useState(tasks);
  const [loading, setLoading] = useState(false);

  /* ---------------------------
   * tasks 변경 시 localTasks 동기화
   * --------------------------- */
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  /* ---------------------------
   * 상태별 그룹화
   * --------------------------- */
  const columns = useMemo(() => {
    const map = {};
    STATUS_COLUMNS.forEach(col => (map[col.key] = []));
    localTasks.forEach(task => {
      const key = task.status || "TODO";
      if (map[key]) map[key].push(task);
    });
    return STATUS_COLUMNS.map(col => ({
      key: col.key,
      label: col.label,
      tasks: map[col.key] || [],
    }));
  }, [localTasks]);

  /* ---------------------------
   * Drag & Drop 상태 변경
   * --------------------------- */
  const handleDragEnd = useCallback(
    async result => {
      const { destination, source, draggableId } = result;
      if (!destination) return;
      if (destination.droppableId === source.droppableId && destination.index === source.index)
        return;

      const newStatus = destination.droppableId;

      // ✅ 즉시 UI 반영 (Optimistic Update)
      setLocalTasks(prev =>
        prev.map(t =>
          String(t.task_id) === String(draggableId) ? { ...t, status: newStatus } : t,
        ),
      );
      updateTaskLocal(draggableId, { status: newStatus });

      try {
        setLoading(true);
        await updateTaskStatus(project.project_id, draggableId, newStatus);
        toast.success("업무 상태가 변경되었습니다.");
        await fetchTasks(); // ✅ 서버 데이터 동기화
      } catch (err) {
        console.error("❌ 상태 변경 실패:", err);
        toast.error("상태 변경 실패");
        // ❌ 롤백
        setLocalTasks(prev =>
          prev.map(t =>
            String(t.task_id) === String(draggableId) ? { ...t, status: source.droppableId } : t,
          ),
        );
        updateTaskLocal(draggableId, { status: source.droppableId });
      } finally {
        setLoading(false);
      }
    },
    [project, fetchTasks, updateTaskLocal],
  );

  return { columns, loading, handleDragEnd };
}
