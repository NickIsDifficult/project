// src/pages/notices/NoticeDetail.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../services/api/http"; // ✅ axios 인스턴스 import

export default function NoticeDetail() {
  const { id } = useParams();
  const [refId, setRefId] = useState("");
  const [references, setReferences] = useState([]);

  // -----------------------------
  // ✅ 참조 목록 불러오기
  // -----------------------------
  const loadRefs = async () => {
    try {
      const { data } = await API.get(`/notices/${id}/references`);
      setReferences(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("참조 목록 불러오기 실패:", err);
      setReferences([]);
    }
  };

  // -----------------------------
  // ✅ 참조 추가
  // -----------------------------
  const addRef = async () => {
    if (!refId.trim()) {
      alert("참조할 공지 ID를 입력하세요!");
      return;
    }

    try {
      await API.post(`/notices/${id}/references`, {
        ref_notice_id: parseInt(refId, 10),
      });

      setRefId("");
      await loadRefs();
      alert("참조가 추가되었습니다 ✅");
    } catch (err) {
      console.error("참조 추가 실패:", err);
      alert("참조 추가 실패: " + (err.message || ""));
    }
  };

  useEffect(() => {
    loadRefs();
  }, [id]);

  // -----------------------------
  // ✅ UI 렌더링
  // -----------------------------
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 20 }}>
      <h2>📄 공지사항 #{id} 참조 관리</h2>

      {/* 참조 추가 입력 */}
      <div style={{ marginTop: 12, marginBottom: 16 }}>
        <input
          type="number"
          placeholder="참조할 공지 ID 입력"
          value={refId}
          onChange={e => setRefId(e.target.value)}
          style={{
            padding: 8,
            borderRadius: 4,
            border: "1px solid #ccc",
            marginRight: 8,
          }}
        />
        <button
          onClick={addRef}
          style={{
            backgroundColor: "#1976D2",
            color: "white",
            border: "none",
            padding: "8px 14px",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          참조 추가
        </button>
      </div>

      {/* 참조 목록 */}
      <h3>📚 참조 목록</h3>
      {references.length === 0 ? (
        <p>등록된 참조가 없습니다.</p>
      ) : (
        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
          {references.map(r => (
            <li
              key={r.id}
              style={{
                padding: "8px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <strong>#{r.ref_notice_id}</strong> — {r.ref_title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
