// src/components/projects/ProjectCalendarView/index.jsx
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";

import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import { updateTask } from "../../../services/api/task";
import { renderTooltip } from "../utils/renderTooltip";
import CalendarFilterBar from "./CalendarFilterBar";
import UndatedProjectList from "./UndatedProjectList";
import useCalendarEvents from "./useCalendarEvents";
import { useCalendarSettings } from "./useCalendarSettings";

import "./ProjectCalendarView.css";

export default function ProjectCalendarView({ onTaskClick, onProjectClick }) {
  const { projects, updateTaskLocal, setUiState, setSelectedProject } = useProjectGlobal();
  const { colorMode, setColorMode, activeProjectIds, setActiveProjectIds } = useCalendarSettings();
  const { events, undatedTasks, projectColorMap } = useCalendarEvents(colorMode, activeProjectIds);

  /* 📦 일정 이동 */
  const handleEventDrop = async info => {
    const { id, start, end, extendedProps } = info.event;
    if (extendedProps.isProject) {
      toast.error("프로젝트 기간은 직접 이동할 수 없습니다.");
      return info.revert();
    }

    const projectId = extendedProps.project_id;
    const startDate = dayjs(start).format("YYYY-MM-DD");
    const endDate = end ? dayjs(end).subtract(1, "day").format("YYYY-MM-DD") : startDate;

    try {
      updateTaskLocal(id, { start_date: startDate, due_date: endDate });
      await updateTask(projectId, id, { start_date: startDate, due_date: endDate });
      toast.success(`📅 일정 변경: ${startDate} ~ ${endDate}`);
    } catch (err) {
      console.error("❌ 일정 변경 실패:", err);
      toast.error("일정 변경 실패");
      info.revert();
    }
  };

  /* 🆕 선택 → 새 업무 등록 */
  const handleSelect = info => {
    const start = dayjs(info.start).format("YYYY-MM-DD");
    const end = dayjs(info.end).subtract(1, "day").format("YYYY-MM-DD");
    toast(`🆕 새 업무 등록 (${start} ~ ${end})`, { icon: "📝" });
    setUiState(prev => ({
      ...prev,
      drawer: { ...prev.drawer, task: true, parentTaskId: null },
    }));
    localStorage.setItem("newTask_start", start);
    localStorage.setItem("newTask_end", end);
  };

  /* 🖱️ 클릭 → 프로젝트 or 업무 상세 */
  const handleEventClick = info => {
    const { id, extendedProps } = info.event;
    if (extendedProps.isProject) {
      const proj = projects.find(p => p.project_id === extendedProps.project_id);
      if (proj) {
        setSelectedProject(proj);
        onProjectClick?.(proj);
      }
      return;
    }
    onTaskClick?.({ ...extendedProps, task_id: id });
  };

  /* 💬 Tooltip 렌더링 */
  const handleEventDidMount = info => {
    const html = renderTooltip(info.event, !!info.event.extendedProps.isProject);
    tippy(info.el, {
      content: html,
      allowHTML: true,
      theme: "plain",
      placement: "top",
      interactive: true,
      delay: [100, 50],
      maxWidth: 320,
    });
  };

  /* 📅 오늘 날짜 강조 */
  const handleDayCellDidMount = info => {
    if (dayjs().isSame(info.date, "day")) {
      info.el.style.border = "2px solid #2196F3";
      info.el.style.background = "#E3F2FD";
    }
  };

  /* 🎨 프로젝트 / 업무 시각 구분 + 색상 모드 적용 */
  const handleEventContent = arg => {
    const { extendedProps } = arg.event;
    const isProject = extendedProps.isProject;
    const rawTitle =
      arg.event.title ||
      extendedProps.title ||
      extendedProps.task_name ||
      extendedProps.project_name ||
      "제목 없음";
    const hasIcon = rawTitle.startsWith("📁") || rawTitle.startsWith("📝");
    const displayTitle = hasIcon ? rawTitle : `${isProject ? "📁" : "📝"} ${rawTitle}`;
    const color = arg.event.backgroundColor || arg.event.color || "#ddd";

    return {
      html: `
        <div style="
          padding:2px 4px;
          border-left:4px solid ${color};
          font-weight:${isProject ? 600 : 400};
          background:${isProject ? "#E3F2FD" : "#fff"};
          border-radius:4px;
          font-size:12px;
          line-height:1.3;">
          ${displayTitle}
        </div>
      `,
    };
  };

  /* 🎨 색상 모드 라벨 */
  const getColorModeLabel = () => {
    switch (colorMode) {
      case "assignee":
        return "담당자 기준";
      case "status":
        return "상태 기준";
      case "project":
        return "프로젝트 기준";
      case "priority":
        return "우선순위 기준";
      default:
        return "프로젝트 기준";
    }
  };

  return (
    <div className="calendar-container">
      <CalendarFilterBar
        projects={projects}
        activeProjectIds={activeProjectIds}
        setActiveProjectIds={setActiveProjectIds}
        colorMode={colorMode}
        setColorMode={setColorMode}
      />

      {/* 🎨 현재 색상 모드 안내 */}
      <div style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>
        🎨 현재 색상 기준: <b>{getColorModeLabel()}</b>
      </div>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        selectable
        select={handleSelect}
        events={events}
        editable
        eventDrop={handleEventDrop}
        eventClick={handleEventClick}
        eventDidMount={handleEventDidMount}
        eventContent={handleEventContent}
        dayCellDidMount={handleDayCellDidMount}
        displayEventTime={false}
        dayMaxEventRows={3}
        locale="ko"
        firstDay={1}
        height="auto"
        contentHeight="auto"
        windowResize
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,dayGridWeek",
        }}
      />

      <div className="calendar-undated">
        <h4 className="calendar-subtitle">📋 날짜 미지정 업무 ({undatedTasks.length})</h4>
        <UndatedProjectList
          tasks={undatedTasks}
          colorMode={colorMode}
          projectColorMap={projectColorMap}
          onTaskClick={onTaskClick}
        />
      </div>
    </div>
  );
}
