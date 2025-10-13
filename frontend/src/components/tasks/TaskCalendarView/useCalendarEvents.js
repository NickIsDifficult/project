// src/components/tasks/TaskCalendarView/useCalendarEvents.js
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useProjectDetailContext } from "../../../context/ProjectDetailContext";

/**
 * 📅 tasks 배열을 FullCalendar용 events + undatedTasks로 변환
 * - Context 기반: useProjectDetailContext()로 tasks 자동 접근
 * - 담당자별 색상 지정, 상태별 기본색상 지정
 * - start_date / due_date 없는 task는 undatedTasks로 분리
 */
export default function useCalendarEvents() {
  const { tasks } = useProjectDetailContext();
  const [events, setEvents] = useState([]);
  const [undatedTasks, setUndatedTasks] = useState([]);

  useEffect(() => {
    if (!tasks || tasks.length === 0) {
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

    const dated = [];
    const undated = [];

    tasks.forEach(t => {
      if (t.start_date || t.due_date) {
        // 🎨 담당자별 고유 색상 할당
        if (t.assignee_name && !colorByAssignee[t.assignee_name]) {
          colorByAssignee[t.assignee_name] = colorPalette[colorIndex++ % colorPalette.length];
        }

        const start = t.start_date || t.due_date;
        const end = t.due_date
          ? dayjs(t.due_date).add(1, "day").format("YYYY-MM-DD")
          : t.start_date;

        dated.push({
          id: String(t.task_id),
          title: t.title + (t.assignee_name ? ` (${t.assignee_name})` : ""),
          start,
          end,
          color:
            colorByAssignee[t.assignee_name] ||
            (t.status === "DONE"
              ? "#81c784"
              : t.status === "IN_PROGRESS"
                ? "#64b5f6"
                : t.status === "REVIEW"
                  ? "#ffb74d"
                  : "#e0e0e0"),
          borderColor: "#ccc",
          textColor: "#222",
        });
      } else {
        undated.push(t);
      }
    });

    setEvents(dated);
    setUndatedTasks(undated);
  }, [tasks]);

  return { events, undatedTasks };
}
