// src/pages/notices/Notices.jsx
import { useEffect, useState } from "react";
import API from "../../services/api/http"; // ✅ axios 인스턴스 import

export default function Notices() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [list, setList] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // ✅ 공지 불러오기 (검색 포함)
  // -----------------------------
  async function load(search = "") {
    setLoading(true);
    try {
      const { data } = await API.get("/notices/search", {
        params: { q: search },
      });
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("공지사항 로드 실패:", err);
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  // -----------------------------
  // ✅ 공지 등록
  // -----------------------------
  async function submit(e) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      alert("제목과 내용을 입력하세요!");
      return;
    }

    try {
      await API.post("/notices", {
        title: title.trim(),
        body: body.trim(),
        scope: "GLOBAL",
      });
      alert("📢 공지 등록 완료");
      setTitle("");
      setBody("");
      await load(query);
    } catch (err) {
      console.error("공지 등록 실패:", err);
      alert("공지 등록 실패: " + (err.message || ""));
    }
  }

  // -----------------------------
  // ✅ 검색
  // -----------------------------
  async function search(e) {
    e.preventDefault();
    load(query);
  }

  useEffect(() => {
    load();
  }, []);

  // -----------------------------
  // ✅ UI 렌더링
  // -----------------------------
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px" }}>
      <h2>📢 공지사항</h2>

      {/* 🔹 공지 등록 */}
      <form
        onSubmit={submit}
        style={{
          border: "1px solid #ccc",
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
        }}
      >
        <h4>✏ 새 공지 등록</h4>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="제목"
          required
          style={{
            width: "100%",
            padding: 8,
            marginBottom: 8,
            border: "1px solid #ccc",
            borderRadius: 4,
          }}
        />
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="내용"
          required
          rows={3}
          style={{
            width: "100%",
            padding: 8,
            marginBottom: 8,
            border: "1px solid #ccc",
            borderRadius: 4,
          }}
        />
        <button
          type="submit"
          style={{
            backgroundColor: "#1976D2",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          등록
        </button>
      </form>

      {/* 🔹 검색창 */}
      <form onSubmit={search} style={{ marginBottom: 16 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="검색어 입력 (제목 / 내용 / 작성자 / 범위)"
          style={{
            width: "70%",
            padding: 8,
            border: "1px solid #ccc",
            borderRadius: 4,
            marginRight: 8,
          }}
        />
        <button
          type="submit"
          style={{
            backgroundColor: "#1976D2",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          검색
        </button>
      </form>

      {/* 🔹 공지 리스트 */}
      {loading ? (
        <p>불러오는 중...</p>
      ) : list.length === 0 ? (
        <p>공지사항이 없습니다.</p>
      ) : (
        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
          {list.map(n => (
            <li
              key={n.id}
              style={{
                marginBottom: 12,
                paddingBottom: 8,
                borderBottom: "1px solid #eee",
              }}
            >
              <b>{n.title}</b> — {n.body}
              <br />
              <small>
                작성자: {n.username || "알 수 없음"}{" "}
                <span style={{ color: "blue", marginLeft: 8 }}>[{n.scope || "GLOBAL"}]</span>
              </small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
