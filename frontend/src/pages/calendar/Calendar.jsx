// src/pages/calendar/Calendar.jsx
import { useEffect, useState } from "react";
import API from "../../services/api/http";
import AppShell from "../layout/AppShell";

export default function Calendar({ token }) {
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [list, setList] = useState([]);

  async function load() {
    const { data } = await API.get("/events?project_id=1", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setList(data);
  }

  async function submit(e) {
    e.preventDefault();
    await API.post(
      "/events",
      {
        project_id: 1,
        title,
        description: "",
        start_date: start,
        end_date: end,
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    setTitle("");
    setStart("");
    setEnd("");
    load();
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
