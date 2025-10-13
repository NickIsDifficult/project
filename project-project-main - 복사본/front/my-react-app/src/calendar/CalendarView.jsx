// src/CalendarView.js
import React, { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import "react-big-calendar/lib/css/react-big-calendar.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ko } from "date-fns/locale";
import AppShell from "../layout/AppShell";

// ✅ 한국어 로컬 설정
const locales = {"ko": ko,};
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export default function CalendarView({ token, projectId }) {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState([]);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);

  // 📌 프로젝트 일정 불러오기
  async function loadEvents() {
    const data = await api(`/events?project_id=${projectId}`, { method: "GET", token });
    return data.map(ev => ({
      id: `event-${ev.id}`,
      type: "event",
      title: ev.title,
      start: new Date(ev.start_date),
      end: new Date(ev.end_date),
    }));
  }

  // 📌 개인 상태 불러오기
  async function loadStatus() {
    const data = await api(`/status`, { method: "GET", token });
    return data.map(s => ({
      id: `status-${s.id}`,
      type: "status",
      title: `[${s.type}] ${s.username}`,
      start: new Date(s.start_date),
      end: new Date(s.end_date),
    }));
  }

  // 📌 일정 + 상태 합치기
  async function loadAll() {
    const ev = await loadEvents();
    const st = await loadStatus();
    setEvents([...ev, ...st]);
  }

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, []);

  // 📌 프로젝트 일정 추가
  async function addEvent(e) {
    e.preventDefault();
    if (!title.trim()) return alert("제목을 입력하세요!");

    await api("/events", {
      method: "POST",
      token,
      body: {
        project_id: projectId,
        title,
        description: "",
        start_date: formatDateTime(startDate),
        end_date: formatDateTime(endDate),
      },
    });

    setTitle("");
    setStartDate(new Date());
    setEndDate(new Date());
    await loadAll();
  }


  // 📌 일정 수정
  async function editEvent() {
    if (!selectedEvent || selectedEvent.type !== "event") return alert("프로젝트 일정만 수정 가능합니다.");
    const newTitle = prompt("새 제목:", selectedEvent.title);
    if (!newTitle) return;

    await api(`/events/${selectedEvent.id.replace("event-","")}`, {
      method: "PUT",
      token,
      body: {
        title: newTitle,
        start_date: formatDateTime(selectedEvent.start),
        end_date: formatDateTime(selectedEvent.end),
      },
    });

    setSelectedEvent(null);
    await loadAll();
  }

  // 📌 일정/상태 삭제
  async function deleteEvent() {
    if (!selectedEvent) return;
    if (!window.confirm("삭제하시겠습니까?")) return;

    if (selectedEvent.type === "event") {
      await api(`/events/${selectedEvent.id.replace("event-","")}`, { method: "DELETE", token });
    } else if (selectedEvent.type === "status") {
      await api(`/status/${selectedEvent.id.replace("status-","")}`, { method: "DELETE", token });
    }

    setSelectedEvent(null);
    await loadAll();
  }

  return (
    <AppShell>
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <h2>📅 프로젝트 {projectId} 캘린더</h2>

      {/* 프로젝트 일정 추가 */}
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
          <DatePicker selected={startDate} onChange={setStartDate} showTimeSelect timeFormat="HH:mm" timeIntervals={30} dateFormat="yyyy-MM-dd HH:mm" />
          <DatePicker selected={endDate} onChange={setEndDate} showTimeSelect timeFormat="HH:mm" timeIntervals={30} dateFormat="yyyy-MM-dd HH:mm" />
        </div>
        <button type="submit" style={{ marginTop: "10px" }}>+ 프로젝트 일정 추가</button>
      </form>


      {/* 캘린더 */}
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        views={["month", "week", "day"]}
        defaultView="month"
        messages={{ month: "월", week: "주", day: "일", today: "오늘", previous: "이전", next: "다음" }}
        onSelectEvent={(event) => setSelectedEvent(event)}
        eventPropGetter={(event) => ({
          style: {
            backgroundColor: event.type === "status" ? "#FFB6C1" : "#4CAF50",
            color: "black",
          }
        })}
      />

      {/* 선택된 일정/상태 관리 */}
      {selectedEvent && (
        <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ccc" }}>
          <h4>선택된 항목: {selectedEvent.title}</h4>
          {selectedEvent.type === "event" && <button onClick={editEvent}>✏ 수정</button>}
          <button onClick={deleteEvent} style={{ marginLeft: "10px", color: "red" }}>🗑 삭제</button>
          <button onClick={() => setSelectedEvent(null)} style={{ marginLeft: "10px" }}>❌ 취소</button>
        </div>
      )}
    </div>
    </AppShell>
  );
}

// 📌 날짜 포맷 함수
function formatDateTime(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}`;
}
