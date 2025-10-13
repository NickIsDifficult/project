import React, { useState, useEffect } from "react";
import AppShell from "../layout/AppShell";

export default function NoticeBoard({ token }) {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");

  // 전체 공지 불러오기
  async function load() {
    try {
      const data = await api("/notices", { method: "GET", token: localStorage.getItem("token"), });
      setItems(data);
    } catch (err) {
      console.error("공지사항 불러오기 실패:", err);
    }
  }

  // 검색 실행
  async function search() {
    if (!q.trim()) {
      await load(); // 검색어 없으면 전체목록
      return;
    }
    try {
      const data = await api(`/notices/search?q=${encodeURIComponent(q)}`, {
        method: "GET",
        token,
      });
      setItems(data);
    } catch (err) {
      console.error("검색 실패:", err);
    }
  }

  // 엔터키로 검색
  const handleKeyPress = (e) => {
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

      {/* 검색창 */}
      <div style={{ marginBottom: "16px" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="제목 / 작성자 / 본문 / 범위(GLOBAL, TEAM, PROJECT)"
          style={{ width: "70%", padding: "8px" }}
        />
        <button onClick={search} style={{ marginLeft: "8px" }}>
          검색
        </button>
      </div>

      {/* 결과 출력 */}
      {items.length === 0 ? (
        <p>공지사항이 없습니다.</p>
      ) : (
        <ul>
          {items.map((n) => (
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
