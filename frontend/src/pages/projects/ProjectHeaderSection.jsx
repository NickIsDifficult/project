import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";

export default function ProjectHeaderSection() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
      }}
    >
      <h1 style={{ fontSize: 26, fontWeight: "bold", margin: 0 }}>📊 프로젝트 대시보드</h1>

      <Button variant="secondary" onClick={() => navigate("/main")}>
        ← 메인 화면으로
      </Button>
    </div>
  );
}
