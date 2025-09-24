import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function NoticeList({ token }) {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const navigate = useNavigate();

  // 🔹 전체 공지 불러오기
  async function load() {
    try {
      const data = await api("/notices", {
        method: "GET",
        token,
      });
      setItems(data);
    } catch (err) {
      console.error("공지사항 로드 실패:", err);
    }
  }

  // 🔹 검색 실행
  const search = async () => {
    if (!q.trim()) {
      await load(); // 검색어 없으면 전체 불러오기
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
  };

  // 🔹 엔터키로 검색
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      search();
    }
  };

  // 🔹 공지 등록
  async function addNotice(e) {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) {
      alert("제목과 내용을 입력하세요!");
      return;
    }
    try {
      await api("/notices", {
        method: "POST",
        token,
        body: {
          scope: "GLOBAL",
          title: newTitle,
          body: newBody,
        },
      });
      setNewTitle("");
      setNewBody("");
      await load();
    } catch (err) {
      alert("공지 등록 실패: " + err.message);
    }
  }

  // 🔹 공지 수정
  async function editNotice(id, oldTitle, oldBody) {
    const newTitle = prompt("새 제목:", oldTitle);
    const newBody = prompt("새 내용:", oldBody);
    if (!newTitle || !newBody) return;
    try {
      await api(`/notices/${id}`, {
        method: "PUT",
        token,
        body: { title: newTitle, body: newBody },
      });
      await load();
    } catch (err) {
      alert("수정 실패: " + err.message);
    }
  }

  // 🔹 공지 삭제
  async function deleteNotice(id) {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await api(`/notices/${id}`, { method: "DELETE", token });
      await load();
    } catch (err) {
      alert("삭제 실패: " + err.message);
    }
  }

  // ✅ 최초 로드
  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  return (
    <div>
      <h3>📢 공지사항</h3>

      {/* 검색창 */}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="검색어 입력"
      />
      <button onClick={search}>검색</button>

      {/* 📅 캘린더 이동 */}
      <button
        style={{ marginLeft: "10px", backgroundColor: "#2196F3", color: "white" }}
        onClick={() => navigate("/calendar")}
      >
        📅 캘린더 보기
      </button>

      {/* ✏ 새 공지 등록 */}
      <form onSubmit={addNotice} style={{ marginTop: "20px" }}>
        <h4>✏ 새 공지 등록</h4>
        <input
          type="text"
          placeholder="제목"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="내용"
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
          required
          rows={3}
          style={{ display: "block", marginTop: "5px", width: "100%" }}
        />
        <button type="submit" style={{ marginTop: "10px" }}>
          등록
        </button>
      </form>

      {/* 📋 공지 목록 */}
      <div style={{ marginTop: "20px" }}>
        {items.length === 0 ? (
          <p>공지사항이 없습니다.</p>
        ) : (
          items.map((n) => (
            <div
              key={n.id}
              style={{
                marginBottom: "15px",
                borderBottom: "1px solid #ccc",
                paddingBottom: "10px",
              }}
            >
              <h4>{n.title}</h4>
              <p>{n.body}</p>
              <small>
                작성자: {n.username} [{n.scope}] / 작성일:{" "}
                {new Date(n.created_at).toLocaleString()}
              </small>
              <div style={{ marginTop: "8px" }}>
                <button onClick={() => editNotice(n.id, n.title, n.body)}>
                  ✏ 수정
                </button>
                <button
                  style={{ marginLeft: "8px", color: "red" }}
                  onClick={() => deleteNotice(n.id)}
                >
                  🗑 삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
