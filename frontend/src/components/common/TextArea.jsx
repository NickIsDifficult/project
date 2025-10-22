// src/components/common/TextArea.jsx
export default function TextArea({
  value,
  onChange,
  placeholder = "",
  rows = 3,
  fullWidth = true,
  style,
  ...props
}) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: fullWidth ? "100%" : "auto",
        padding: "8px 10px",
        borderRadius: "6px",
        border: "1px solid #ccc",
        fontSize: "14px",
        resize: "vertical",
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
