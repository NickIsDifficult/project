// src/components/ai/AiInputBar.jsx
import { useState } from "react";
import API from "../../services/api/http";

export default function AiInputBar({ onCreated }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAiCreate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const { data } = await API.post("/ai/create_task", { prompt });
      onCreated?.(data.task);
      setPrompt("");
    } catch (err) {
      console.error("AI 생성 실패", err);
      alert("AI가 업무를 생성하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
      <input
        type="text"
        placeholder="예: 다음주 수요일까지 디자인 시안 완료"
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        style={{
          flex: 1,
          padding: "8px 12px",
          borderRadius: 6,
          border: "1px solid #ccc",
        }}
      />
      <button
        onClick={handleAiCreate}
        disabled={loading}
        style={{
          background: "#2563eb",
          color: "#fff",
          padding: "8px 12px",
          borderRadius: 6,
          border: "none",
          cursor: "pointer",
        }}
      >
        {loading ? "생성 중..." : "AI 생성"}
      </button>
    </div>
  );
}
