// src/components/common/Modal.jsx
export default function Modal({ open, title, onClose, children }) {
  if (!open) return null;

  return (
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
          backgroundColor: "rgba(0,0,0,0.4)",
          zIndex: 999,
        }}
      />
      {/* Modal box */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "#fff",
          borderRadius: 12,
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          width: "480px",
          maxWidth: "90%",
          zIndex: 1000,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #eee",
            fontWeight: "bold",
            fontSize: 18,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>{title}</span>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: "20px", lineHeight: 1.6 }}>{children}</div>
      </div>
    </>
  );
}
