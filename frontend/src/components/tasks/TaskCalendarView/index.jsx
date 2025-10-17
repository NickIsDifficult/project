import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import "../../../assets/fullcalendar-custom.css";

import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import { updateTask } from "../../../services/api/task";
import UndatedTaskList from "./UndatedTaskList";
import useCalendarEvents from "./useCalendarEvents";

/* ----------------------------
 * 🎛️ 상단 필터 바
 * ---------------------------- */
function CalendarFilterBar({
  projects,
  activeProjectIds,
  setActiveProjectIds,
  colorMode,
  setColorMode,
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        marginBottom: 8,
        flexWrap: "wrap",
      }}
    >
      <div>
        <label style={{ fontSize: 13, marginRight: 6 }}>📁 프로젝트 필터</label>
        <select
          multiple
          size={Math.min(projects.length, 5)}
          value={activeProjectIds}
          onChange={e =>
            setActiveProjectIds(Array.from(e.target.selectedOptions, opt => Number(opt.value)))
          }
          style={{
            border: "1px solid #ccc",
            borderRadius: 6,
            padding: "4px 8px",
            fontSize: 13,
            minWidth: 200,
          }}
        >
          {projects.map(p => (
            <option key={p.project_id} value={p.project_id}>
              {p.project_name}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={() => setColorMode(prev => (prev === "assignee" ? "status" : "assignee"))}
        style={{
          border: "1px solid #ccc",
          borderRadius: 6,
          background: "#f9f9f9",
          padding: "4px 10px",
          cursor: "pointer",
          fontSize: 13,
        }}
      >
        🎨 색상 모드: {colorMode === "assignee" ? "담당자 기준" : "상태 기준"}
      </button>

      {activeProjectIds.length > 0 && (
        <button
          onClick={() => setActiveProjectIds([])}
          style={{
            border: "1px solid #ddd",
            borderRadius: 6,
            background: "#fff",
            padding: "4px 10px",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          전체 보기
        </button>
      )}
    </div>
  );
}

/* ----------------------------
 * 📅 전역 캘린더 뷰 (FullCalendar + 필터 + 로컬저장 + 드래그 추가)
 * ---------------------------- */
export default function TaskCalendarView({ onTaskClick }) {
  const {
    projects,
    fetchTasksByProject,
    updateTaskLocal,
    setOpenDrawer,
    setParentTaskId,
    setSelectedProjectId,
  } = useProjectGlobal();
  const { events, undatedTasks } = useCalendarEvents();

  /* 🧠 필터 상태 (localStorage 연동) */
  const [activeProjectIds, setActiveProjectIds] = useState(() => {
    try {
      const saved = localStorage.getItem("calendar_activeProjects");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [colorMode, setColorMode] = useState(() => {
    return localStorage.getItem("calendar_colorMode") || "assignee";
  });

  useEffect(() => {
    localStorage.setItem("calendar_activeProjects", JSON.stringify(activeProjectIds));
  }, [activeProjectIds]);

  useEffect(() => {
    localStorage.setItem("calendar_colorMode", colorMode);
  }, [colorMode]);

  /* 🎨 필터된 이벤트 계산 */
  const filteredEvents = useMemo(() => {
    if (!events.length) return [];
    const filtered = activeProjectIds.length
      ? events.filter(e => activeProjectIds.includes(e.extendedProps.project_id))
      : events;

    if (colorMode === "status") {
      return filtered.map(ev => ({
        ...ev,
        color:
          ev.extendedProps.status === "DONE"
            ? "#A5D6A7"
            : ev.extendedProps.status === "IN_PROGRESS"
              ? "#64B5F6"
              : ev.extendedProps.status === "REVIEW"
                ? "#FFB74D"
                : "#E0E0E0",
      }));
    }
    return filtered;
  }, [events, activeProjectIds, colorMode]);

  /* 📦 Drag&Drop 일정 변경 */
  const handleEventDrop = async info => {
    const { id, start, end, extendedProps } = info.event;
    const projectId = extendedProps.project_id;

    try {
      const correctedStart = dayjs(start).add(9, "hour").format("YYYY-MM-DD");
      const correctedEnd = end
        ? dayjs(end).subtract(1, "day").add(9, "hour").format("YYYY-MM-DD")
        : correctedStart;

      updateTaskLocal(id, {
        start_date: correctedStart,
        due_date: correctedEnd,
      });

      await updateTask(projectId, id, {
        start_date: correctedStart,
        due_date: correctedEnd,
      });

      toast.success(`📅 일정 변경 완료 (${correctedStart} ~ ${correctedEnd})`);
      await fetchTasksByProject(projectId);
    } catch (err) {
      console.error("❌ 일정 변경 실패:", err);
      toast.error("일정 변경 실패");
      info.revert();
    }
  };

  /* 🆕 드래그로 일정 추가 */
  const handleSelect = info => {
    const start = dayjs(info.start).add(9, "hour").format("YYYY-MM-DD");
    const end = dayjs(info.end).subtract(1, "day").add(9, "hour").format("YYYY-MM-DD");

    toast(`🆕 새 업무 등록 (${start} ~ ${end})`, { icon: "📝" });

    // Drawer 열기 + 날짜 자동 세팅
    setParentTaskId(null);
    setOpenDrawer(true);
    localStorage.setItem("newTask_start", start);
    localStorage.setItem("newTask_end", end);
  };

  /* 🖱️ 일정 클릭 → 상세 패널 열기 */
  const handleEventClick = info => {
    const { id, extendedProps } = info.event;
    onTaskClick?.({ ...extendedProps, task_id: id });
  };

  // ✅ hover tooltip: DOM에 data-tooltip attr 주입
  const handleEventDidMount = info => {
    const tip = info.event.extendedProps?.tooltip;
    if (tip && info.el) {
      info.el.setAttribute("data-tooltip", tip);
    }
  };

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
      <CalendarFilterBar
        projects={projects}
        activeProjectIds={activeProjectIds}
        setActiveProjectIds={setActiveProjectIds}
        colorMode={colorMode}
        setColorMode={setColorMode}
      />

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        selectable={true}
        select={handleSelect}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,dayGridWeek",
        }}
        height="calc(100vh - 280px)"
        locale="ko"
        firstDay={1}
        events={filteredEvents}
        editable={true}
        eventDrop={handleEventDrop}
        eventClick={handleEventClick}
        eventOverlap={true}
        dayMaxEventRows={3}
        displayEventTime={false}
        nowIndicator={true}
        eventClassNames="custom-event"
        eventDidMount={handleEventDidMount}
      />

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
