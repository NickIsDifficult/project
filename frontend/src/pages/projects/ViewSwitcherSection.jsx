// src/pages/projects/ViewSwitcherSection.jsx
import Button from "../../components/common/Button";
import { useProjectGlobal } from "../../context/ProjectGlobalContext";

export default function ViewSwitcherSection() {
  const { viewType, setViewType, setUiState } = useProjectGlobal();

  const buttons = [
    { key: "list", label: "📋 리스트 뷰" },
    { key: "kanban", label: "🧩 칸반 뷰" },
    { key: "calendar", label: "🗓️ 캘린더 뷰" },
  ];

  const handleAddProject = () => {
    setUiState(prev => ({
      ...prev,
      drawer: { ...prev.drawer, project: true },
    }));
  };

  return (
    <div style={container}>
      {buttons.map(b => (
        <Button
          key={b.key}
          variant={viewType === b.key ? "primary" : "outline"}
          onClick={() => setViewType(b.key)}
        >
          {b.label}
        </Button>
      ))}
      <Button variant="success" style={{ marginLeft: "auto" }} onClick={handleAddProject}>
        ➕ 새 프로젝트
      </Button>
    </div>
  );
}

const container = {
  display: "flex",
  gap: "8px",
  marginBottom: "16px",
};
