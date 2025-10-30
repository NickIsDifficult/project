import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import { fetchProjectSummary } from "../../services/api/ai";

export default function ProjectHeaderSection() {
  const navigate = useNavigate();
  const [aiSummary, setAiSummary] = useState("");
  const [openModal, setOpenModal] = useState(false);

  const handleAISummary = async () => {
    toast.loading("AI가 프로젝트 현황을 분석 중입니다...");
    try {
      const summary = await fetchProjectSummary();
      toast.dismiss();
      setAiSummary(summary);
      setOpenModal(true);
    } catch (err) {
      toast.dismiss();
      toast.error("AI 요약 실패 😢");
    }
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h1 style={{ fontSize: 26, fontWeight: "bold", margin: 0 }}>📊 프로젝트 대시보드</h1>

        <div style={{ display: "flex", gap: "10px" }}>
          <Button variant="primary" onClick={handleAISummary}>
            🤖 AI 요약 보기
          </Button>
          <Button variant="secondary" onClick={() => navigate("/main")}>
            ← 메인 화면으로
          </Button>
        </div>
      </div>

      <Modal open={openModal} title="🤖 AI 프로젝트 요약" onClose={() => setOpenModal(false)}>
        {aiSummary ? (
          <div style={{ whiteSpace: "pre-wrap" }}>{aiSummary}</div>
        ) : (
          <p>요약 데이터를 불러오는 중입니다...</p>
        )}
      </Modal>
    </>
  );
}
