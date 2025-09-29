import React, { useState, useEffect } from "react";
import { api } from "../api";

export default function Calendar({ token }) {
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [list, setList] = useState([]);

  async function load() {
    const data = await api("/events?project_id=1", "GET", null, token);
    setList(data);
  }

  async function submit(e) {
    e.preventDefault();
    await api("/events", "POST", {
      project_id: 1,
      title,
      description: "",
      start_date: start,
      end_date: end
    }, token);
    setTitle(""); setStart(""); setEnd("");
    load();
  }

  useEffect(() => { load(); }, []);

  return (
    <div>
      <h2>📅 일정 관리</h2>
      <form onSubmit={submit}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="일정 제목" required />
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
  );
}
