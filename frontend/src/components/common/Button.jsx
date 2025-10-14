// src/components/common/Button.jsx

/**
 * 공용 버튼 컴포넌트
 * ----------------------------
 * variant: 'primary' | 'success' | 'secondary' | 'outline' | 'login'
 * size: 'sm' | 'md' | 'lg'
 * fullWidth: boolean (true일 경우 width: 100%)
 */
export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  fullWidth = false,
  style,
  ...props
}) {
  const base = {
    display: "inline-block",
    fontWeight: 600,
    border: "1px solid transparent",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s",
    textAlign: "center",
    ...(fullWidth ? { width: "100%" } : {}),
  };

  const sizes = {
    sm: { padding: "6px 12px", fontSize: 13 },
    md: { padding: "8px 14px", fontSize: 14 },
    lg: { padding: "12px 18px", fontSize: 16 },
  };

  const variants = {
    primary: { background: "#007bff", color: "#fff" },
    success: { background: "#28a745", color: "#fff" },
    secondary: { background: "#6c757d", color: "#fff" },
    outline: {
      background: "#fff",
      color: "#333",
      border: "1px solid #ccc",
    },
    login: {
      background: "#2d6cdf",
      color: "#fff",
      fontWeight: 700,
      borderRadius: "12px",
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        ...base,
        ...sizes[size],
        ...variants[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
