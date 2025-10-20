// ✅ 완성형 useKanbanData.js
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

  /* ✅ 프로젝트 + 하위 업무 병합 */
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

  /* ✅ 상태별 그룹화 */
  const columns = useMemo(() => {
    const grouped = Object.fromEntries(STATUS_COLUMNS.map(c => [c.key, []]));
    for (const p of localProjects) {
      const key = (p.status || "PLANNED").toUpperCase();
      if (grouped[key]) grouped[key].push(p);
      else grouped.PLANNED.push(p); // 예외 안전처리
    }
    return STATUS_COLUMNS.map(c => ({
      key: c.key,
      label: c.label,
      items: grouped[c.key],
    }));
  }, [localProjects]);

  /* ✅ 담당자 옵션 */
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

  /* ✅ 통계 */
  const stats = useMemo(() => {
    const result = { total: 0, DONE: 0 };
    localProjects.forEach(p => {
      result.total++;
      result[p.status?.toUpperCase()] = (result[p.status?.toUpperCase()] ?? 0) + 1;
      p.tasks?.forEach(t => {
        result.total++;
        result[t.status?.toUpperCase()] = (result[t.status?.toUpperCase()] ?? 0) + 1;
      });
    });
    result.doneRatio = result.total ? Math.round((result.DONE / result.total) * 100) : 0;
    return result;
  }, [localProjects]);

  /* ✅ 드래그 핸들러 */
  const handleDragEnd = useCallback(
    async result => {
      const { destination, source, draggableId, type } = result;
      if (!destination) return;
      if (destination.droppableId === source.droppableId && destination.index === source.index)
        return;

      const newStatus = destination.droppableId.replace("tasks-", "").toUpperCase();

      const before = structuredClone(localProjects);
      let draggedItem = null;
      let parentProjectId = null;

      if (type === "project") {
        draggedItem = localProjects.find(p => String(p.project_id) === draggableId);
      } else if (type === "task") {
        for (const p of localProjects) {
          const task = p.tasks.find(t => String(t.task_id) === draggableId);
          if (task) {
            draggedItem = task;
            parentProjectId = p.project_id;
            break;
          }
        }
      }
      if (!draggedItem) return;

      const isAuthorized =
        draggedItem.owner_id === currentUser?.emp_id ||
        draggedItem.assignees?.some(a => a.emp_id === currentUser?.emp_id);
      if (!isAuthorized) return toast.error("이 항목을 이동할 권한이 없습니다 ❌");

      setLocalProjects(prev =>
        prev.map(p => {
          if (type === "project" && p.project_id === draggedItem.project_id)
            return { ...p, status: newStatus };
          if (type === "task" && p.project_id === parentProjectId)
            return {
              ...p,
              tasks: p.tasks.map(t =>
                t.task_id === draggedItem.task_id ? { ...t, status: newStatus } : t,
              ),
            };
          return p;
        }),
      );

      try {
        if (type === "project") await updateProject(draggedItem.project_id, { status: newStatus });
        else await updateTask(draggedItem.task_id, { status: newStatus });
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

  /* ✅ 프로젝트별 색상 */
  const projectColorMap = useMemo(() => {
    const palette = ["#FFB6B9", "#FAE3D9", "#BBDED6", "#61C0BF", "#F4A261", "#AED581"];
    return Object.fromEntries(
      projects?.map((p, i) => [p.project_id, palette[i % palette.length]]) ?? [],
    );
  }, [projects]);

  return { columns, stats, assigneeOptions, handleDragEnd, projectColorMap };
}
