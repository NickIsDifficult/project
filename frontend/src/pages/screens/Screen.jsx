import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../layout/AppShell";
import "./Screen.css";

const routeMap = {
  ann: "/notices",
  proj: "/projects",
  noti: "/alerts",
  cal: "/calendar",
};

const previewEndpoints = {
  ann: "http://localhost:8000/notices/preview",
  proj: "http://localhost:8000/projects/preview/list",
  noti: "http://localhost:8000/notifications/preview",
  cal: "http://localhost:8000/calendar/preview",
};

/* ✅ ProgressBar 제거됨 — 필요 없음 */

function CardPreview({ type, title }) {
  const [items, setItems] = useState([]);
  const nav = useNavigate();

  const fetchData = async () => {
    try {
      const res = await fetch(previewEndpoints[type]);
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error(`${title} 미리보기 불러오기 실패`, err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [type]);

  const displayItems = items.slice(0, 3);

  return (
    <div className="card-preview enhanced" onDoubleClick={() => nav(routeMap[type])}>
      <h3 className="card-title">{title}</h3>
      <ul className="card-list">
        {displayItems.length > 0 ? (
          displayItems.map((item, i) => (
            <li key={i} className="card-item">
              <div className="card-content">
                <strong className="item-title">{item.title}</strong>
                <p className="item-summary">
                  {item.summary || "내용이 없습니다."}
                </p>

                {/* ✅ 프로젝트 카드에서는 상태/진행도/날짜 제거 */}
                {type === "cal" && (
                  <p className="calendar-time">
                    {item.time
                      ? `${item.time} — ${item.summary || "세부 내용 없음"}`
                      : item.summary || "오늘 일정 없음"}
                  </p>
                )}
              </div>
            </li>
          ))
        ) : (
          <li className="card-placeholder">데이터를 불러오는 중...</li>
        )}
      </ul>

      {items.length > 3 && (
        <div className="card-more" onClick={() => nav(routeMap[type])}>
          …더 보기
        </div>
      )}
    </div>
  );
}

export default function Screen() {
  return (
    <AppShell>
      <div className="dashboard-grid clean-layout">
        <CardPreview type="ann" title="📢 공지사항" />
        <CardPreview type="proj" title="🧭 프로젝트 현황" />
        <CardPreview type="noti" title="🔔 알림" />
        <CardPreview type="cal" title="🗓️ 오늘의 일정" />
      </div>
    </AppShell>
  );
}
