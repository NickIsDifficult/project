// src/pages/calendar/StatusBoard.jsx
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import API from "../../services/api/http";

export default function StatusBoard({ token }) {
  const [items, setItems] = useState([]);
  const [type, setType] = useState("휴가");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  // 상태 불러오기
  async function load() {
    const data = await API("/status", { method: "GET", token });
    setItems(data);
  }

  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, []);

  // 새 상태 등록
  async function addStatus(e) {
    e.preventDefault();
    await API("/status", {
      method: "POST",
      token,
      body: {
        type,
        start_date: formatDateTime(startDate),
        end_date: formatDateTime(endDate),
      },
    });
    await load();
  }

  return (
    <div>
      <h2>📝 내 휴가/근태 상태</h2>

      {/* 상태 등록 */}
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

      {/* 목록 */}
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
