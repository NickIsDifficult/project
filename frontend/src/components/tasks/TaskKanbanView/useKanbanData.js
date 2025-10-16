// src/components/tasks/TaskKanbanView/useKanbanData.js
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import { updateTaskStatus } from "../../../services/api/task";

/* ---------------------------
 * ✅ 상태 컬럼 정의
 * --------------------------- */
const STATUS_COLUMNS = [
  { key: "TODO", label: "할 일 📝" },
  { key: "IN_PROGRESS", label: "진행 중 🚧" },
  { key: "REVIEW", label: "검토 중 🔍" },
  { key: "DONE", label: "완료 ✅" },
];

export function useKanbanData() {
  const { projects, tasksByProject, fetchTasksByProject } = useProjectGlobal();
  const [localTasks, setLocalTasks] = useState([]);

  /* ---------------------------
   * ✅ 모든 프로젝트의 업무 합치기
   * --------------------------- */
  useEffect(() => {
    const merged = [];
    projects.forEach(project => {
      const tasks = tasksByProject[project.project_id] || [];
      tasks.forEach(t => {
        merged.push({
          ...t,
          project_id: project.project_id,
          project_name: project.project_name,
        });
      });
    });
    setLocalTasks(merged);
  }, [projects, tasksByProject]);

  /* ---------------------------
   * ✅ 상태별 그룹화
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
   * ✅ Drag & Drop 상태 변경
   * --------------------------- */
  const handleDragEnd = useCallback(
    async result => {
      const { destination, source, draggableId } = result;
      if (!destination) return;
      if (destination.droppableId === source.droppableId) return;

      const newStatus = destination.droppableId;

      // ✅ 즉시 UI 반영
      setLocalTasks(prev =>
        prev.map(t =>
          String(t.task_id) === String(draggableId) ? { ...t, status: newStatus } : t,
        ),
      );

      // ✅ 서버 동기화
      try {
        const targetTask = localTasks.find(t => String(t.task_id) === String(draggableId));
        if (!targetTask) return;

        await updateTaskStatus(targetTask.project_id, draggableId, newStatus);
        toast.success(`[${targetTask.project_name}] 상태 변경 완료 (${newStatus})`);

        // 해당 프로젝트만 다시 fetch
        await fetchTasksByProject(targetTask.project_id);
      } catch (err) {
        console.error("❌ 상태 변경 실패:", err);
        toast.error("상태 변경 실패");
      }
    },
    [localTasks, fetchTasksByProject],
  );

  return { columns, handleDragEnd };
}
