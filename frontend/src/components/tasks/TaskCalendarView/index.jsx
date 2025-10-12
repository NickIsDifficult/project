import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import dayjs from "dayjs";
import React from "react";
import toast from "react-hot-toast";
import "../../../assets/fullcalendar-custom.css";

import { updateTask } from "../../../services/api/task";
import UndatedTaskList from "./UndatedTaskList";
import useCalendarEvents from "./useCalendarEvents";

export default function TaskCalendarView({ projectId, tasks = [], onTaskClick, onTasksChange }) {
  const { events, undatedTasks } = useCalendarEvents(tasks);

  // ---------------------------
  // ✅ 드래그 이동 (일정 변경)
  // ---------------------------
  const handleEventDrop = async info => {
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
      onTasksChange?.(); // ✅ 상위(ProjectDetailPage)의 fetchTasks() 호출
    } catch (err) {
      toast.error("일정 변경 실패");
      console.error(err);
      info.revert();
    }
  };

  // ---------------------------
  // ✅ 업무 클릭 → 상세 패널
  // ---------------------------
  const handleEventClick = info => {
    const task = tasks.find(t => String(t.task_id) === info.event.id);
    if (task) onTaskClick?.(task);
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

        <UndatedTaskList tasks={undatedTasks} onTaskClick={onTaskClick} />
      </div>
    </div>
  );
}
