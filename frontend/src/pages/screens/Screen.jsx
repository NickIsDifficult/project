import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../layout/AppShell";
import "./style.css";

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

/* ✅ 누락된 ProgressBar 정의 추가 */
function ProgressBar({ value }) {
  const clamped = Math.min(100, Math.max(0, value || 0));
  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${clamped}%` }}></div>
      <span className="progress-label">{clamped}%</span>
    </div>
  );
}

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

  const displayItems = items.slice(0, 2); // ✅ 최대 3개까지만 표시

  return (
    <div className="card-preview" onDoubleClick={() => nav(routeMap[type])}>
      <h3 className="card-title">{title}</h3>
      <ul className="card-list">
        {displayItems.length > 0 ? (
          displayItems.map((item, i) => (
            <li key={i} className="card-item">
              <strong>{item.title}</strong>

              {/* ✅ 프로젝트 전용 확장 */}
              {type === "proj" ? (
                <>
                  <p className="proj-summary">{item.summary}</p>
                  <div className="proj-meta">
                    <span className={`proj-status status-${item.status?.toLowerCase()}`}>
                      상태: {item.status || "미정"}
                    </span>
                    {item.progress !== undefined && (
                      <ProgressBar value={item.progress} />
                    )}
                    <span className="proj-updated">
                      🕒 {item.createdAtStr || "수정일 미상"}
                    </span>
                  </div>
                </>
              ) : type === "cal" ? (
                <p>
                  {item.time
                    ? `${item.time} — ${item.summary || "세부 내용 없음"}`
                    : item.summary || "오늘 일정 없음"}
                </p>
              ) : (
                <p>{item.summary}</p>
              )}
            </li>
          ))
        ) : (
          <li className="card-placeholder">데이터를 불러오는 중...</li>
        )}
      </ul>

      {/* ✅ 데이터가 3개 초과일 때 표시 */}
      {items.length > 2 && (
        <div
          className="card-more"
          onClick={() => nav(routeMap[type])}
          style={{ cursor: "pointer" }}
        >
          …더 보기
        </div>
      )}
    </div>
  );
}

export default function Screen() {
  return (
    <AppShell>
      <div className="dashboard-grid">
        <CardPreview type="ann" title="공지사항" />
        <CardPreview type="proj" title="프로젝트 현황" /> {/* ✅ 확장된 카드 */}
        <CardPreview type="noti" title="알림" />
        <CardPreview type="cal" title="오늘의 일정" />
      </div>
    </AppShell>
  );
}
