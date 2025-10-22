// src/components/common/Button.jsx
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
    borderRadius: "8px",
    border: "1px solid transparent",
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
    primary: {
      background: "#007bff",
      color: "#fff",
      borderColor: "#007bff",
    },
    success: {
      background: "#28a745",
      color: "#fff",
      borderColor: "#28a745",
    },
    secondary: {
      background: "#6c757d",
      color: "#fff",
      borderColor: "#6c757d",
    },
    outline: {
      background: "#fff",
      color: "#333",
      border: "1px solid #ccc",
    },
  };

  const hoverMap = {
    primary: "#0056b3",
    success: "#1e7e34",
    secondary: "#545b62",
    outline: "#f8f9fa",
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
      onMouseEnter={e => {
        e.currentTarget.style.background =
          variant === "outline" ? hoverMap[variant] : hoverMap[variant];
        e.currentTarget.style.borderColor = hoverMap[variant];
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = variants[variant].background;
        e.currentTarget.style.borderColor = variants[variant].borderColor;
      }}
      {...props}
    >
      {children}
    </button>
  );
}
