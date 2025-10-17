// src/pages/calendar/EventForm.jsx
import { useState } from "react";
import API from "../../services/api/http";

export default function EventForm({ token, projectId, onCreated }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const submit = async e => {
    e.preventDefault();
    const res = await API("/events", {
      method: "POST",
      token,
      body: {
        project_id: projectId,
        title,
        description: desc,
        start_date: start,
        end_date: end,
      },
    });
    if (res.ok) {
      alert("일정 등록 완료");
      setTitle("");
      setDesc("");
      setStart("");
      setEnd("");
      onCreated && onCreated();
    } else {
      alert(res.msg || "등록 실패");
    }
  };

  return (
    <form onSubmit={submit}>
      <h4>일정 추가</h4>
      <input placeholder="제목" value={title} onChange={e => setTitle(e.target.value)} />
      <br />
      <textarea placeholder="설명" value={desc} onChange={e => setDesc(e.target.value)} />
      <br />
      <input type="date" value={start} onChange={e => setStart(e.target.value)} />
      ~
      <input type="date" value={end} onChange={e => setEnd(e.target.value)} />
      <br />
      <button type="submit">등록</button>
    </form>
  );
}
