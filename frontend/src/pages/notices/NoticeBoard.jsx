// src/pages/notices/NoticeBoard.jsx
import { useEffect, useState } from "react";
import AppShell from "../../layout/AppShell";
import API from "../../services/api/http"; // ✅ axios 인스턴스 사용

// ✅ 응답을 항상 배열로 정규화
function normalizeToArray(data) {
  if (Array.isArray(data)) return data;
  if (!data) return [];
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.rows)) return data.rows;
  return [];
}

export default function NoticeBoard() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");

  // -----------------------------
  // ✅ 공지사항 전체 불러오기
  // -----------------------------
  async function load() {
    try {
      const { data } = await API.get("/notices");
      const list = normalizeToArray(data);
      setItems(list);
    } catch (err) {
      console.error("공지사항 불러오기 실패:", err);
      setItems([]);
    }
  }

  // -----------------------------
  // ✅ 검색
  // -----------------------------
  async function search() {
    if (!q.trim()) return load();

    try {
      const { data } = await API.get("/notices/search", {
        params: { q },
      });
      const list = normalizeToArray(data);
      setItems(list);
    } catch (err) {
      console.error("검색 실패:", err);
      setItems([]);
    }
  }

  // 엔터키 검색
  const handleKeyDown = e => {
    if (e.key === "Enter") {
      e.preventDefault();
      search();
    }
  };

  useEffect(() => {
    load();
  }, []);

  // -----------------------------
  // ✅ UI 렌더링
  // -----------------------------
  return (
    <AppShell>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2>📢 공지사항</h2>

        {/* 검색창 */}
        <div style={{ marginBottom: "16px" }}>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="제목 / 작성자 / 본문 / 범위(GLOBAL, TEAM, PROJECT)"
            style={{
              width: "70%",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: 4,
            }}
          />
          <button
            onClick={search}
            style={{
              marginLeft: "8px",
              padding: "8px 12px",
              border: "none",
              backgroundColor: "#1976D2",
              color: "white",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            검색
          </button>
        </div>

        {/* 결과 출력 */}
        {items.length === 0 ? (
          <p>공지사항이 없습니다.</p>
        ) : (
          <ul style={{ listStyle: "none", paddingLeft: 0 }}>
            {items.map(n => (
              <li
                key={n.id}
                style={{
                  borderBottom: "1px solid #ddd",
                  marginBottom: "12px",
                  paddingBottom: "8px",
                }}
              >
                <h4 style={{ margin: "4px 0" }}>{n.title}</h4>
                <p style={{ margin: "6px 0", whiteSpace: "pre-wrap" }}>{n.body}</p>
                <small style={{ color: "#555" }}>
                  작성자: {n.username || "알 수 없음"} / 범위: {n.scope || "-"} / 작성일:{" "}
                  {n.created_at ? new Date(n.created_at).toLocaleString() : "-"}
                </small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
