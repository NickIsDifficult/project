// src/components/org/RoleAxis.jsx
export default function RoleAxis({ roles = [] }) {
  return (
    <aside style={{ padding: "8px 6px" }}>
      <div style={{ fontWeight: 600, margin: "4px 0 10px" }}>직급</div>
      {roles.length === 0 ? (
        <div style={{ color: "#999" }}>표시할 직급이 없습니다.</div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
          {roles.map(r => (
            <li
              key={r.role_id}
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                background: "#f7f7f7",
                border: "1px solid #eee",
              }}
              title={`role_no: ${r.role_no}`}
            >
              <div style={{ fontSize: 14 }}>{r.role_name ?? `직급 ${r.role_no}`}</div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
