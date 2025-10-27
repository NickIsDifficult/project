import { useState } from "react";
import API from "../../services/api/http";

export default function AiChatPanel() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "안녕하세요! 무엇을 도와드릴까요?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async e => {
    e.preventDefault();
    if (!input.trim()) return;
    const newMsg = { role: "user", content: input };
    setMessages(prev => [...prev, newMsg]);
    setInput("");
    setLoading(true);
    try {
      const { data } = await API.post("/ai/command", { prompt: input });
      const reply = data.summary || data.message || data.result || JSON.stringify(data, null, 2);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "❌ AI 응답 실패했습니다." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: 400 }}>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          border: "1px solid #eee",
          borderRadius: 8,
          padding: 10,
          background: "#fafafa",
          marginBottom: 8,
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              textAlign: m.role === "user" ? "right" : "left",
              marginBottom: 6,
            }}
          >
            <span
              style={{
                display: "inline-block",
                background: m.role === "user" ? "#2563eb" : "#e5e7eb",
                color: m.role === "user" ? "#fff" : "#111",
                padding: "6px 10px",
                borderRadius: 8,
                maxWidth: "80%",
                wordBreak: "break-word",
              }}
            >
              {m.content}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          placeholder="AI에게 메시지를 입력하세요..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
          style={{
            flex: 1,
            border: "1px solid #ccc",
            borderRadius: 6,
            padding: "8px 10px",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "8px 12px",
            cursor: "pointer",
          }}
        >
          {loading ? "..." : "보내기"}
        </button>
      </form>
    </div>
  );
}
