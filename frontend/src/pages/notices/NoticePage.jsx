// src/pages/notices/NoticePage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api/http"; // ✅ axios 인스턴스 import

export default function NoticePage() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scope, setScope] = useState("GLOBAL");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // -----------------------------
  // ✅ 공지 전체 불러오기
  // -----------------------------
  async function loadAll() {
    setLoading(true);
    try {
      const { data } = await API.get("/notices");
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("공지 불러오기 실패:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  // -----------------------------
  // ✅ 검색
  // -----------------------------
  const search = async () => {
    if (!q.trim()) return loadAll();

    try {
      setLoading(true);
      const { data } = await API.get("/notices/search", {
        params: { q },
      });
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("검색 실패:", err);
      alert("검색 실패: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = e => {
    if (e.key === "Enter") {
      e.preventDefault();
      search();
    }
  };

  // -----------------------------
  // ✅ 공지 등록
  // -----------------------------
  const createNotice = async e => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      alert("제목과 내용을 입력하세요!");
      return;
    }

    try {
      await API.post("/notices", {
        scope,
        title: title.trim(),
        body: body.trim(),
      });

      alert("📢 공지 등록 완료");
      setTitle("");
      setBody("");
      await loadAll();
    } catch (err) {
      console.error("공지 등록 실패:", err);
      alert("공지 등록 실패: " + (err.message || ""));
    }
  };

  // -----------------------------
  // ✅ UI 렌더링
  // -----------------------------
  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "16px" }}>
      <h2>📢 공지사항</h2>

      {/* 작성 폼 */}
      <form
        onSubmit={createNotice}
        style={{
          marginBottom: "20px",
          padding: "12px",
          border: "1px solid #ccc",
          borderRadius: 8,
        }}
      >
        <select
          value={scope}
          onChange={e => setScope(e.target.value)}
          style={{
            padding: "6px",
            borderRadius: 4,
            border: "1px solid #ccc",
            marginRight: 8,
          }}
        >
          <option value="GLOBAL">전체</option>
          <option value="TEAM">팀</option>
          <option value="PROJECT">프로젝트</option>
        </select>

        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="제목"
          required
          style={{
            width: "100%",
            padding: 8,
            marginTop: 8,
            borderRadius: 4,
            border: "1px solid #ccc",
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
            marginTop: 8,
            padding: 8,
            borderRadius: 4,
            border: "1px solid #ccc",
          }}
        />

        <button
          type="submit"
          style={{
            marginTop: 8,
            backgroundColor: "#1976D2",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          공지 등록
        </button>
      </form>

      {/* 검색 */}
      <div style={{ marginBottom: "20px" }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="검색어 입력"
          style={{
            width: "70%",
            padding: "8px",
            borderRadius: 4,
            border: "1px solid #ccc",
            marginRight: "8px",
          }}
        />
        <button
          onClick={search}
          style={{
            padding: "8px 16px",
            border: "none",
            backgroundColor: "#1976D2",
            color: "white",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          검색
        </button>

        {/* 캘린더 이동 */}
        <button
          style={{
            marginLeft: "10px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: 4,
            cursor: "pointer",
          }}
          onClick={() => navigate("/calendar")}
        >
          📅 캘린더 보기
        </button>
      </div>

      {/* 공지 목록 */}
      <div>
        {loading ? (
          <p>불러오는 중...</p>
        ) : items.length === 0 ? (
          <p>등록된 공지가 없습니다.</p>
        ) : (
          items.map(n => (
            <div
              key={n.id}
              style={{
                marginBottom: "15px",
                padding: "10px",
                borderBottom: "1px solid #ddd",
              }}
            >
              <b>{n.title}</b>
              <p style={{ whiteSpace: "pre-wrap" }}>{n.body}</p>
              <small style={{ color: "#555" }}>
                작성자: {n.username || "알 수 없음"} [{n.scope || "-"}] /{" "}
                {n.created_at ? new Date(n.created_at).toLocaleString() : "-"}
              </small>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
