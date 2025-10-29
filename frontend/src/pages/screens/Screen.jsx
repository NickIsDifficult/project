import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../layout/AppShell";
import "./style.css";

// ✅ 각 카드별 미리보기 API 엔드포인트
const previewEndpoints = {
  ann: "http://localhost:8000/api/notices/preview",
  proj: "http://localhost:8000/api/projects/preview",
  noti: "http://localhost:8000/api/notifications/preview",
  cal: "http://localhost:8000/api/calendar/preview",
};

// ✅ 라우팅 매핑
const routeMap = {
  ann: "/notices",
  proj: "/projects",
  noti: "/alerts",
  cal: "/calendar",
};

// ✅ 카드 미리보기 컴포넌트
function CardPreview({ type, title }) {
  const [items, setItems] = useState([]);
  const nav = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    (async () => {
      try {
        const res = await fetch(previewEndpoints[type], {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("데이터 요청 실패");
        const data = await res.json();
        setItems(data.slice(0, 3)); // 최신 3개만 표시
      } catch (err) {
        console.error(`${type} 미리보기 불러오기 실패:`, err);
      }
    })();
  }, [type]);

  return (
    <div
      className="card-preview"
      role="button"
      tabIndex={0}
      onDoubleClick={() => nav(routeMap[type])}
      title="더블클릭 시 상세 페이지로 이동"
    >
      <h3 className="card-title">{title}</h3>
      <ul className="card-list">
        {items.length > 0 ? (
          items.map((item, i) => (
            <li key={i} className="card-item">
              <strong>{item.title || item.name}</strong>
              <p>{item.summary || item.content?.slice(0, 40) || "내용 없음"}...</p>
            </li>
          ))
        ) : (
          <li className="card-placeholder">데이터를 불러오는 중...</li>
        )}
      </ul>
    </div>
  );
}

// ✅ Screen 본체 — AppShell이 감싸는 형태
export default function Screen() {
  return (
    <AppShell>
      <div className="dashboard-grid">
        <CardPreview type="ann" title="공지사항" />
        <CardPreview type="proj" title="프로젝트" />
        <CardPreview type="noti" title="알림" />
        <CardPreview type="cal" title="캘린더" />
      </div>
    </AppShell>
  );
}
