// src/pages/projects/ProjectDetailPage/ViewSwitcherSection.jsx
import Button from "../../../components/common/Button";

export default function ViewSwitcherSection({ viewType, setViewType, onAddTask }) {
  const buttons = [
    { key: "list", label: "📋 리스트 뷰" },
    { key: "kanban", label: "🧩 칸반 뷰" },
    { key: "calendar", label: "🗓️ 캘린더 뷰" },
  ];

  return (
    <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
      {buttons.map(b => (
        <Button
          key={b.key}
          variant={viewType === b.key ? "primary" : "outline"}
          onClick={() => setViewType(b.key)}
        >
          {b.label}
        </Button>
      ))}
      <Button variant="success" style={{ marginLeft: "auto" }} onClick={onAddTask}>
        ➕ 새 업무
      </Button>
    </div>
  );
}
