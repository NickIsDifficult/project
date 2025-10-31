// src/pages/notices/NoticeForm.jsx
import { useState } from "react";
import API from "../../services/api/http"; // ✅ axios 인스턴스 import

export default function NoticeForm({ onCreated }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scope, setScope] = useState("GLOBAL"); // GLOBAL, TEAM, PROJECT

  // -----------------------------
  // ✅ 공지 등록
  // -----------------------------
  const submit = async e => {
    e.preventDefault();

    if (!title.trim() || !body.trim()) {
      alert("제목과 내용을 입력하세요!");
      return;
    }

    try {
      await API.post("/notices", {
        title: title.trim(),
        body: body.trim(),
        scope,
      });

      alert("📢 공지 등록 완료");
      setTitle("");
      setBody("");
      setScope("GLOBAL");
      if (onCreated) onCreated();
    } catch (err) {
      console.error("공지 등록 실패:", err);
      alert("공지 등록 실패: " + (err.message || ""));
    }
  };

  // -----------------------------
  // ✅ UI 렌더링
  // -----------------------------
  return (
    <form
      onSubmit={submit}
      style={{
        border: "1px solid #ccc",
        padding: "16px",
        borderRadius: 8,
        maxWidth: 600,
        margin: "0 auto",
      }}
    >
      <h4>✏ 공지 작성</h4>

      <input
        placeholder="제목"
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
        style={{
          display: "block",
          width: "100%",
          padding: 8,
          marginBottom: 8,
          borderRadius: 4,
          border: "1px solid #ddd",
        }}
      />

      <textarea
        placeholder="내용"
        value={body}
        onChange={e => setBody(e.target.value)}
        required
        rows={4}
        style={{
          display: "block",
          width: "100%",
          padding: 8,
          borderRadius: 4,
          border: "1px solid #ddd",
          marginBottom: 8,
          resize: "vertical",
        }}
      />

      <label style={{ display: "block", marginBottom: 8 }}>
        범위:
        <select
          value={scope}
          onChange={e => setScope(e.target.value)}
          style={{
            marginLeft: 8,
            padding: 6,
            borderRadius: 4,
            border: "1px solid #ddd",
          }}
        >
          <option value="GLOBAL">전체</option>
          <option value="TEAM">팀</option>
          <option value="PROJECT">프로젝트</option>
        </select>
      </label>

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
  );
}
