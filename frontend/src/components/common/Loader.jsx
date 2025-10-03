export function Loader({ text = "로딩 중..." }) {
  return (
    <div
      style={{
        padding: "40px",
        textAlign: "center",
        color: "#555",
        fontSize: "16px",
      }}
    >
      ⏳ {text}
    </div>
  );
}
