// src/components/common/Drawer.jsx (Tailwind 없이 완전 독립형)
import { useEffect } from "react";
import { createPortal } from "react-dom";

export function Drawer({ open, title, children, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onEsc = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.4)",
          zIndex: 999,
        }}
      />

      {/* Drawer Panel */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "480px",
          maxWidth: "100%",
          height: "100%",
          background: "#fff",
          boxShadow: "-2px 0 8px rgba(0,0,0,0.1)",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease",
        }}
      >
        <header
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #ddd",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#f9f9f9",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              fontSize: "20px",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>{children}</div>
      </aside>
    </>,
    document.body,
  );
}
