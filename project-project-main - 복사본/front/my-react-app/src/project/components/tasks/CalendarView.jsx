import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import "../../assets/fullcalendar-custom.css";
import { updateTask } from "../../services/api/task";

export default function CalendarView({ projectId, tasks = [], onTaskClick, onTaskMove }) {
  const [events, setEvents] = useState([]);

  // ---------------------------
  // ✅ 태스크 → 캘린더 이벤트 변환
  // ---------------------------
  useEffect(() => {
    if (!tasks || tasks.length === 0) {
      setEvents([]);
      return;
    }

    const colorByAssignee = {};
    const colorPalette = [
      "#90caf9", "#81c784", "#ffb74d", "#ba68c8", "#4db6ac",
      "#7986cb", "#f06292", "#a1887f", "#64b5f6", "#ffd54f"
    ];
    let colorIndex = 0;

    const mapped = tasks
      .filter((t) => t.start_date || t.due_date) // ✅ 날짜 있는 업무만 캘린더에 표시
      .map((t) => {
        if (t.assignee_name && !colorByAssignee[t.assignee_name]) {
          colorByAssignee[t.assignee_name] = colorPalette[colorIndex++ % colorPalette.length];
        }

        // FullCalendar의 end는 exclusive → 하루 추가
        const end = t.due_date
          ? dayjs(t.due_date).add(1, "day").format("YYYY-MM-DD")
          : t.start_date;

        return {
          id: String(t.task_id),
          title: t.title + (t.assignee_name ? ` (${t.assignee_name})` : ""),
          start: t.start_date,
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
        };
      });

    setEvents(mapped);
  }, [tasks]);

  // ---------------------------
  // ✅ 날짜 없는 업무 (별도 리스트)
  // ---------------------------
  const undatedTasks = tasks.filter((t) => !t.start_date && !t.due_date);

  // ---------------------------
  // ✅ 드래그 이동 (일정 변경)
  // ---------------------------
  const handleEventDrop = async (info) => {
    const { id, start, end } = info.event;
    try {
      const correctedStart = dayjs(start).add(9, "hour").format("YYYY-MM-DD");
      const correctedEnd = end
        ? dayjs(end).subtract(1, "day").add(9, "hour").format("YYYY-MM-DD")
        : correctedStart;

      await updateTask(projectId, id, {
        start_date: correctedStart,
        due_date: correctedEnd,
      });

      toast.success(`📅 일정이 변경되었습니다 (${correctedStart} ~ ${correctedEnd})`);
      onTaskMove?.();
    } catch (err) {
      toast.error("일정 변경 실패");
      console.error(err);
      info.revert();
    }
  };

  // ---------------------------
  // ✅ 업무 클릭 → 상세 패널
  // ---------------------------
  const handleEventClick = (info) => {
    const task = tasks.find((t) => String(t.task_id) === info.event.id);
    if (task) onTaskClick(task);
  };

  // ---------------------------
  // ✅ 렌더링
  // ---------------------------
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 8,
        minHeight: "65vh",
      }}
    >
      {/* 🔹 캘린더 본체 */}
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,dayGridWeek",
        }}
        height="calc(100vh - 280px)"
        locale="ko"
        firstDay={1}
        events={events}
        editable={true}
        eventDrop={handleEventDrop}
        eventClick={handleEventClick}
        eventOverlap={true}
        dayMaxEventRows={3}
        displayEventTime={false}
        nowIndicator={true}
        eventClassNames="custom-event"
      />

      {/* 🔸 날짜 미지정 업무 리스트 */}
      <div
        style={{
          marginTop: 16,
          borderTop: "1px solid #eee",
          paddingTop: 8,
        }}
      >
        <h4 style={{ fontSize: 14, color: "#555", marginBottom: 6 }}>
          📋 날짜 미지정 업무 ({undatedTasks.length})
        </h4>

        {undatedTasks.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {undatedTasks.map((t) => (
              <li
                key={t.task_id}
                onClick={() => onTaskClick(t)}
                style={{
                  padding: "6px 10px",
                  border: "1px solid #eee",
                  borderRadius: 6,
                  marginBottom: 4,
                  cursor: "pointer",
                  background: "#fafafa",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#fafafa")}
              >
                <span style={{ fontWeight: 500 }}>{t.title}</span>
                {t.assignee_name && (
                  <span style={{ color: "#777" }}> ({t.assignee_name})</span>
                )}
                <span
                  style={{
                    background: "#ffecb3",
                    color: "#555",
                    fontSize: 12,
                    padding: "1px 5px",
                    borderRadius: 4,
                    marginLeft: 6,
                  }}
                >
                  ⏳ 날짜 미지정
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ fontSize: 13, color: "#888" }}>
            모든 업무가 날짜를 가지고 있습니다 🎉
          </div>
        )}
      </div>
    </div>
  );
}
