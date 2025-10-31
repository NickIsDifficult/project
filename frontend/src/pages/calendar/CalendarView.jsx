// src/pages/calendar/CalendarView.jsx
import format from "date-fns/format";
import getDay from "date-fns/getDay";
import { ko } from "date-fns/locale";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import { useEffect, useState } from "react";
import { Calendar as RBCalendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import AppShell from "../../layout/AppShell";
import API from "../../services/api/http";

const locales = { ko };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// "YYYY-MM-DD HH:mm" 또는 ISO → Date
function toDate(input) {
  if (!input) return null;
  if (input instanceof Date) return input;
  if (typeof input !== "string") return null;
  if (input.includes("T")) {
    const d = new Date(input);
    return isNaN(d) ? null : d;
  }
  const m = input.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
  if (!m) {
    const d = new Date(input);
    return isNaN(d) ? null : d;
  }
  const [, y, mo, d, h, mi] = m;
  const out = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));
  return isNaN(out) ? null : out;
}

function formatDateTime(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}`;
}

export default function CalendarView({ projectId = 1 }) {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);

  const mapEvent = (ev) => ({
    id: `event-${ev.id}`,
    type: "event",
    title: ev.title,
    start: toDate(ev.start_date),
    end: toDate(ev.end_date),
  });

  const mapStatus = (s) => ({
    id: `status-${s.id}`,
    type: "status",
    title: `[${s.type}] ${s.username ?? ""}`.trim(),
    start: toDate(s.start_date),
    end: toDate(s.end_date),
  });

  const okRange = (x) =>
    x &&
    x.start instanceof Date &&
    !isNaN(x.start) &&
    x.end instanceof Date &&
    !isNaN(x.end) &&
    x.end >= x.start;

  async function loadEvents() {
    const { data } = await API.get("/events", { params: { project_id: projectId } });
    return (data || []).map(mapEvent).filter(okRange);
  }

  async function loadStatus() {
    const { data } = await API.get("/status");
    return (data || []).map(mapStatus).filter(okRange);
  }

  async function loadAll() {
    const [ev, st] = await Promise.all([loadEvents(), loadStatus()]);
    setEvents([...ev, ...st]);
  }

  useEffect(() => {
    loadAll().catch((e) => console.error("loadAll error:", e?.message || e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function addEvent(e) {
    e.preventDefault();
    if (!title.trim()) return alert("제목을 입력하세요!");
    if (endDate < startDate) return alert("종료 시각이 시작 시각보다 빠릅니다.");

    try {
      // 빈 description은 아예 생략
      const payload = {
        project_id: projectId,
        title,
        start_date: formatDateTime(startDate),
        end_date: formatDateTime(endDate),
      };
      await API.post("/events/create", payload);

      setTitle("");
      setStartDate(new Date());
      setEndDate(new Date());
      await loadAll();
    } catch (err) {
      alert(`일정 추가 실패: ${err?.message || "서버 오류"}`);
      console.error(err);
    }
  }

  async function editEvent() {
    if (!selectedEvent || selectedEvent.type !== "event")
      return alert("프로젝트 일정만 수정 가능합니다.");
    const newTitle = prompt("새 제목:", selectedEvent.title);
    if (!newTitle) return;

    const id = selectedEvent.id.replace("event-", "");
    try {
      await API.put(`/events/${id}`, {
        title: newTitle,
        start_date: formatDateTime(selectedEvent.start),
        end_date: formatDateTime(selectedEvent.end),
      });
      setSelectedEvent(null);
      await loadAll();
    } catch (err) {
      alert(`수정 실패: ${err?.message || "서버 오류"}`);
      console.error(err);
    }
  }

  async function deleteEvent() {
    if (!selectedEvent) return;
    if (!window.confirm("삭제하시겠습니까?")) return;

    try {
      if (selectedEvent.type === "event") {
        const id = selectedEvent.id.replace("event-", "");
        await API.delete(`/events/${id}`);
      } else if (selectedEvent.type === "status") {
        const id = selectedEvent.id.replace("status-", "");
        await API.delete(`/status/${id}`);
      }
      setSelectedEvent(null);
      await loadAll();
    } catch (err) {
      alert(`삭제 실패: ${err?.message || "서버 오류"}`);
      console.error(err);
    }
  }

  return (
    <AppShell>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <h2>📅 프로젝트 {projectId} 캘린더</h2>

        <form onSubmit={addEvent} style={{ marginBottom: "20px" }}>
          <h4>➕ 프로젝트 일정 등록</h4>
          <input
            type="text"
            placeholder="일정 제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <div style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
            <DatePicker
              selected={startDate}
              onChange={setStartDate}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={30}
              dateFormat="yyyy-MM-dd HH:mm"
            />
            <DatePicker
              selected={endDate}
              onChange={setEndDate}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={30}
              dateFormat="yyyy-MM-dd HH:mm"
            />
          </div>
          <button type="submit" style={{ marginTop: "10px" }}>
            + 프로젝트 일정 추가
          </button>
        </form>

        <RBCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500 }}
          views={["month", "week", "day"]}
          defaultView="month"
          messages={{
            month: "월",
            week: "주",
            day: "일",
            today: "오늘",
            previous: "이전",
            next: "다음",
          }}
          onSelectEvent={(event) => setSelectedEvent(event)}
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: event.type === "status" ? "#FFB6C1" : "#4CAF50",
              color: "black",
              borderRadius: "8px",
              border: "1px solid rgba(0,0,0,0.15)",
            },
          })}
        />

        {selectedEvent && (
          <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ccc" }}>
            <h4>선택된 항목: {selectedEvent.title}</h4>
            {selectedEvent.type === "event" && <button onClick={editEvent}>✏ 수정</button>}
            <button onClick={deleteEvent} style={{ marginLeft: "10px", color: "red" }}>
              🗑 삭제
            </button>
            <button onClick={() => setSelectedEvent(null)} style={{ marginLeft: "10px" }}>
              ❌ 취소
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
