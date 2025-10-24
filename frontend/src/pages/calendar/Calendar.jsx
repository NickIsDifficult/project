// src/pages/calendar/Calendar.jsx
import { useEffect, useState } from "react";
import AppShell from "../../layout/AppShell";
import API from "../../services/api/http";

export default function Calendar() {
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [list, setList] = useState([]);

  async function load() {
    const { data } = await API.get("/events", { params: { project_id: 1 } });
    setList(data);
  }

  async function submit(e) {
    e.preventDefault();
    await API.post("/events", {
      project_id: 1,
      title,
      description: "",
      start_date: start,
      end_date: end,
    });
    setTitle("");
    setStart("");
    setEnd("");
    load(); // 추가 후 즉시 반영
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <AppShell>
      <div style={{ padding: "20px" }}>
        <h2>📅 일정 관리</h2>
        <form onSubmit={submit} style={{ marginBottom: "10px" }}>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="일정 제목"
            required
          />
          <input type="date" value={start} onChange={e => setStart(e.target.value)} required />
          <input type="date" value={end} onChange={e => setEnd(e.target.value)} required />
          <button type="submit">추가</button>
        </form>

        <ul>
          {list.map(ev => (
            <li key={ev.id}>
              <b>{ev.title}</b> ({ev.start_date} ~ {ev.end_date})
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
