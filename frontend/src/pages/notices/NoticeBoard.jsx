import { useEffect, useState } from "react";
import AppShell from "../../layout/AppShell";

/** ────────────── fetch 헬퍼 ────────────── */
async function api(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    // credentials: "include", // 쿠키 인증이면 주석 해제
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`.trim());
  }
  return res.json();
}

/** 응답을 항상 배열로 정규화 */
function normalizeToArray(data) {
  if (Array.isArray(data)) return data;
  if (!data) return [];
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.rows)) return data.rows;
  return [];
}

export default function NoticeBoard({ token }) {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");

  const authToken = token || localStorage.getItem("token");

  // 전체 공지 불러오기
  async function load() {
    try {
      const data = await api("/notices", { method: "GET", token: authToken });
      const list = normalizeToArray(data);
      if (!Array.isArray(list)) console.warn("Unexpected /notices shape:", data);
      setItems(list);
    } catch (err) {
      console.error("공지사항 불러오기 실패:", err);
      setItems([]); // 안전 처리
    }
  }

  // 검색 실행
  async function search() {
    if (!q.trim()) {
      await load();
      return;
    }
    try {
      const data = await api(`/notices/search?q=${encodeURIComponent(q)}`, {
        method: "GET",
        token: authToken,
      });
      const list = normalizeToArray(data);
      if (!Array.isArray(list)) console.warn("Unexpected /notices/search shape:", data);
      setItems(list);
    } catch (err) {
      console.error("검색 실패:", err);
      setItems([]); // 안전 처리
    }
  }

  // 엔터키로 검색
  const handleKeyPress = e => {
    if (e.key === "Enter") {
      e.preventDefault();
      search();
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  return (
    <AppShell>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2>📢 공지사항</h2>

        {/* onKeyDown으로 바꿔도 됨 */}
        <div style={{ marginBottom: "16px" }}>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="제목 / 작성자 / 본문 / 범위(GLOBAL, TEAM, PROJECT)"
            style={{ width: "70%", padding: "8px" }}
          />
          <button onClick={search} style={{ marginLeft: "8px" }}>
            검색
          </button>
        </div>

        {/* 결과 출력 */}
        {!Array.isArray(items) || items.length === 0 ? (
          <p>공지사항이 없습니다.</p>
        ) : (
          <ul>
            {items.map(n => (
              <li
                key={n.id}
                style={{
                  borderBottom: "1px solid #ddd",
                  marginBottom: "12px",
                  paddingBottom: "8px",
                }}
              >
                <h4>{n.title}</h4>
                <p>{n.body}</p>
                <small>
                  작성자: {n.username} / 범위: {n.scope} / 작성일:{" "}
                  {new Date(n.created_at).toLocaleString()}
                </small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
