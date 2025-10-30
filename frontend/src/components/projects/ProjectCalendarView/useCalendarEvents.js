// src/components/projects/ProjectCalendarView/useCalendarEvents.js
import dayjs from "dayjs";
import { useMemo } from "react";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import { getTaskColor } from "../constants/taskDisplay";

export default function useCalendarEvents(colorMode = "status", activeProjectIds = []) {
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

  // 📁 프로젝트 기간 이벤트
  const projectEvents = useMemo(() => {
    return projects
      .filter(p => p.start_date && p.end_date)
      .map(p => ({
        id: `proj-${p.project_id}`,
        title: p.project_name, // 📁 제거 (중복 방지)
        start: p.start_date,
        end: dayjs(p.end_date).add(1, "day").format("YYYY-MM-DD"),
        allDay: true,
        backgroundColor: projectColorMap[p.project_id],
        borderColor: "#bbb",
        textColor: "#111",
        extendedProps: {
          isProject: true,
          project_id: p.project_id,
          project_name: p.project_name,
        },
      }));
  }, [projects, projectColorMap]);

  // 🧩 업무(Task) 이벤트
  const taskEvents = useMemo(() => {
    const allEvents = [];
    for (const [projectId, tasks] of Object.entries(tasksByProject)) {
      tasks.forEach(task => {
        if (!task.start_date && !task.due_date) return;

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
      });
    }
    return allEvents;
  }, [tasksByProject, colorMode, projectColorMap]);

  // 📋 날짜 미지정 업무
  const undatedTasks = useMemo(() => {
    const list = [];
    for (const [pid, tasks] of Object.entries(tasksByProject)) {
      tasks.forEach(task => {
        if (!task.start_date && !task.due_date) list.push({ ...task, project_id: Number(pid) });
      });
    }
    return list;
  }, [tasksByProject]);

  // 🔍 필터
  const filteredEvents = useMemo(() => {
    const combined = [...projectEvents, ...taskEvents];
    if (!activeProjectIds.length) return combined;
    return combined.filter(ev => activeProjectIds.includes(ev.extendedProps.project_id));
  }, [projectEvents, taskEvents, activeProjectIds]);

  return { events: filteredEvents, undatedTasks, projectColorMap };
}
