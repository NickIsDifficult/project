export function Button({ variant = "primary", children, style, ...props }) {
  const base = {
    padding: "8px 14px",
    borderRadius: "6px",
    fontWeight: 500,
    border: "1px solid transparent",
    cursor: "pointer",
    transition: "all 0.2s",
  };

  const styles = {
    primary: { background: "#007bff", color: "#fff" },
    success: { background: "#28a745", color: "#fff" },
    secondary: { background: "#6c757d", color: "#fff" },
    outline: { background: "#fff", color: "#333", border: "1px solid #ccc" },
  };

  return (
    <button {...props} style={{ ...base, ...styles[variant], ...style }}>
      {children}
    </button>
  );
}
