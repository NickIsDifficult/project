// src/components/projects/AssigneeSelector.jsx
import { memo, useMemo, useState } from "react";

function AssigneeSelector({ employees = [], selected = [], setSelected }) {
  const [query, setQuery] = useState("");

  // ✅ selected가 배열이 아닐 경우 안전하게 빈 배열로 대체
  const safeSelected = Array.isArray(selected) ? selected : [];

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return employees.filter(
      e => e.name.toLowerCase().includes(q) && !safeSelected.includes(e.emp_id),
    );
  }, [employees, safeSelected, query]);

  const handleAdd = id => {
    if (typeof setSelected === "function") {
      if (Array.isArray(selected)) {
        setSelected([...selected, id]);
        } else {
          setSelected([id]);
        }
      }
      setQuery("");
    };


  const handleRemove = id =>{
    if (typeof setSelected === "function") {
      const safe = Array.isArray(selected) ? selected.filter(s => s !== id) : [];
      setSelected(safe);
  }};

  return (
    <div style={{ marginTop: 6, position: "relative" }}>
      {/* 선택된 담당자 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {safeSelected.map(id => {
          const emp = employees.find(e => e.emp_id === id);
          if (!emp) return null;
          return (
            <span
              key={id}
              style={{
                background: "#e3f2fd",
                color: "#1976d2",
                padding: "4px 8px",
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {emp.name}
              <button
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "#888",
                }}
                onClick={() => handleRemove(id)}
              >
                ✕
              </button>
            </span>
          );
        })}
      </div>

      {/* 검색 입력 */}
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

      {/* 드롭다운 */}
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
            zIndex: 999999,
            top :"100%",
            left : 0,
            right : 0,
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          }}
        >
          {filtered.map(emp => (
            <div
              key={emp.emp_id}
              style={{
                padding: 8,
                cursor: "pointer",
                borderBottom: "1px solid #eee",
              }}
              onClick={() => handleAdd(emp.emp_id)}
            >
              {emp.name}
              <span style={{ color: "#888", fontSize: 12, marginLeft: 6 }}>({emp.role})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(AssigneeSelector);
