import { useEffect, useState } from "react";
import AppShell from "../layout/AppShell";

export default function TrashBin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null); // ✅ 업로드 파일 상태

  // 휴지통 불러오기
  const loadTrash = async () => {
    setLoading(true);
    try {
      const res = await API.get("/trash");
      setItems(res.data);
    } catch (err) {
      console.error("휴지통 불러오기 실패:", err);
    }
    setLoading(false);
  };

  // ✅ 복원 (확인창 추가)
  const restoreItem = async (id, title) => {
    if (!window.confirm(`"${title}" 파일을 복원하시겠습니까?`)) {
      return; // 취소 시 동작 안 함
    }
    await API.post(`/trash/${id}/restore`);
    loadTrash();
  };

  // ✅ 완전삭제 (확인창 추가)
  const purgeItem = async (id, title) => {
    if (!window.confirm(`정말 "${title}" 파일을 완전히 삭제하시겠습니까?`)) {
      return;
    }
    await API.delete(`/trash/${id}/purge`);
    loadTrash();
  };

  // 파일 업로드 → 휴지통 이동
  const uploadFile = async () => {
    if (!file) {
      alert("파일을 선택하세요!");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);

    try {
      await API.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFile(null);
      loadTrash();
    } catch (err) {
      console.error("파일 업로드 실패:", err);
    }
  };

  useEffect(() => {
    loadTrash();
  }, []);

  if (loading) return <p>로딩 중...</p>;

  return (
    <AppShell>
      <div style={{ padding: "20px" }}>
        <h2>휴지통</h2>

        {/* ✅ 파일 업로드 UI */}
        <div style={{ marginBottom: "15px" }}>
          <input
            type="file"
            onChange={e => setFile(e.target.files[0])}
            style={{ marginRight: "10px" }}
          />
          <button
            onClick={uploadFile}
            style={{
              background: "blue",
              color: "white",
              border: "none",
              borderRadius: "4px",
              padding: "6px 12px",
              cursor: "pointer",
            }}
          >
            업로드 후 휴지통 이동
          </button>
        </div>

        {items.length === 0 ? (
          <p>휴지통이 비어있습니다.</p>
        ) : (
          <ul>
            {items.map(item => (
              <li
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  padding: "10px",
                  marginBottom: "8px",
                }}
              >
                <div>
                  <strong>{item.title || "제목 없음"}</strong>
                  <div style={{ fontSize: "12px", color: "gray" }}>
                    {item.table_name} #{item.record_id} | 삭제일:{" "}
                    {new Date(item.deleted_at).toLocaleString()} | 사유:{" "}
                    {item.delete_reason || "없음"}
                  </div>
                </div>
                <div>
                  <button
                    onClick={() => restoreItem(item.id, item.title || "제목 없음")}
                    style={{
                      marginRight: "8px",
                      background: "green",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "5px 10px",
                    }}
                  >
                    복원
                  </button>
                  <button
                    onClick={() => purgeItem(item.id, item.title || "제목 없음")}
                    style={{
                      background: "red",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "5px 10px",
                    }}
                  >
                    완전삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
