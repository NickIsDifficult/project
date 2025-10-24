// src/components/projects/CalendarFilterBar.jsx
export default function CalendarFilterBar({
  projects,
  activeProjectIds,
  setActiveProjectIds,
  colorMode,
  setColorMode,
}) {
  const toggleProject = projectId => {
    setActiveProjectIds(prev =>
      prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId],
    );
  };

  const handleReset = () => setActiveProjectIds([]);

  const toggleColorMode = () => {
    const modes = ["assignee", "status", "project"];
    const nextIndex = (modes.indexOf(colorMode) + 1) % modes.length;
    setColorMode(modes[nextIndex]);
  };

  const getColorModeLabel = () => {
    if (colorMode === "assignee") return "담당자 기준";
    if (colorMode === "status") return "상태 기준";
    if (colorMode === "project") return "프로젝트 기준";
  };

  return (
    <div style={barContainer}>
      {/* 프로젝트 필터 영역 */}
      <div style={projectList}>
        <span style={labelStyle}>📁 프로젝트 필터:</span>
        {projects.length === 0 ? (
          <span style={{ fontSize: 13, color: "#888" }}>프로젝트 없음</span>
        ) : (
          projects.map(p => {
            const isActive = activeProjectIds.includes(p.project_id);
            return (
              <button
                key={p.project_id}
                onClick={() => toggleProject(p.project_id)}
                style={{
                  ...projectBtn,
                  background: isActive ? "#E3F2FD" : "#f9f9f9",
                  borderColor: isActive ? "#64B5F6" : "#ccc",
                  color: isActive ? "#1565C0" : "#444",
                }}
              >
                {p.project_name}
              </button>
            );
          })
        )}
      </div>

      {/* 기능 버튼들 */}
      <div style={buttonRow}>
        <button onClick={toggleColorMode} style={actionBtn}>
          🎨 색상 모드: {getColorModeLabel()}
        </button>

        {activeProjectIds.length > 0 && (
          <button onClick={handleReset} style={actionBtn}>
            🔄 전체 보기
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------------- 스타일 ---------------------- */
const barContainer = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  marginBottom: 8,
  borderBottom: "1px solid #eee",
  paddingBottom: 8,
};

const projectList = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 6,
};

const labelStyle = {
  fontSize: 13,
  color: "#444",
  marginRight: 4,
};

const projectBtn = {
  fontSize: 13,
  padding: "4px 8px",
  border: "1px solid #ccc",
  borderRadius: 6,
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const buttonRow = {
  display: "flex",
  gap: 8,
  marginTop: 4,
};

const actionBtn = {
  border: "1px solid #ccc",
  borderRadius: 6,
  background: "#fff",
  padding: "4px 10px",
  fontSize: 13,
  cursor: "pointer",
  transition: "background 0.2s",
};
