// src/components/common/Input.jsx
export default function Input({
  value,
  onChange,
  placeholder = "",
  type = "text",
  fullWidth = true,
  style,
  ...props
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: fullWidth ? "100%" : "auto",
        padding: "8px 10px",
        borderRadius: "6px",
        border: "1px solid #ccc",
        fontSize: "14px",
        outline: "none",
        transition: "border 0.2s",
        ...style,
      }}
      onFocus={e => (e.target.style.border = "1px solid #007bff")}
      onBlur={e => (e.target.style.border = "1px solid #ccc")}
      {...props}
    />
  );
}
