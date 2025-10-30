// src/components/projects/ProjectKanbanView/hooks/useKanbanState.js
import { useCallback, useEffect, useMemo, useState } from "react";
import { useProjectGlobal } from "../../../../context/ProjectGlobalContext";
import { STATUS_COLUMNS } from "../../constants/statusMaps";

/**
 * ✅ projects + tasksByProject 병합 후
 *    프로젝트와 업무를 모두 개별 카드로 취급 (동일 레벨에 존재)
 */
export function useKanbanState() {
  const { projects, tasksByProject } = useProjectGlobal();
  const [localData, setLocalData] = useState({ projects: [], tasks: [] });

  // 1️⃣ 프로젝트 + 업무 병합 (평탄화 구조)
  useEffect(() => {
    if (!projects?.length) return;
    const hasTasks = Object.keys(tasksByProject || {}).length > 0;
    if (!hasTasks) return;

    // 전체 프로젝트
    const mergedProjects = projects.map(p => ({
      ...p,
      type: "project",
      status: (p.status || "PLANNED").toUpperCase(),
    }));

    // 전체 업무 (프로젝트별로 추출 후 합침)
    const mergedTasks = Object.entries(tasksByProject || {}).flatMap(([pid, list]) =>
      flattenTasks(list).map(t => ({
        ...t,
        type: "task",
        project_id: Number(pid),
        project_name: projects.find(p => Number(p.project_id) === Number(pid))?.project_name ?? "",
        status: (t.status || "PLANNED").toUpperCase(),
      })),
    );

    setLocalData({ projects: mergedProjects, tasks: mergedTasks });
  }, [projects, tasksByProject]);

  // 2️⃣ 컬럼 그룹화 (프로젝트 + 업무 동일 레벨)
  const columns = useMemo(() => {
    const grouped = { PLANNED: [], IN_PROGRESS: [], REVIEW: [], ON_HOLD: [], DONE: [] };

    // 프로젝트 카드 추가
    localData.projects.forEach(p => {
      grouped[p.status]?.push(p);
    });

    // 업무 카드 추가
    localData.tasks.forEach(t => {
      grouped[t.status]?.push(t);
    });

    return STATUS_COLUMNS.map(c => ({
      key: c.key,
      label: c.label,
      items: grouped[c.key] || [],
    }));
  }, [localData]);

  // 3️⃣ 담당자 옵션 (중복 제거)
  const assigneeOptions = useMemo(() => {
    const names = new Set();
    localData.projects.forEach(p => p.owner_name && names.add(p.owner_name));
    localData.tasks.forEach(t => t.assignees?.forEach(a => a?.name && names.add(a.name)));
    return ["ALL", ...Array.from(names)];
  }, [localData]);

  // 4️⃣ 프로젝트별 색상 매핑
  const projectColorMap = useMemo(() => {
    const palette = ["#FFB6B9", "#FAE3D9", "#BBDED6", "#61C0BF", "#F4A261", "#AED581"];
    return Object.fromEntries(
      (projects || []).map(p => [p.project_id, palette[p.project_id % palette.length]]),
    );
  }, [projects]);

  // 5️⃣ 필터링 (검색어, 상태, 담당자)
  const filterProjectsAndTasks = useCallback(
    (cols, { keyword = "", status = "ALL", assignee = "ALL" }) => {
      const kw = keyword.trim().toLowerCase();

      return cols.map(col => ({
        ...col,
        items: col.items.filter(item => {
          // 🔍 키워드 필터
          if (kw) {
            const text =
              item.type === "project"
                ? item.project_name?.toLowerCase()
                : item.title?.toLowerCase();
            if (!text?.includes(kw)) return false;
          }

          // 🧾 상태 필터
          if (status !== "ALL" && item.status !== status) return false;

          // 👤 담당자 필터
          if (assignee !== "ALL") {
            if (item.type === "project") {
              if (item.owner_name !== assignee) return false;
            } else {
              const hasMatch = item.assignees?.some(a => a?.name === assignee);
              if (!hasMatch) return false;
            }
          }

          return true;
        }),
      }));
    },
    [],
  );

  return { columns, assigneeOptions, projectColorMap, filterProjectsAndTasks };
}

/**
 * 🔁 재귀적으로 하위업무(subtasks) 펼쳐주는 유틸
 */
function flattenTasks(list) {
  if (!Array.isArray(list)) return [];
  const all = [];
  for (const t of list) {
    all.push(t);
    if (Array.isArray(t.subtasks) && t.subtasks.length) {
      all.push(...flattenTasks(t.subtasks));
    }
  }
  return all;
}
