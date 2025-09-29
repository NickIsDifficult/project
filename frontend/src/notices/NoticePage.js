import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function NoticePage({ token }) {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  // 새 공지 입력 상태
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scope, setScope] = useState("GLOBAL");

  // 전체 공지 불러오기
  async function loadAll() {
    const data = await api("/notices", {
      method: "GET",
      token,
    });
    setItems(data);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line
  }, []);

  // 검색 실행
  const search = async () => {
    if (!q.trim()) {
      await loadAll();
      return;
    }
    const data = await api(`/notices/search?q=${encodeURIComponent(q)}`, {
      method: "GET",
      token,
    });
    setItems(data);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      search();
    }
  };

  // 공지 작성
  const createNotice = async (e) => {
    e.preventDefault();
    if (!title || !body) {
      alert("제목과 내용을 입력하세요!");
      return;
    }

    await api("/notices", {
      method: "POST",
      token,
      body: { scope, title, body },
    });

    setTitle("");
    setBody("");
    await loadAll(); // 등록 후 목록 갱신
  };

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
      <h2>📢 공지사항</h2>

      {/* 작성 폼 */}
      <form onSubmit={createNotice} style={{ marginBottom: "20px" }}>
        <select value={scope} onChange={(e) => setScope(e.target.value)}>
          <option value="GLOBAL">전체</option>
          <option value="TEAM">팀</option>
          <option value="PROJECT">프로젝트</option>
        </select>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
          required
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="내용"
          required
        />
        <button type="submit">공지 등록</button>
      </form>

      {/* 검색 */}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="검색어 입력"
      />
      <button onClick={search}>검색</button>

      {/* 캘린더 이동 */}
      <button
        style={{ marginLeft: "10px", backgroundColor: "#4CAF50", color: "white" }}
        onClick={() => navigate("/calendar")}
      >
        📅 캘린더 보기
      </button>

      {/* 공지 목록 */}
      <div style={{ marginTop: "20px" }}>
        {items.length === 0 ? (
          <p>등록된 공지가 없습니다.</p>
        ) : (
          items.map((n) => (
            <div
              key={n.id}
              style={{
                marginBottom: "15px",
                padding: "10px",
                borderBottom: "1px solid #ddd",
              }}
            >
              <b>{n.title}</b>
              <p>{n.body}</p>
              <small>
                작성자: {n.username} [{n.scope}] /{" "}
                {new Date(n.created_at).toLocaleString()}
              </small>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
