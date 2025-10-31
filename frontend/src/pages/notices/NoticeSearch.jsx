// src/pages/notices/NoticeSearch.jsx
import { useState } from "react";
import API from "../../services/api/http"; // ✅ axios 인스턴스 import

export default function NoticeSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // ✅ 검색 실행
  // -----------------------------
  async function search() {
    if (!q.trim()) {
      alert("검색어를 입력하세요!");
      return;
    }

    try {
      setLoading(true);
      const { data } = await API.get("/notices/search", {
        params: { q },
      });
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("검색 실패:", err);
      alert("검색 중 오류가 발생했습니다: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  }

  // -----------------------------
  // ✅ 엔터키로 검색 실행
  // -----------------------------
  const handleKeyPress = e => {
    if (e.key === "Enter") {
      e.preventDefault();
      search();
    }
  };

  // -----------------------------
  // ✅ UI 렌더링
  // -----------------------------
  return (
    <div style={{ padding: "20px", maxWidth: 720, margin: "0 auto" }}>
      <h2>🔍 공지사항 검색</h2>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="검색어 입력 (제목/내용/작성자/범위)"
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: 4,
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={search}
          disabled={loading}
          style={{
            padding: "8px 16px",
            backgroundColor: loading ? "#ccc" : "#1976D2",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "검색 중..." : "검색"}
        </button>
      </div>

      <div style={{ marginTop: "20px" }}>
        {loading ? (
          <p>검색 중입니다...</p>
        ) : results.length === 0 ? (
          <p>검색 결과가 없습니다.</p>
        ) : (
          <ul style={{ listStyle: "none", paddingLeft: 0 }}>
            {results.map(n => (
              <li
                key={n.id}
                style={{
                  marginBottom: "15px",
                  paddingBottom: "10px",
                  borderBottom: "1px solid #eee",
                }}
              >
                <h4 style={{ marginBottom: 4 }}>{n.title}</h4>
                <p style={{ whiteSpace: "pre-wrap", marginBottom: 6 }}>{n.body}</p>
                <small style={{ color: "#555" }}>
                  작성자: {n.username || "알 수 없음"} / 범위: {n.scope || "-"} / 작성일:{" "}
                  {n.created_at ? new Date(n.created_at).toLocaleString() : "-"}
                </small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
