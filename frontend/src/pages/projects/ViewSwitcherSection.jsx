// src/pages/projects/ViewSwitcherSection.jsx
import Button from "../../components/common/Button";
import { useProjectGlobal } from "../../context/ProjectGlobalContext";

export default function ViewSwitcherSection() {
  const { viewType, setViewType, setOpenDrawer } = useProjectGlobal();

  const buttons = [
    { key: "list", label: "📋 리스트 뷰" },
    { key: "kanban", label: "🧩 칸반 뷰" },
    { key: "calendar", label: "🗓️ 캘린더 뷰" },
  ];

  // ✅ 새 프로젝트 등록 버튼 클릭 핸들러
  const handleAddProject = () => {
    setOpenDrawer(true);
  };

  return (
    <div style={container}>
      {/* 뷰 전환 버튼 */}
      {buttons.map(b => (
        <Button
          key={b.key}
          variant={viewType === b.key ? "primary" : "outline"}
          onClick={() => setViewType(b.key)}
        >
          {b.label}
        </Button>
      ))}

      {/* ✅ 새 프로젝트 등록 버튼 */}
      <Button variant="success" style={{ marginLeft: "auto" }} onClick={handleAddProject}>
        ➕ 새 프로젝트
      </Button>
    </div>
  );
}

/* --------------------- */
/* ✅ 스타일 정의 (inline) */
/* --------------------- */
const container = {
  display: "flex",
  gap: "8px",
  marginBottom: "16px",
};
