// src/pages/notices/NoticeReferences.jsx
import { useEffect, useState } from "react";
import API from "../../services/api/http"; // ✅ axios 인스턴스 import

export default function NoticeReferences({ noticeId }) {
  const [refs, setRefs] = useState([]);
  const [refType, setRefType] = useState("notice");
  const [refId, setRefId] = useState("");
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // ✅ 참조 목록 불러오기
  // -----------------------------
  async function loadRefs() {
    setLoading(true);
    try {
      const { data } = await API.get(`/notices/${noticeId}/references`);
      setRefs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("참조 목록 불러오기 실패:", err);
      setRefs([]);
    } finally {
      setLoading(false);
    }
  }

  // -----------------------------
  // ✅ 참조 추가
  // -----------------------------
  async function addRef() {
    if (!refId.trim()) {
      alert("참조할 ID를 입력하세요!");
      return;
    }

    try {
      await API.post(`/notices/${noticeId}/references`, {
        ref_type: refType,
        ref_id: refId.trim(),
      });

      alert("참조가 추가되었습니다 ✅");
      setRefId("");
      await loadRefs();
    } catch (err) {
      console.error("참조 추가 실패:", err);
      alert("참조 추가 실패: " + (err.message || ""));
    }
  }

  useEffect(() => {
    if (noticeId) loadRefs();
  }, [noticeId]);

  // -----------------------------
  // ✅ UI 렌더링
  // -----------------------------
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginTop: 16 }}>
      <h4>🔗 참조 내역</h4>

      {loading ? (
        <p>불러오는 중...</p>
      ) : refs.length === 0 ? (
        <p>참조된 항목이 없습니다.</p>
      ) : (
        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
          {refs.map(r => (
            <li
              key={r.id}
              style={{
                padding: "4px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <strong>{r.ref_type}</strong> #{r.ref_id}
            </li>
          ))}
        </ul>
      )}

      {/* 🔹 참조 추가 입력 */}
      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <select
          value={refType}
          onChange={e => setRefType(e.target.value)}
          style={{
            padding: "6px",
            borderRadius: 4,
            border: "1px solid #ccc",
          }}
        >
          <option value="notice">공지</option>
          <option value="event">일정</option>
          <option value="file">파일</option>
        </select>

        <input
          value={refId}
          onChange={e => setRefId(e.target.value)}
          placeholder="참조 ID"
          style={{
            padding: "6px",
            flex: 1,
            borderRadius: 4,
            border: "1px solid #ccc",
          }}
        />

        <button
          onClick={addRef}
          style={{
            backgroundColor: "#1976D2",
            color: "white",
            border: "none",
            padding: "8px 12px",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          + 참조 추가
        </button>
      </div>
    </div>
  );
}
