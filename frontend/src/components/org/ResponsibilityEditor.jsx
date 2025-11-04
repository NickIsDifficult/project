// src/components/org/ResponsibilityEditor.jsx
import { useEffect, useState } from "react";
import { getEmployeeResponsibility, updateEmployeeResponsibility } from "../../services/api/employee";

export default function ResponsibilityEditor({ empId, canEdit = false }) {
  const [text, setText] = useState("");
  const [orig, setOrig] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await getEmployeeResponsibility(empId);
        if (!alive) return;
        const t = res?.responsibility_text ?? "";
        setText(t);
        setOrig(t);
      } catch (e) {
        console.error("담당업무 로딩 실패:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [empId]);

  const dirty = text !== orig;
  const actionLabel = orig && orig.trim().length > 0 ? "수정" : "추가";

  const onSave = async () => {
    if (!canEdit || !dirty) return;
    try {
      setSaving(true);
      await updateEmployeeResponsibility(empId, text);
      setOrig(text);
      alert("저장되었습니다.");
    } catch (e) {
      alert("저장 실패");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ color: "#999" }}>불러오는 중…</div>;

  return (
    <div>
      <div
        style={{
          whiteSpace: "pre-wrap",
          fontSize: 14,
          color: "#333",
          background: "#fafafa",
          border: "1px solid #eee",
          borderRadius: 8,
          padding: 10,
        }}
      >
        {canEdit ? (
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="담당업무를 입력하세요."
            rows={5}
            style={{ width: "100%", border: "none", outline: "none", background: "transparent", resize: "vertical" }}
          />
        ) : text && text.trim() ? (
          text
        ) : (
          "등록된 담당업무가 없습니다."
        )}
      </div>

      {canEdit && (
        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          <button
            onClick={onSave}
            disabled={!dirty || saving}
            style={{
              padding: "6px 10px",
              border: "1px solid #ddd",
              borderRadius: 8,
              background: dirty ? "#eef9ff" : "#fafafa",
              cursor: dirty ? "pointer" : "default",
            }}
          >
            {saving ? "저장 중…" : `업무${actionLabel}`}
          </button>
          <button
            onClick={() => setText(orig)}
            disabled={!dirty || saving}
            style={{ padding: "6px 10px", border: "1px solid #eee", borderRadius: 8, background: "#fff" }}
          >
            되돌리기
          </button>
        </div>
      )}
    </div>
  );
}
