// src/components/ai/AiCommandBar.jsx
import { useState } from "react";
import toast from "react-hot-toast";
import API from "../../services/api/http";
import Modal from "../common/Modal"; // ✅ 결과 확인용 (재사용)
import AiChatPanel from "./AiChatPanel"; // ✅ 대화형 패널 (선택적 사용)

export default function AiCommandBar() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // ✅ 단일 응답 보기용
  const [openChat, setOpenChat] = useState(false); // ✅ 대화창 모드

  // 🔹 단일 명령 실행
  const handleRun = async e => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const { data } = await API.post("/ai/command", { prompt });
      setResult(data);
      toast.success("✅ AI 명령 완료");
      console.log("🤖 AI 응답:", data);
    } catch (err) {
      toast.error("❌ AI 명령 실패");
      console.error("AI 명령 실패:", err);
    } finally {
      setLoading(false);
      setPrompt("");
    }
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* 🔹 전역 AI 명령 입력창 */}
        <form
          onSubmit={handleRun}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "#f3f4f6",
            padding: "4px 8px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            width: 280,
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          <span style={{ fontSize: 18 }}>🤖</span>
          <input
            type="text"
            placeholder="AI에게 명령하기..."
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            disabled={loading}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 14,
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: 4,
              padding: "4px 8px",
              fontSize: 13,
              cursor: "pointer",
              transition: "background 0.2s ease",
            }}
            onMouseOver={e => (e.target.style.background = "#1d4ed8")}
            onMouseOut={e => (e.target.style.background = "#2563eb")}
          >
            {loading ? "..." : "실행"}
          </button>
        </form>

        {/* 🔹 AI 대화창 버튼 */}
        <button
          onClick={() => setOpenChat(true)}
          style={{
            background: "#10b981",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "6px 10px",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          💬 AI 대화창
        </button>
      </div>

      {/* ✅ 단일 명령 결과 표시 Modal */}
      <Modal open={!!result} title="🤖 AI 명령 결과" onClose={() => setResult(null)}>
        {result ? (
          <pre
            style={{
              whiteSpace: "pre-wrap",
              lineHeight: 1.5,
              fontFamily: "Pretendard, sans-serif",
              fontSize: 14,
              color: "#111",
            }}
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        ) : (
          "결과 없음"
        )}
      </Modal>

      {/* ✅ 대화형 AI 패널 (선택적으로 Modal 안에서 열기) */}
      <Modal open={openChat} title="🤖 AI Assistant (대화창)" onClose={() => setOpenChat(false)}>
        <AiChatPanel />
      </Modal>
    </>
  );
}
