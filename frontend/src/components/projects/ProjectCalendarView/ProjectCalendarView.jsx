import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import { updateTask } from "../../../services/api/task";
import { Drawer } from "../../common/Drawer";
import UndatedProjectList from "./UndatedProjectList";
import useCalendarEvents from "./useCalendarEvents";

/* 🎨 상태 색상 (status 모드일 때) */
function getStatusColor(status) {
  switch (status) {
    case "DONE":
      return "#A5D6A7";
    case "IN_PROGRESS":
      return "#64B5F6";
    case "REVIEW":
      return "#FFB74D";
    case "ON_HOLD":
      return "#E0E0E0";
    default:
      return "#FFF9C4";
  }
}

export default function ProjectCalendarView({ onTaskClick, onProjectClick }) {
  const { projects, fetchTasksByProject, updateTaskLocal, setUiState, setSelectedProject } =
    useProjectGlobal();

  const { events, undatedTasks } = useCalendarEvents();

  // UI 상태
  const [showProjectDrawer, setShowProjectDrawer] = useState(false);
  const [colorMode, setColorMode] = useState(
    () => localStorage.getItem("calendar_colorMode_v2") || "project",
  );
  const [activeProjectIds, setActiveProjectIds] = useState(() => {
    try {
      const saved = localStorage.getItem("calendar_activeProjects_v2");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 상태 저장
  useEffect(() => localStorage.setItem("calendar_colorMode_v2", colorMode), [colorMode]);
  useEffect(
    () => localStorage.setItem("calendar_activeProjects_v2", JSON.stringify(activeProjectIds)),
    [activeProjectIds],
  );

  // 🎨 프로젝트 색상 매핑
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

  // 📁 프로젝트 기간 이벤트 생성
  const projectEvents = useMemo(() => {
    return projects
      .filter(p => p.start_date && p.end_date)
      .map(p => ({
        id: `proj-${p.project_id}`,
        title: `📁 ${p.project_name}`,
        start: p.start_date,
        end: dayjs(p.end_date).add(1, "day").format("YYYY-MM-DD"),
        backgroundColor: projectColorMap[p.project_id],
        borderColor: "#bbb",
        textColor: "#222",
        allDay: true,
        extendedProps: { isProject: true, project_id: p.project_id, project_name: p.project_name },
      }));
  }, [projects, projectColorMap]);

  // 🎛️ 필터 + 색상 모드 적용
  const filteredEvents = useMemo(() => {
    const colored = events.map(ev => {
      if (colorMode === "project") {
        const pid = ev.extendedProps.project_id;
        return { ...ev, color: projectColorMap[pid] || "#ccc" };
      }
      return { ...ev, color: getStatusColor(ev.extendedProps.status) };
    });
    const combined = [...projectEvents, ...colored];
    if (!activeProjectIds.length) return combined;
    return combined.filter(e => activeProjectIds.includes(e.extendedProps.project_id));
  }, [events, projectEvents, colorMode, activeProjectIds, projectColorMap]);

  // 📦 일정 이동
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
      await fetchTasksByProject(projectId);
      toast.success(`📅 일정 변경: ${startDate} ~ ${endDate}`);
    } catch (err) {
      console.error("❌ 일정 변경 실패:", err);
      toast.error("일정 변경 실패");
      info.revert();
    }
  };

  // 🆕 드래그 선택 → 새 업무 등록
  const handleSelect = info => {
    const start = dayjs(info.start).format("YYYY-MM-DD");
    const end = dayjs(info.end).subtract(1, "day").format("YYYY-MM-DD");
    toast(`🆕 새 업무 등록 (${start} ~ ${end})`, { icon: "📝" });
    setUiState(prev => ({ ...prev, drawer: { ...prev.drawer, task: true, parentTaskId: null } }));
    localStorage.setItem("newTask_start", start);
    localStorage.setItem("newTask_end", end);
  };

  // 🖱️ 일정 클릭 → 업무 or 프로젝트 상세
  const handleEventClick = info => {
    const { id, extendedProps } = info.event;
    if (extendedProps.isProject) {
      // ✅ 프로젝트 일정 클릭 시
      const proj = projects.find(p => p.project_id === extendedProps.project_id);
      if (proj) {
        setSelectedProject(proj);
        onProjectClick?.(proj);
      }
      return;
    }
    // ✅ 업무 클릭 시
    onTaskClick?.({ ...extendedProps, task_id: id });
  };

  // Drawer 열기/닫기
  const toggleProjectDrawer = () => setShowProjectDrawer(o => !o);
  const toggleProjectId = id => {
    setActiveProjectIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const selectAll = () => setActiveProjectIds(projects.map(p => p.project_id));
  const clearAll = () => setActiveProjectIds([]);

  return (
    <div style={container}>
      {/* 🎛️ 상단 버튼바 */}
      <div style={topBar}>
        <button style={btn} onClick={toggleProjectDrawer}>
          📋 프로젝트 목록
        </button>
        <button
          style={btn}
          onClick={() => setColorMode(m => (m === "project" ? "status" : "project"))}
        >
          🎨 색상 모드: {colorMode === "project" ? "프로젝트 기준" : "상태 기준"}
        </button>
      </div>

      {/* 📅 FullCalendar */}
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        selectable
        select={handleSelect}
        events={filteredEvents}
        editable
        eventDrop={handleEventDrop}
        eventClick={handleEventClick}
        displayEventTime={false}
        dayMaxEventRows={3}
        locale="ko"
        firstDay={1}
        height="calc(100vh - 280px)"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,dayGridWeek",
        }}
      />

      {/* 📋 날짜 미지정 업무 */}
      <div style={undatedBox}>
        <h4 style={subTitle}>📋 날짜 미지정 업무 ({undatedTasks.length})</h4>
        <UndatedProjectList tasks={undatedTasks} onTaskClick={onTaskClick} />
      </div>

      {/* 📂 프로젝트 Drawer */}
      <Drawer
        open={showProjectDrawer}
        title="프로젝트 목록"
        onClose={() => setShowProjectDrawer(false)}
      >
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <button style={smallBtn} onClick={selectAll}>
            모두 선택
          </button>
          <button style={smallBtn} onClick={clearAll}>
            모두 해제
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {projects.map(p => {
            const checked = activeProjectIds.includes(p.project_id);
            return (
              <label key={p.project_id} style={projectItem}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleProjectId(p.project_id)}
                />
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: projectColorMap[p.project_id],
                    marginRight: 6,
                  }}
                />
                {p.project_name}
              </label>
            );
          })}
          {projects.length === 0 && (
            <div style={{ fontSize: 13, color: "#777" }}>프로젝트가 없습니다.</div>
          )}
        </div>

        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
          <button style={btn} onClick={() => setShowProjectDrawer(false)}>
            닫기
          </button>
        </div>
      </Drawer>
    </div>
  );
}

/* ---------------- 스타일 ---------------- */
const container = { background: "#fff", border: "1px solid #ddd", borderRadius: 8, padding: 8 };
const topBar = { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 };
const btn = {
  border: "1px solid #ccc",
  borderRadius: 6,
  padding: "4px 10px",
  background: "#f9f9f9",
  cursor: "pointer",
  fontSize: 13,
};
const smallBtn = { ...btn, padding: "2px 8px", fontSize: 12 };
const undatedBox = { marginTop: 16, borderTop: "1px solid #eee", paddingTop: 8 };
const subTitle = { fontSize: 14, color: "#555", marginBottom: 6 };
const projectItem = {
  display: "flex",
  alignItems: "center",
  fontSize: 13,
  gap: 6,
  padding: "4px 6px",
  border: "1px solid #eee",
  borderRadius: 6,
};
