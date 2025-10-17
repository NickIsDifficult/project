import { useEffect, useState } from "react";
import { api } from "../../api";

export default function Notices({ token }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [list, setList] = useState([]);
  const [query, setQuery] = useState("");

  async function load(search = "") {
    const data = await api(`/notices/search?q=${encodeURIComponent(search)}`, "GET", null, token);
    setList(data);
  }

  async function submit(e) {
    e.preventDefault();
    await api("/notices", "POST", { title, body, scope: "GLOBAL" }, token);
    setTitle("");
    setBody("");
    load(query);
  }

  async function search(e) {
    e.preventDefault();
    load(query);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h2>📢 공지사항</h2>

      {/* 🔹 공지 등록 */}
      <form onSubmit={submit}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="제목" required />
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="내용"
          required
        />
        <button type="submit">등록</button>
      </form>

      {/* 🔹 검색창 */}
      <form onSubmit={search} style={{ marginTop: "1em" }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="검색어 입력 (제목/내용/scope)"
        />
        <button type="submit">검색</button>
      </form>

      {/* 🔹 공지 리스트 */}
      <ul style={{ marginTop: "1em" }}>
        {list.map(n => (
          <li key={n.id}>
            <b>{n.title}</b> - {n.body} ({n.username})
            <span style={{ color: "blue", marginLeft: "10px" }}>[{n.scope}]</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
