import dayjs from "dayjs";
import Gantt from "frappe-gantt";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { updateTask } from "../../../services/api/task";
import "../../assets/frappe-gantt.css";

const STATUS_OPTIONS = [
  { key: "TODO", label: "할 일" },
  { key: "IN_PROGRESS", label: "진행 중" },
  { key: "REVIEW", label: "검토 중" },
  { key: "DONE", label: "완료" },
];

export default function GanttView({ projectId, tasks = [], onTaskMove, onTaskClick }) {
  const ganttRef = useRef(null);
  const chart = useRef(null);
  const [viewMode, setViewMode] = useState("Week");
  const [hasScrolled, setHasScrolled] = useState(false);
  const [scrollLeft, setScrollLeft] = useState(0);

  // 필터 상태
  const [activeStatuses, setActiveStatuses] = useState(new Set(STATUS_OPTIONS.map(s => s.key)));
  const [assignee, setAssignee] = useState("ALL");
  const [search, setSearch] = useState("");

  // 필터 적용
  const filteredTasks = useMemo(() => {
    const match = t => {
      const s = activeStatuses.has(t.status || "TODO");
      const a = assignee === "ALL" || t.assignee_name === assignee;
      const kw = !search || t.title.toLowerCase().includes(search.trim().toLowerCase());
      return s && a && kw;
    };
    const walk = (list, depth = 0) =>
      list.flatMap(t => {
        const current = {
          id: String(t.task_id),
          name: `${"— ".repeat(depth)}${t.title}`,
          start: t.start_date || new Date().toISOString().slice(0, 10),
          end: t.due_date || new Date().toISOString().slice(0, 10),
          progress:
            t.status === "DONE"
              ? 100
              : t.status === "IN_PROGRESS"
                ? 60
                : t.status === "REVIEW"
                  ? 80
                  : 0,
          custom_class: `status-${t.status}`,
          assignee: t.assignee_name,
          taskData: t,
        };
        const subs = t.subtasks ? walk(t.subtasks, depth + 1) : [];
        return match(t) ? [current, ...subs] : subs;
      });
    return walk(tasks);
  }, [tasks, activeStatuses, assignee, search]);

  // 통계 계산
  const stats = useMemo(() => {
    if (!filteredTasks.length) return null;
    const total = filteredTasks.length;
    const done = filteredTasks.filter(t => t.taskData.status === "DONE").length;
    const inProgress = filteredTasks.filter(t => t.taskData.status === "IN_PROGRESS").length;
    const review = filteredTasks.filter(t => t.taskData.status === "REVIEW").length;
    const avg = filteredTasks.reduce((s, t) => s + t.progress, 0) / total;
    const minDate = new Date(Math.min(...filteredTasks.map(t => new Date(t.start))));
    const maxDate = new Date(Math.max(...filteredTasks.map(t => new Date(t.end))));
    return {
      total,
      done,
      inProgress,
      review,
      avgProgress: avg.toFixed(1),
      minDate: minDate.toISOString().slice(0, 10),
      maxDate: maxDate.toISOString().slice(0, 10),
    };
  }, [filteredTasks]);

  // 담당자 옵션
  const assigneeOptions = useMemo(() => {
    const set = new Set();
    const walk = list => {
      list.forEach(t => {
        if (t.assignee_name) set.add(t.assignee_name);
        if (t.subtasks?.length) walk(t.subtasks);
      });
    };
    walk(tasks);
    return ["ALL", ...Array.from(set)];
  }, [tasks]);

  // 간트 렌더링
  useEffect(() => {
    const container = ganttRef.current;
    if (!container) return;

    const scrollEl = container.parentElement;
    if (scrollEl) scrollLeft && scrollEl.scrollTo({ left: scrollLeft });
    container.innerHTML = "";

    const data =
      filteredTasks.length > 0
        ? filteredTasks
        : [
            {
              id: "dummy",
              name: " ",
              start: new Date().toISOString().slice(0, 10),
              end: new Date().toISOString().slice(0, 10),
              progress: 0,
              custom_class: "dummy-row",
            },
          ];

    chart.current = new Gantt(container, data, {
      view_mode: viewMode,
      language: "ko",
      custom_popup_html: null,
      on_click: task => {
        if (task.id === "dummy") return;
        onTaskClick?.(task.taskData);
      },
      on_date_change: async (task, start, end) => {
        if (task.id === "dummy") return;
        try {
          // ✅ 하루 밀림 방지 (KST 변환)
          const correctedStart = dayjs(start).add(9, "hour").format("YYYY-MM-DD");
          const correctedEnd = dayjs(end).add(9, "hour").format("YYYY-MM-DD");

          await updateTask(projectId, task.id, {
            start_date: correctedStart,
            due_date: correctedEnd,
          });
          toast.success(`📅 일정이 수정되었습니다 (${correctedStart} ~ ${correctedEnd})`);
          await onTaskMove?.();
        } catch (err) {
          toast.error("일정 변경 실패");
          console.error(err);
        }
      },
    });

    // ✅ 오늘 스크롤은 최초 1회만
    if (!hasScrolled && filteredTasks.length > 0) {
      scrollToToday(false);
      setHasScrolled(true);
    }
  }, [filteredTasks, viewMode]);

  // 스크롤 & Zoom
  const scrollToToday = (smooth = true) => {
    const el = ganttRef.current?.parentElement;
    if (!el) return;
    const today = new Date();
    const first = filteredTasks[0] ? new Date(filteredTasks[0].start) : today;
    const days = (today - first) / (1000 * 60 * 60 * 24);
    el.scrollTo({ left: days * 30, behavior: smooth ? "smooth" : "auto" });
  };

  const fitToRange = () => {
    setViewMode("Month");
    const el = ganttRef.current?.parentElement;
    if (el) el.scrollTo({ left: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const el = ganttRef.current?.parentElement;
    if (!el) return;
    const onScroll = () => setScrollLeft(el.scrollLeft);
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // UI
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, height: "100%" }}>
      {/* 진행률 통계 */}
      {stats && (
        <div style={summaryBox}>
          <div>
            📅 기간: {stats.minDate} ~ {stats.maxDate}
          </div>
          <div>🧩 전체 {stats.total}개</div>
          <div>🚧 진행중 {stats.inProgress}</div>
          <div>🔍 검토 {stats.review}</div>
          <div>✅ 완료 {stats.done}</div>
          <div>📊 평균 진행률 {stats.avgProgress}%</div>
        </div>
      )}

      {/* 필터/툴바 */}
      <div style={toolbar}>
        {["Day", "Week", "Month"].map(m => (
          <button
            key={m}
            onClick={() => setViewMode(m)}
            style={{
              ...btn,
              background: viewMode === m ? "#e8f0ff" : "#fff",
              borderColor: viewMode === m ? "#3b82f6" : "#ccc",
            }}
          >
            {m === "Day" ? "일간" : m === "Week" ? "주간" : "월간"}
          </button>
        ))}

        <button onClick={fitToRange} style={btn}>
          📐 Zoom Fit
        </button>

        {STATUS_OPTIONS.map(s => (
          <button
            key={s.key}
            onClick={() =>
              setActiveStatuses(prev => {
                const next = new Set(prev);
                next.has(s.key) ? next.delete(s.key) : next.add(s.key);
                return next;
              })
            }
            style={{
              ...btn,
              background: activeStatuses.has(s.key) ? "#eef6ff" : "#fff",
              borderColor: activeStatuses.has(s.key) ? "#3b82f6" : "#ddd",
            }}
          >
            {s.label}
          </button>
        ))}

        <select value={assignee} onChange={e => setAssignee(e.target.value)} style={sel}>
          {assigneeOptions.map(a => (
            <option key={a} value={a}>
              {a === "ALL" ? "담당자: 전체" : a}
            </option>
          ))}
        </select>

        <input
          placeholder="검색"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={inp}
        />

        <button
          onClick={() => {
            setActiveStatuses(new Set(STATUS_OPTIONS.map(s => s.key)));
            setAssignee("ALL");
            setSearch("");
          }}
          style={btn}
        >
          초기화
        </button>
      </div>

      {/* 간트 차트 영역 */}
      <div style={ganttWrap}>
        <div ref={ganttRef} style={{ flex: 1, width: "100%", height: "100%", minHeight: 0 }} />
      </div>
    </div>
  );
}

// 스타일
const summaryBox = {
  display: "flex",
  gap: 20,
  alignItems: "center",
  background: "#f9fafb",
  border: "1px solid #e0e0e0",
  borderRadius: 8,
  padding: "8px 16px",
  fontSize: 14,
};

const toolbar = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  background: "#f8f9fa",
  border: "1px solid #e0e0e0",
  borderRadius: 8,
  padding: "8px 12px",
  flexWrap: "wrap",
};

const ganttWrap = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  border: "1px solid #ddd",
  borderRadius: 8,
  background: "#fff",
  overflow: "hidden",
  minHeight: "60vh", // ✅ 화면 전부 채우기
};

const btn = {
  border: "1px solid #ddd",
  borderRadius: 6,
  padding: "5px 10px",
  cursor: "pointer",
  background: "#fff",
};

const sel = {
  border: "1px solid #ddd",
  borderRadius: 6,
  padding: "5px 10px",
  fontSize: 13,
};

const inp = {
  border: "1px solid #ddd",
  borderRadius: 6,
  padding: "5px 10px",
  fontSize: 13,
  minWidth: 140,
};
