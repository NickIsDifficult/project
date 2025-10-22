// src/components/common/Select.jsx
export default function Select({
  value,
  onChange,
  options = [],
  fullWidth = false,
  style,
  ...props
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      style={{
        width: fullWidth ? "100%" : "auto",
        padding: "8px 10px",
        borderRadius: "6px",
        border: "1px solid #ccc",
        fontSize: "14px",
        background: "#fff",
        outline: "none",
        cursor: "pointer",
        transition: "border 0.2s",
        ...style,
      }}
      onFocus={e => (e.target.style.border = "1px solid #007bff")}
      onBlur={e => (e.target.style.border = "1px solid #ccc")}
      {...props}
    >
      {options.map(opt => (
        <option key={opt.value || opt} value={opt.value || opt}>
          {opt.label || opt}
        </option>
      ))}
    </select>
  );
}
