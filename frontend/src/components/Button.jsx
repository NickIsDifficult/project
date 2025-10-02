// frontend/src/components/Button.jsx
import React from "react";

export default function Button({ children, onClick, type="button", style }) {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        width: "100%", padding: "12px 14px", borderRadius: "12px",
        border: "none", background: "#2d6cdf", color: "white",
        fontWeight: 700, cursor: "pointer", ...style
      }}
    >
      {children}
    </button>
  );
}
