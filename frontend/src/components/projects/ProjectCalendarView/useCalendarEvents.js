// src/components/projects/ProjectCalendarView/useCalendarEvents.js
import dayjs from "dayjs";
import { useMemo } from "react";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import { getTaskColor } from "../constants/taskDisplay";

export default function useCalendarEvents(
  colorMode = "status",
  activeProjectIds = [],
  searchKeyword = "",
) {
  const { projects, tasksByProject } = useProjectGlobal();

  // 🎨 프로젝트 색상 팔레트
  const projectColorMap = useMemo(() => {
    const palette = [
      "#90CAF9",
      "#A5D6A7",
      "#FFCC80",
      "#BA68C8",
      "#4DB6AC",
      "#F48FB1",
      "#CE93D8",
      "#81D4FA",
      "#FFAB91",
    ];
    const map = {};
    projects.forEach((p, i) => (map[p.project_id] = palette[i % palette.length]));
    return map;
  }, [projects]);

  // 📁 프로젝트 이벤트
  const projectEvents = useMemo(() => {
    return projects
      .filter(p => p.start_date && p.end_date)
      .map(p => ({
        id: `proj-${p.project_id}`,
        title: `📁 ${p.project_name}`,
        start: p.start_date,
        end: dayjs(p.end_date).add(1, "day").format("YYYY-MM-DD"),
        allDay: true,
        backgroundColor: projectColorMap[p.project_id],
        borderColor: "#bbb",
        textColor: "#111",
        extendedProps: {
          isProject: true,
          project_id: Number(p.project_id),
          project_name: p.project_name,
        },
      }));
  }, [projects, projectColorMap]);

  // 🧩 업무(Task) + 모든 하위업무(subtasks) 재귀 처리
  const taskEvents = useMemo(() => {
    const allEvents = [];

    // 🔁 모든 하위 업무를 평탄화
    const flattenTasks = (tasks, projectId) => {
      if (!Array.isArray(tasks)) return;

      tasks.forEach(task => {
        if (!task) return;

        // 일정이 있는 업무만 추가
        if (task.start_date || task.due_date) {
          allEvents.push({
            id: task.task_id,
            title: task.title || task.task_name || "제목 없음",
            start: task.start_date,
            end: dayjs(task.due_date).add(1, "day").format("YYYY-MM-DD"),
            allDay: true,
            color: getTaskColor(task, colorMode, projectColorMap),
            textColor: "#111",
            extendedProps: {
              ...task,
              project_id: Number(projectId),
              isProject: false,
            },
          });
        }

        // 하위 업무가 있으면 재귀 호출
        if (Array.isArray(task.subtasks) && task.subtasks.length > 0) {
          flattenTasks(task.subtasks, projectId);
        }
      });
    };

    // 각 프로젝트별 flatten 수행
    for (const [projectId, tasks] of Object.entries(tasksByProject)) {
      flattenTasks(tasks, projectId);
    }

    return allEvents;
  }, [tasksByProject, colorMode, projectColorMap]);

  // 📋 날짜 미지정 업무 (하위 포함)
  const undatedTasks = useMemo(() => {
    const list = [];

    const collectUndated = (tasks, projectId) => {
      if (!Array.isArray(tasks)) return;
      tasks.forEach(task => {
        if (!task) return;
        if (!task.start_date && !task.due_date) {
          list.push({ ...task, project_id: Number(projectId) });
        }
        if (Array.isArray(task.subtasks) && task.subtasks.length > 0) {
          collectUndated(task.subtasks, projectId);
        }
      });
    };

    for (const [pid, tasks] of Object.entries(tasksByProject)) {
      collectUndated(tasks, pid);
    }

    return list;
  }, [tasksByProject]);

  // ✅ 프로젝트 + 업무 통합
  const combined = useMemo(() => [...projectEvents, ...taskEvents], [projectEvents, taskEvents]);

  // 🔍 선택 + 검색 필터
  const filtered = useMemo(() => {
    let result = combined;

    // 선택된 프로젝트만
    if (activeProjectIds.length > 0) {
      const ids = activeProjectIds.map(Number);
      result = result.filter(ev => ids.includes(ev.extendedProps.project_id));
    }

    // 검색어 필터
    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      result = result.filter(
        ev =>
          ev.title?.toLowerCase().includes(kw) ||
          ev.extendedProps.project_name?.toLowerCase().includes(kw),
      );
    }

    return result;
  }, [combined, activeProjectIds, searchKeyword]);

  return { events: filtered, undatedTasks, projectColorMap };
}
