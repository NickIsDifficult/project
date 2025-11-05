// ✅ src/components/projects/AssigneeSelector.jsx
import { memo, useMemo, useState } from "react";

function AssigneeSelector({ employees = [], selected = [], setSelected, disabled = false }) {
  const [query, setQuery] = useState("");
  const safeSelected = Array.isArray(selected) ? selected : [];

  // 🔍 검색 결과 필터링 (이미 선택된 직원 제외)
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const selectedIds = safeSelected.map(s =>
      typeof s === "object" ? Number(s.emp_id) : Number(s),
    );
    return employees.filter(
      e => e.name?.toLowerCase()?.includes(q) && !selectedIds.includes(Number(e.emp_id)),
    );
  }, [employees, safeSelected, query]);

  // ✅ 추가 (emp 객체 단위)
  const handleAdd = emp => {
    if (disabled) return;
    const normalized = {
      emp_id: Number(emp.emp_id ?? emp.id ?? emp.employee_id),
      name: emp.name ?? emp.username ?? "이름없음",
      role: emp.role ?? "",
    };
    setSelected?.([...safeSelected, normalized]);
    setQuery("");
  };

  // ✅ 삭제 (emp_id 기준)
  const handleRemove = empId => {
    if (disabled) return;
    const next = safeSelected.filter(s => Number(s.emp_id) !== Number(empId));
    setSelected?.(next);
  };

  return (
    <div style={{ marginTop: 6, position: "relative" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {safeSelected.map((sel, i) => (
          <span
            key={sel.emp_id ?? sel.id ?? `sel-${i}`}
            style={{
              background: "#e3f2fd",
              color: "#1976d2",
              padding: "4px 8px",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              gap: 6,
              opacity: disabled ? 0.6 : 1,
            }}
          >
            {sel.name}
            {!disabled && (
              <button
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "#888",
                }}
                onClick={() => handleRemove(sel.emp_id)}
              >
                ✕
              </button>
            )}
          </span>
        ))}
      </div>

      {/* 검색 입력 */}
      {!disabled && (
        <>
          <input
            type="text"
            placeholder="담당자 검색"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              width: "100%",
              marginTop: 6,
              border: "1px solid #ccc",
              borderRadius: 6,
              padding: "6px 8px",
            }}
          />
          {query && (
            <div
              style={{
                border: "1px solid #ccc",
                borderRadius: 6,
                marginTop: 4,
                maxHeight: 160,
                overflowY: "auto",
                background: "#fff",
                position: "absolute",
                zIndex: 9999,
                top: "100%",
                left: 0,
                right: 0,
                boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              }}
            >
              {filtered.map((emp, i) => (
                <div
                  key={emp.emp_id ?? emp.id ?? `emp-${i}`}
                  style={{
                    padding: 8,
                    cursor: "pointer",
                    borderBottom: "1px solid #eee",
                  }}
                  onClick={() => handleAdd(emp)}
                >
                  {emp.name}
                  <span style={{ color: "#888", fontSize: 12, marginLeft: 6 }}>({emp.role})</span>
                </div>
              ))}
              {!filtered.length && (
                <div style={{ padding: 8, color: "#999", textAlign: "center" }}>검색 결과 없음</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default memo(AssigneeSelector);
