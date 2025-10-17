import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import { updateProject } from "../../../services/api/project";

/* ---------------------------
 * ✅ 상태 컬럼 정의 (프로젝트용)
 * --------------------------- */
const STATUS_COLUMNS = [
  { key: "PLANNED", label: "계획 🗂" },
  { key: "IN_PROGRESS", label: "진행 중 🚧" },
  { key: "ON_HOLD", label: "보류 ⏸" },
  { key: "DONE", label: "완료 ✅" },
];

export function useKanbanData() {
  const { projects, fetchTasksByProject } = useProjectGlobal();
  const [localProjects, setLocalProjects] = useState([]);

  /* ✅ 프로젝트 목록 로컬 복사 */
  useEffect(() => {
    setLocalProjects(projects || []);
  }, [projects]);

  /* ✅ 상태별 그룹화 */
  const columns = useMemo(() => {
    const map = {};
    STATUS_COLUMNS.forEach(col => (map[col.key] = []));
    localProjects.forEach(p => {
      const key = p.status?.toUpperCase() || "PLANNED";
      if (map[key]) map[key].push(p);
    });
    return STATUS_COLUMNS.map(col => ({
      key: col.key,
      label: col.label,
      tasks: map[col.key] || [],
    }));
  }, [localProjects]);

  /* ✅ Drag & Drop 상태 변경 */
  const handleDragEnd = useCallback(
    async result => {
      const { destination, source, draggableId } = result;
      if (!destination || destination.droppableId === source.droppableId) return;

      const newStatus = destination.droppableId;

      // 즉시 UI 반영
      setLocalProjects(prev =>
        prev.map(p =>
          String(p.project_id) === String(draggableId) ? { ...p, status: newStatus } : p,
        ),
      );

      try {
        const target = localProjects.find(p => String(p.project_id) === String(draggableId));
        if (!target) return;

        await updateProject(target.project_id, { status: newStatus });
        toast.success(`📦 ${target.project_name} → ${newStatus}`);
        await fetchTasksByProject(target.project_id);
      } catch (err) {
        console.error("❌ 프로젝트 상태 변경 실패:", err);
        toast.error("프로젝트 상태 변경 실패");
      }
    },
    [localProjects, fetchTasksByProject],
  );

  return { columns, handleDragEnd };
}
