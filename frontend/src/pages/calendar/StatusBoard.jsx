// src/pages/calendar/StatusBoard.jsx
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import API from "../../services/api/http";

export default function StatusBoard() {
  const [items, setItems] = useState([]);
  const [type, setType] = useState("휴가");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  async function load() {
    const { data } = await API.get("/status");
    setItems(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function addStatus(e) {
    e.preventDefault();
    await API.post("/status", {
      type,
      start_date: formatDateTime(startDate),
      end_date: formatDateTime(endDate),
    });
    await load(); // 등록 후 즉시 반영
  }

  return (
    <div>
      <h2>📝 내 휴가/근태 상태</h2>

      <form onSubmit={addStatus}>
        <select value={type} onChange={e => setType(e.target.value)}>
          <option value="휴가">휴가</option>
          <option value="출장">출장</option>
          <option value="병가">병가</option>
          <option value="기타">기타</option>
        </select>
        <DatePicker
          selected={startDate}
          onChange={setStartDate}
          showTimeSelect
          dateFormat="yyyy-MM-dd HH:mm"
        />
        <DatePicker
          selected={endDate}
          onChange={setEndDate}
          showTimeSelect
          dateFormat="yyyy-MM-dd HH:mm"
        />
        <button type="submit">+ 등록</button>
      </form>

      <ul style={{ marginTop: 20 }}>
        {items.map(s => (
          <li key={s.id}>
            <b>{s.type}</b> ({s.start_date} ~ {s.end_date}) - {s.username}
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatDateTime(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}`;
}
