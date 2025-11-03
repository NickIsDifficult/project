// ✅ FULL UPDATED FILE — src/components/projects/ProjectCalendarView/index.jsx
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
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
  const [searchKeyword, setSearchKeyword] = useState("");
  const { events, undatedTasks, projectColorMap } = useCalendarEvents(
    colorMode,
    activeProjectIds,
    searchKeyword,
  );

  const externalRef = useRef(null);

  /* ✅ Draggable 설정 (날짜 미지정 업무 → 캘린더로 드래그) */
  useEffect(() => {
    if (externalRef.current) {
      new Draggable(externalRef.current, {
        itemSelector: "li[draggable='true']",
        eventData: el => {
          console.log("🧩 [eventData] el passed to FullCalendar =", el);
          console.log("🧩 [eventData] dataset =", el.dataset);

          const raw = JSON.parse(el.dataset.raw || "{}");
          return {
            title: raw.title || el.innerText || "업무",
            extendedProps: raw, // ✅ v6 방식: drop 이벤트에서 info.event.extendedProps로 전달됨
          };
        },
      });
    }
  }, []);

  /* 📦 일정 이동 (캘린더 내 드래그 이동) */
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

  /* 📏 일정 길이 조정 */
  const handleEventResize = async info => {
    const { id, start, end, extendedProps } = info.event;
    if (extendedProps.isProject) {
      toast.error("프로젝트 기간은 직접 조정할 수 없습니다.");
      return info.revert();
    }

    const projectId = extendedProps.project_id;
    const startDate = dayjs(start).format("YYYY-MM-DD");
    const endDate = end ? dayjs(end).subtract(1, "day").format("YYYY-MM-DD") : startDate;

    try {
      updateTaskLocal(id, { start_date: startDate, due_date: endDate });
      await updateTask(projectId, id, { start_date: startDate, due_date: endDate });
      toast.success(`📏 기간 변경: ${startDate} ~ ${endDate}`);
    } catch (err) {
      console.error("❌ 기간 변경 실패:", err);
      toast.error("기간 변경 실패");
      info.revert();
    }
  };

  /* 🆕 날짜 선택 → 새 업무 생성 */
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

  /* 🖱️ 이벤트 클릭 → 상세 보기 */
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

  /* 💬 Tooltip */
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
      info.el.style.border = "2px solid #9C27B0";
      info.el.style.background = "#F3E5F5";
      info.el.style.borderRadius = "6px";
      info.el.style.boxShadow = "inset 0 0 4px rgba(0,0,0,0.05)";
    }
  };

  /* 🎨 캘린더 이벤트 렌더링 */
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

  /* 📥 외부(미지정 업무) → 캘린더로 드롭 */
  const handleExternalDrop = async info => {
    console.group("📌 [DROP EVENT FIRED]");
    console.log("📌 info.draggedEl =", info.draggedEl);

    // ✅ v6 전용: 드래그 시 저장해둔 데이터 사용
    const raw = info.draggedEl.dataset.raw;
    console.log("📌 loaded from window.__dragPayload =", raw);

    if (!raw) {
      console.error("❌ DROP FAILED: raw data not found");
      toast.error("업무 정보를 가져올 수 없습니다.");
      console.groupEnd();
      return;
    }

    const droppedData = JSON.parse(raw);

    let projectId = Number(droppedData.project_id);
    if (!projectId || isNaN(projectId)) {
      console.error("🚨 projectId invalid:", projectId);
      toast.error("프로젝트 정보가 없는 업무는 등록할 수 없습니다.");
      console.groupEnd();
      return;
    }

    const taskId = droppedData.task_id;
    const dropDate = dayjs(info.date).format("YYYY-MM-DD");

    updateTaskLocal(taskId, { start_date: dropDate, due_date: dropDate });
    await updateTask(projectId, taskId, {
      start_date: dropDate,
      due_date: dropDate,
    });

    toast.success(`📆 '${droppedData.title}' 일정이 ${dropDate}로 등록되었습니다.`);
    console.groupEnd();
  };

  /* 🎨 색상 기준 라벨 */
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
    <div className="calendar-layout">
      <div className="calendar-main">
        <CalendarFilterBar
          projects={projects}
          activeProjectIds={activeProjectIds}
          setActiveProjectIds={setActiveProjectIds}
          colorMode={colorMode}
          setColorMode={setColorMode}
          searchKeyword={searchKeyword}
          setSearchKeyword={setSearchKeyword}
        />

        {searchKeyword && (
          <div style={{ fontSize: 12, color: "#555", margin: "4px 0 6px" }}>
            🔍 “{searchKeyword}” 검색 결과만 표시 중
          </div>
        )}

        <div style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>
          🎨 현재 색상 기준: <b>{getColorModeLabel()}</b>
        </div>

        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          selectable
          select={handleSelect}
          events={events || []}
          editable
          eventResizableFromStart
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
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
          droppable
          dragRevertDuration={0}
          drop={handleExternalDrop}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,dayGridWeek",
          }}
        />
      </div>

      {/* 📋 날짜 미지정 업무 사이드 패널 */}
      <aside className="calendar-undated-panel" ref={externalRef}>
        <h4 className="calendar-subtitle">📋 날짜 미지정 업무 ({undatedTasks.length})</h4>
        <UndatedProjectList
          tasks={undatedTasks}
          colorMode={colorMode}
          projectColorMap={projectColorMap}
          onTaskClick={onTaskClick}
        />
      </aside>
    </div>
  );
}
