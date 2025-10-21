// src/components/projects/ProjectKanbanView/useKanbanData.js
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import { useAuth } from "../../../hooks/useAuth";
import { updateProject } from "../../../services/api/project";
import { updateTask } from "../../../services/api/task";
import { STATUS_COLUMNS } from "../constants/statusMaps";

export function useKanbanData() {
  const { projects, tasksByProject, fetchAllProjects } = useProjectGlobal();
  const { currentUser } = useAuth();
  const [localProjects, setLocalProjects] = useState([]);

  /* ✅ 1. 프로젝트 + 하위 업무 병합 */
  useEffect(() => {
    if (!projects?.length) return;
    const hasTasks = Object.keys(tasksByProject).length > 0;
    if (!hasTasks) return;

    const merged = projects.map(p => ({
      ...p,
      type: "project",
      status: (p.status || "PLANNED").toUpperCase(),
      tasks:
        tasksByProject[p.project_id]?.map(t => ({
          ...t,
          type: "task",
          project_id: p.project_id,
          project_name: p.project_name,
          status: (t.status || "PLANNED").toUpperCase(),
        })) ?? [],
    }));

    setLocalProjects(merged);
  }, [projects, tasksByProject]);

  /* ✅ 2. 상태별 그룹화 (STATUS_COLUMNS 기준 순서 유지) */
  const columns = useMemo(() => {
    const grouped = localProjects.reduce((acc, p) => {
      const key = (p.status || "PLANNED").toUpperCase();
      if (!acc[key]) acc[key] = [];
      acc[key].push(p);
      return acc;
    }, {});

    return STATUS_COLUMNS.map(c => ({
      key: c.key,
      label: c.label,
      items: grouped[c.key] || [],
    }));
  }, [localProjects]);

  /* ✅ 3. 담당자 목록 (중복 제거) */
  const assigneeOptions = useMemo(() => {
    const names = new Set();
    localProjects.forEach(p => {
      if (p.owner_name) names.add(p.owner_name);
      if (p.owner?.name) names.add(p.owner.name);
      p.tasks?.forEach(t => {
        t.assignees?.forEach(a => {
          const n = a?.name || a?.emp_name || a?.employee_name;
          if (n) names.add(n);
        });
      });
    });
    return ["ALL", ...Array.from(names)];
  }, [localProjects]);

  /* ✅ 4. 통계 데이터 (상태별 개수 + 완료 비율) */
  const stats = useMemo(() => {
    const result = localProjects.reduce(
      (acc, p) => {
        acc.total += 1;
        acc[p.status] = (acc[p.status] ?? 0) + 1;
        p.tasks?.forEach(t => {
          acc.total += 1;
          acc[t.status] = (acc[t.status] ?? 0) + 1;
        });
        return acc;
      },
      { total: 0, DONE: 0 },
    );
    result.doneRatio = result.total ? Math.round((result.DONE / result.total) * 100) : 0;
    return result;
  }, [localProjects]);

  /* ✅ 5. 드래그 핸들러 */
  const handleDragEnd = useCallback(
    async ({ destination, source, draggableId, type }) => {
      if (!destination) return;
      if (destination.droppableId === source.droppableId && destination.index === source.index)
        return;

      // droppableId = 상태 key (PLANNED, IN_PROGRESS, ...)
      const newStatus = destination.droppableId.toUpperCase();

      // prefix 구분: "project-1", "task-15"
      const [dragType, rawId] = draggableId.split("-");
      const id = Number(rawId);

      const before = JSON.parse(JSON.stringify(localProjects)); // 안전 복제
      let draggedItem = null;
      let parentProjectId = null;

      if (dragType === "project") {
        draggedItem = localProjects.find(p => p.project_id === id);
      } else if (dragType === "task") {
        for (const p of localProjects) {
          const t = p.tasks.find(t => t.task_id === id);
          if (t) {
            draggedItem = t;
            parentProjectId = p.project_id;
            break;
          }
        }
      }
      if (!draggedItem) return;

      // 권한 체크
      const userId = currentUser?.emp_id;
      const isAuthorized =
        Number(draggedItem.owner_id) === userId ||
        (Array.isArray(draggedItem.assignees) &&
          draggedItem.assignees.some(a => Number(a.emp_id) === userId));

      if (!isAuthorized) return toast.error("이 항목을 이동할 권한이 없습니다 ❌");

      // 낙관적 UI 업데이트
      setLocalProjects(prev =>
        prev.map(p => {
          if (dragType === "project" && p.project_id === id) return { ...p, status: newStatus };
          if (dragType === "task" && p.project_id === parentProjectId)
            return {
              ...p,
              tasks: p.tasks.map(t => (t.task_id === id ? { ...t, status: newStatus } : t)),
            };
          return p;
        }),
      );

      try {
        if (dragType === "project") await updateProject(id, { status: newStatus });
        else await updateTask(id, { status: newStatus });
        toast.success("상태 변경 완료 ✅");
        fetchAllProjects();
      } catch (err) {
        console.error(err);
        toast.error("상태 변경 실패. 복구합니다.");
        setLocalProjects(before);
      }
    },
    [localProjects, currentUser, fetchAllProjects],
  );

  /* ✅ 6. 프로젝트별 색상 (ID 기반 고정) */
  const projectColorMap = useMemo(() => {
    const palette = ["#FFB6B9", "#FAE3D9", "#BBDED6", "#61C0BF", "#F4A261", "#AED581"];
    return Object.fromEntries(
      projects?.map(p => [p.project_id, palette[p.project_id % palette.length]]) ?? [],
    );
  }, [projects]);

  return {
    columns,
    stats,
    assigneeOptions,
    handleDragEnd,
    projectColorMap,
  };
}
