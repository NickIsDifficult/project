// src/components/projects/ProjectKanbanView/useKanbanData.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import { updateProject } from "../../../services/api/project";

/* ----------------------------------------
 * ✅ 상태 컬럼 정의 (ProjectStatus Enum과 일치)
 * ---------------------------------------- */
const STATUS_COLUMNS = [
  { key: "PLANNED", label: "계획 🗂" },
  { key: "IN_PROGRESS", label: "진행 중 🚧" },
  { key: "REVIEW", label: "검토 중 🔍" },
  { key: "ON_HOLD", label: "보류 ⏸" },
  { key: "DONE", label: "완료 ✅" },
];

export function useKanbanData() {
  const { projects, setProjects, fetchAllProjects } = useProjectGlobal();
  const [localProjects, setLocalProjects] = useState([]);

  /* ----------------------------------------
   * ✅ 프로젝트 목록 로컬 복사 (전역과 동기화)
   * ---------------------------------------- */
  useEffect(() => {
    if (!projects?.length) {
      setLocalProjects([]);
      return;
    }
    // diff 기반 업데이트로 부드럽게 반영
    setLocalProjects(prev => {
      const map = new Map(prev.map(p => [p.project_id, p]));
      projects.forEach(p => map.set(p.project_id, p));
      return Array.from(map.values());
    });
  }, [projects]);

  /* ----------------------------------------
   * ✅ 상태별 그룹화
   * ---------------------------------------- */
  const columns = useMemo(() => {
    const grouped = {};
    STATUS_COLUMNS.forEach(col => (grouped[col.key] = []));
    (localProjects || []).forEach(p => {
      const key = p.status?.toUpperCase() || "PLANNED";
      (grouped[key] ?? grouped["PLANNED"]).push(p);
    });
    return STATUS_COLUMNS.map(col => ({
      key: col.key,
      label: col.label,
      tasks: grouped[col.key] || [],
    }));
  }, [localProjects]);

  /* ----------------------------------------
   * ✅ Drag & Drop 상태 변경
   * ---------------------------------------- */
  const handleDragEnd = useCallback(
    async result => {
      const { destination, source, draggableId } = result;
      if (!destination || destination.droppableId === source.droppableId) return;

      const newStatus = destination.droppableId.toUpperCase();

      // 1️⃣ 로컬 UI 즉시 반영 (optimistic update)
      setLocalProjects(prev =>
        prev.map(p =>
          String(p.project_id) === String(draggableId) ? { ...p, status: newStatus } : p,
        ),
      );

      // 2️⃣ 전역 상태에도 즉시 반영
      setProjects(prev =>
        prev.map(p =>
          String(p.project_id) === String(draggableId) ? { ...p, status: newStatus } : p,
        ),
      );

      // 3️⃣ 서버 업데이트
      try {
        const target = projects.find(p => String(p.project_id) === String(draggableId));
        if (!target) return;

        await updateProject(target.project_id, { status: newStatus });
        toast.success(`📦 ${target.project_name} → ${newStatus}`);

        // 4️⃣ 전체 프로젝트 리프레시
        await fetchAllProjects();
      } catch (err) {
        console.error("❌ 프로젝트 상태 변경 실패:", err);
        toast.error("프로젝트 상태 변경 실패");
        setLocalProjects(projects); // rollback
      }
    },
    [projects, setProjects, fetchAllProjects],
  );

  return { columns, handleDragEnd };
}
