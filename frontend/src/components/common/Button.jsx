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
    login: {
      background: "#2d6cdf",
      color: "#fff",
      fontWeight: 700,
      borderRadius: "12px",
      borderColor: "#2d6cdf",
    },
  };

  // ✅ hover 시 색상 맵핑
  const hoverMap = {
    primary: "#0056b3",
    success: "#1e7e34",
    secondary: "#545b62",
    outline: "#f8f9fa",
    login: "#1e5adf",
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
        const hoverColor = hoverMap[variant];
        if (variant === "outline") {
          e.currentTarget.style.background = hoverColor;
          e.currentTarget.style.color = "#111";
        } else {
          e.currentTarget.style.background = hoverColor;
          e.currentTarget.style.borderColor = hoverColor;
        }
      }}
      onMouseLeave={e => {
        const bg = variants[variant]?.background ?? "#fff";
        const border = variants[variant]?.borderColor ?? "#ccc";
        const color = variants[variant]?.color ?? "#333";
        e.currentTarget.style.background = bg;
        e.currentTarget.style.borderColor = border;
        e.currentTarget.style.color = color;
      }}
      {...props}
    >
      {children}
    </button>
  );
}
