import React, { useState, useEffect } from "react";
import { api } from "../../api";
import { useParams } from "react-router-dom";

function NoticeDetail({ token }) {
  const { id } = useParams();
  const [refId, setRefId] = useState("");
  const [references, setReferences] = useState([]);

  const loadRefs = async () => {
    const res = await api(`/notices/${id}/references`, { method: "GET", token });
    setReferences(res);
  };

  const addRef = async () => {
    await api(`/notices/${id}/references`, {
      method: "POST",
      body: { ref_notice_id: parseInt(refId) },
      token,
    });
    setRefId("");
    loadRefs();
  };

  useEffect(() => {
    loadRefs();
  }, [id]);

  return (
    <div>
      <h2>공지사항 {id} 참조 관리</h2>

      <input
        type="number"
        placeholder="참조할 공지 ID 입력"
        value={refId}
        onChange={(e) => setRefId(e.target.value)}
      />
      <button onClick={addRef}>참조 추가</button>

      <h3>참조 목록</h3>
      <ul>
        {references.map((r) => (
          <li key={r.id}>
            #{r.ref_notice_id} - {r.ref_title}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default NoticeDetail;
