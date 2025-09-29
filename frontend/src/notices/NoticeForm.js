import React, { useState } from "react";
import { api } from "../api";

export default function NoticeForm({ token, onCreated }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scope, setScope] = useState("GLOBAL"); // GLOBAL, TEAM, PROJECT

  const submit = async (e) => {
    e.preventDefault();
    const res = await api("/notices", {
      method: "POST",
      token,
      body: { title, body, scope }
    });
    if (res.ok) {
      alert("공지 등록 완료");
      setTitle("");
      setBody("");
      onCreated && onCreated();
    } else {
      alert(res.msg || "등록 실패");
    }
  };

  return (
    <form onSubmit={submit}>
      <h4>공지 작성</h4>
      <input
        placeholder="제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      /><br />
      <textarea
        placeholder="내용"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      /><br />
      <select value={scope} onChange={(e) => setScope(e.target.value)}>
        <option value="GLOBAL">전체</option>
        <option value="TEAM">팀</option>
        <option value="PROJECT">프로젝트</option>
      </select><br />
      <button type="submit">등록</button>
    </form>
  );
}
