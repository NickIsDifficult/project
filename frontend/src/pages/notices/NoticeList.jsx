// src/pages/notices/NoticeList.jsx
import { useEffect, useState } from "react";
import { api } from "../../services/api";
import AppShell from "../../layout/AppShell";

export default function NoticeList({ token }) {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");

  const authToken = token || localStorage.getItem("token");

  // 전체 공지 불러오기
  async function load() {
    try {
      const data = await api("/notices", { method: "GET", token: authToken });
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("공지사항 로드 실패:", err);
      setItems([]);
    }
  }

  // 검색
  const search = async () => {
    if (!q.trim()) return load();
    try {
      const data = await api(`/notices/search?q=${encodeURIComponent(q)}`, {
        method: "GET",
        token: authToken,
      });
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("검색 실패:", err);
    }
  };

  const handleKeyDown = e => {
    if (e.key === "Enter") {
      e.preventDefault();
      search();
    }
  };

  // 공지 등록
  async function addNotice(e) {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) {
      alert("제목과 내용을 입력하세요!");
      return;
    }
    try {
      await api("/notices", {
        method: "POST",
        token: authToken,
        body: { scope: "GLOBAL", title: newTitle.trim(), body: newBody },
      });
      setNewTitle("");
      setNewBody("");
      setShowForm(false);
      await load();
      alert("공지 등록 완료");
    } catch (err) {
      if (err?.status === 401) {
        alert("로그인이 만료되었습니다. 다시 로그인해 주세요.");
        localStorage.removeItem("token");
        localStorage.removeItem("access_token");
        window.location.href = "/";
        return;
      }
      alert("공지 등록 실패: " + (err.message || ""));
    }
  }

  // 공지 수정
  async function editNotice(id, oldTitle, oldBody) {
    const t = prompt("새 제목:", oldTitle);
    const b = prompt("새 내용:", oldBody);
    if (!t || !b) return;
    try {
      await api(`/notices/${id}`, {
        method: "PUT",
        token: authToken,
        body: { title: t, body: b },
      });
      await load();
    } catch (err) {
      alert("수정 실패: " + (err.message || ""));
    }
  }

  // 공지 삭제
  async function deleteNotice(id) {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await api(`/notices/${id}`, { method: "DELETE", token: authToken });
      await load();
    } catch (err) {
      if (String(err.message || "").includes("HTTP 403")) {
        alert("삭제 권한이 없습니다. (관리자 전용)");
      } else {
        alert("삭제 실패: " + (err.message || ""));
      }
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <AppShell>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <h3>📢 공지사항</h3>

        {/* 검색바 */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="검색어 입력 (제목/내용/작성자/범위)"
            style={{ flex: 1, padding: 8 }}
          />
          <button onClick={search}>검색</button>
          <button
            style={{ backgroundColor: "#1976D2", color: "white" }}
            onClick={() => setShowForm(v => !v)}
            title="공지 등록"
          >
            ✚ 공지 등록
          </button>
        </div>

        {/* 등록 폼 */}
        {showForm && (
          <form onSubmit={addNotice} style={{ marginTop: 12, marginBottom: 16 }}>
            <h4>✏ 새 공지 등록</h4>
            <input
              type="text"
              placeholder="제목"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              required
              style={{ display: "block", width: "100%", padding: 8 }}
            />
            <textarea
              placeholder="내용"
              value={newBody}
              onChange={e => setNewBody(e.target.value)}
              required
              rows={3}
              style={{ display: "block", marginTop: 6, width: "100%", padding: 8 }}
            />
            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <button type="submit">등록</button>
              <button type="button" onClick={() => setShowForm(false)}>
                닫기
              </button>
            </div>
          </form>
        )}

        {/* 목록 */}
        <div style={{ marginTop: 8 }}>
          {items.length === 0 ? (
            <p>공지사항이 없습니다.</p>
          ) : (
            items.map(n => (
              <div
                key={n.id}
                style={{
                  marginBottom: 15,
                  borderBottom: "1px solid #ccc",
                  paddingBottom: 10,
                }}
              >
                <h4 style={{ marginBottom: 6 }}>{n.title}</h4>
                <p style={{ whiteSpace: "pre-wrap" }}>{n.body}</p>
                <small>
                  작성자: {n.username} [{n.scope}] / 작성일:{" "}
                  {new Date(n.created_at).toLocaleString()}
                </small>
                <div style={{ marginTop: 8 }}>
                  <button onClick={() => editNotice(n.id, n.title, n.body)}>✏ 수정</button>
                  <button
                    style={{ marginLeft: 8, color: "red" }}
                    onClick={() => deleteNotice(n.id)}
                    title="관리자만 삭제 가능"
                  >
                    🗑 삭제
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
