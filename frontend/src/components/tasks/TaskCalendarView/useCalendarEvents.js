import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";

/**
 * ✅ 전역 프로젝트 기반 Calendar Events Hook (2025.10 개선 버전)
 * - 모든 프로젝트의 tasksByProject 병합
 * - 담당자별 색상 / 상태별 fallback 색상 적용
 * - 상태별 className 추가 + hover tooltip 표시
 * - 날짜 없는 업무는 undatedTasks로 분리
 */
export default function useCalendarEvents() {
  const { projects, tasksByProject } = useProjectGlobal();
  const [events, setEvents] = useState([]);
  const [undatedTasks, setUndatedTasks] = useState([]);

  useEffect(() => {
    if (!projects?.length) {
      setEvents([]);
      setUndatedTasks([]);
      return;
    }

    const colorByAssignee = {};
    const colorPalette = [
      "#90caf9",
      "#81c784",
      "#ffb74d",
      "#ba68c8",
      "#4db6ac",
      "#7986cb",
      "#f06292",
      "#a1887f",
      "#64b5f6",
      "#ffd54f",
    ];
    let colorIndex = 0;

    const mergedEvents = [];
    const undated = [];

    projects.forEach(proj => {
      const tasks = tasksByProject[proj.project_id] || [];

      tasks.forEach(t => {
        const task = {
          ...t,
          project_id: proj.project_id,
          project_name: proj.project_name,
        };

        // ✅ 날짜가 지정된 업무만 이벤트로
        if (task.start_date || task.due_date) {
          // 🎨 담당자별 고유 색상 (없으면 새 할당)
          if (task.assignee_name && !colorByAssignee[task.assignee_name]) {
            colorByAssignee[task.assignee_name] = colorPalette[colorIndex++ % colorPalette.length];
          }

          const start = task.start_date || task.due_date;
          const end = task.due_date
            ? dayjs(task.due_date).add(1, "day").format("YYYY-MM-DD")
            : task.start_date;

          const statusKey = (task.status || "TODO").toLowerCase();

          // 🧩 Tooltip 내용
          const tooltip = [
            `📌 ${task.title}`,
            task.assignee_name ? `👤 담당: ${task.assignee_name}` : null,
            `📁 프로젝트: ${proj.project_name}`,
            `📅 ${task.start_date || "?"} ~ ${task.due_date || "?"}`,
            `🟢 상태: ${task.status || "TODO"}`,
          ]
            .filter(Boolean)
            .join("\n");

          mergedEvents.push({
            id: String(task.task_id),
            title: task.title,
            start,
            end,
            // ✅ 상태별 className + 담당자색 fallback
            classNames: [`status-${statusKey}`],
            backgroundColor:
              colorByAssignee[task.assignee_name] ||
              (task.status === "DONE"
                ? "#81c784"
                : task.status === "IN_PROGRESS"
                  ? "#64b5f6"
                  : task.status === "REVIEW"
                    ? "#ffb74d"
                    : "#e0e0e0"),
            borderColor: "#ccc",
            textColor: "#222",
            extendedProps: {
              ...task,
              tooltip,
              project_name: proj.project_name,
            },
          });
        } else {
          // ✅ 날짜 없는 업무 → 별도 목록
          undated.push(task);
        }
      });
    });

    setEvents(mergedEvents);
    setUndatedTasks(undated);
  }, [projects, tasksByProject]);

  return { events, undatedTasks };
}
