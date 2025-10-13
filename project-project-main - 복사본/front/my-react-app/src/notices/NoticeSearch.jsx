// src/NoticeSearch.js
import React, { useState } from "react";
import { api } from "../api";

export default function NoticeSearch({ token }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);

  // 검색 실행
  async function search() {
    if (!q.trim()) return;
    try {
      const data = await api(`/notices/search?q=${encodeURIComponent(q)}`, {
        method: "GET",
        token,
      });
      setResults(data);
    } catch (err) {
      console.error("검색 실패:", err);
      alert("검색 중 오류가 발생했습니다.");
    }
  }

  // 엔터키로 검색 실행
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      search();
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🔍 공지사항 검색</h2>
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="검색어 입력 (제목/내용/작성자/범위)"
        style={{ width: "300px", marginRight: "10px" }}
      />
      <button onClick={search}>검색</button>

      <div style={{ marginTop: "20px" }}>
        {results.length === 0 ? (
          <p>검색 결과가 없습니다.</p>
        ) : (
          <ul>
            {results.map((n) => (
              <li key={n.id} style={{ marginBottom: "15px" }}>
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
    </div>
  );
}
