import { useEffect, useState } from "react";
import { api } from "../../api";

export default function NoticeReferences({ noticeId, token }) {
  const [refs, setRefs] = useState([]);
  const [refType, setRefType] = useState("notice");
  const [refId, setRefId] = useState("");

  async function loadRefs() {
    const data = await api(`/notices/${noticeId}/references`, {
      method: "GET",
      token,
    });
    setRefs(data);
  }

  async function addRef() {
    await api(`/notices/${noticeId}/references`, {
      method: "POST",
      token,
      body: { ref_type: refType, ref_id: refId },
    });
    setRefId("");
    loadRefs();
  }

  useEffect(() => {
    loadRefs();
  }, []);

  return (
    <div>
      <h4>🔗 참조 내역</h4>
      <ul>
        {refs.map(r => (
          <li key={r.id}>
            {r.ref_type} #{r.ref_id}
          </li>
        ))}
      </ul>

      <div>
        <select value={refType} onChange={e => setRefType(e.target.value)}>
          <option value="notice">공지</option>
          <option value="event">일정</option>
          <option value="file">파일</option>
        </select>
        <input value={refId} onChange={e => setRefId(e.target.value)} placeholder="참조 ID" />
        <button onClick={addRef}>+ 참조 추가</button>
      </div>
    </div>
  );
}
