// src/components/tasks/TaskCalendarView/index.jsx
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import "../../../assets/fullcalendar-custom.css";

import { useProjectDetailContext } from "../../../context/ProjectDetailContext";
import { updateTask } from "../../../services/api/task";
import UndatedTaskList from "./UndatedTaskList";
import useCalendarEvents from "./useCalendarEvents";

export default function TaskCalendarView({ onTaskClick }) {
  const { project, fetchTasks, updateTaskLocal } = useProjectDetailContext();
  const { events, undatedTasks } = useCalendarEvents();

  /* ---------------------------
   * 📅 일정 드래그 변경
   * --------------------------- */
  const handleEventDrop = async info => {
    const { id, start, end } = info.event;
    try {
      const correctedStart = dayjs(start).add(9, "hour").format("YYYY-MM-DD");
      const correctedEnd = end
        ? dayjs(end).subtract(1, "day").add(9, "hour").format("YYYY-MM-DD")
        : correctedStart;

      // ✅ Optimistic Update
      updateTaskLocal(id, {
        start_date: correctedStart,
        due_date: correctedEnd,
      });

      await updateTask(project.project_id, id, {
        start_date: correctedStart,
        due_date: correctedEnd,
      });

      toast.success(`📅 일정이 변경되었습니다 (${correctedStart} ~ ${correctedEnd})`);
      await fetchTasks(); // 서버 데이터 최신화
    } catch (err) {
      console.error("❌ 일정 변경 실패:", err);
      toast.error("일정 변경 실패");
      info.revert(); // 롤백
    }
  };

  /* ---------------------------
   * 🖱️ 업무 클릭 → 상세 패널 열기
   * --------------------------- */
  const handleEventClick = info => {
    onTaskClick?.({ task_id: info.event.id });
  };

  /* ---------------------------
   * 🧱 렌더링
   * --------------------------- */
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
      {/* 🔹 메인 캘린더 */}
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
