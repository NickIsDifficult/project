// src/components/common/Loader.jsx

export function Loader({ message = "로딩 중..." }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "50vh",
        color: "#555",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: "4px solid #ccc",
          borderTopColor: "#6200ee",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
      <p style={{ marginTop: 12 }}>{message}</p>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
