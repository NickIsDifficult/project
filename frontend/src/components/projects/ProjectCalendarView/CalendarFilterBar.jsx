// src/components/projects/ProjectCalendarView/CalendarFilterBar.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

export default function CalendarFilterBar({
  projects,
  activeProjectIds,
  setActiveProjectIds,
  colorMode,
  setColorMode,
  searchKeyword,
  setSearchKeyword,
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => p.project_name.toLowerCase().includes(search.toLowerCase()));
  }, [projects, search]);

  useEffect(() => {
    const handleClickOutside = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleProject = projectId => {
    setActiveProjectIds(prev =>
      prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId],
    );
  };

  const handleSelectAll = () => setActiveProjectIds(projects.map(p => p.project_id));
  const handleClearAll = () => setActiveProjectIds([]);
  const handleReset = () => setActiveProjectIds([]);

  /* 🎨 색상 모드 순환 */
  const toggleColorMode = () => {
    const modes = ["assignee", "status", "project", "priority"];
    const nextIndex = (modes.indexOf(colorMode) + 1) % modes.length;
    const nextMode = modes[nextIndex];
    setColorMode(nextMode);
    toast.success(`🎨 색상 기준: ${getColorModeLabel(nextMode)}로 변경되었습니다`);
  };

  const getColorModeLabel = (mode = colorMode) => {
    switch (mode) {
      case "assignee":
        return "담당자 기준";
      case "status":
        return "상태 기준";
      case "project":
        return "프로젝트 기준";
      case "priority":
        return "우선순위 기준";
      default:
        return "프로젝트 기준";
    }
  };

  const selectedCount = activeProjectIds.length;
  const totalCount = projects.length;

  return (
    <div style={barContainer}>
      <div style={inlineRow}>
        {/* 🔍 검색 */}
        <input
          type="text"
          placeholder="🔍 프로젝트 또는 업무 제목 검색..."
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
          onFocus={() => setOpen(false)}
          style={searchInput}
        />

        {/* 📁 프로젝트 선택 */}
        <div style={{ position: "relative" }} ref={dropdownRef}>
          <button onClick={() => setOpen(o => !o)} style={dropdownBtn}>
            📁 프로젝트 선택 ▼
          </button>

          {open && (
            <div style={dropdownMenu}>
              <div style={dropdownHeader}>
                <button onClick={handleSelectAll} style={miniBtn}>
                  ✅ 전체 선택
                </button>
                <button onClick={handleClearAll} style={miniBtn}>
                  ❌ 전체 해제
                </button>
              </div>
              <hr style={divider} />
              {filteredProjects.length === 0 ? (
                <div style={emptyText}>검색 결과 없음</div>
              ) : (
                filteredProjects.map(p => (
                  <label key={p.project_id} style={dropdownItem}>
                    <input
                      type="checkbox"
                      checked={activeProjectIds.includes(p.project_id)}
                      onChange={() => toggleProject(p.project_id)}
                      style={checkboxStyle}
                    />
                    <span style={projectName}>{p.project_name}</span>
                  </label>
                ))
              )}
              <hr style={divider} />
              <div style={countText}>
                선택됨: <b>{activeProjectIds.length}</b> / {projects.length}개
              </div>
            </div>
          )}
        </div>

        {/* 🎨 색상 모드 */}
        <button
          onClick={toggleColorMode}
          title="색상 기준 변경 (담당자 → 상태 → 프로젝트 → 우선순위 순)"
          style={actionBtn}
        >
          🎨 색상 기준: <b>{getColorModeLabel()}</b>
        </button>

        {/* 🔄 전체 보기 */}
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

const inlineRow = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const searchInput = {
  width: 220,
  padding: "6px 10px",
  fontSize: 13,
  border: "1px solid #ccc",
  borderRadius: 6,
};

const dropdownBtn = {
  border: "1px solid #ccc",
  borderRadius: 6,
  background: "#fff",
  padding: "6px 10px",
  fontSize: 13,
  cursor: "pointer",
};

const dropdownMenu = {
  position: "absolute",
  top: "110%",
  left: 0,
  background: "#fff",
  border: "1px solid #ccc",
  borderRadius: 6,
  padding: 8,
  boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
  zIndex: 1000,
  minWidth: 340,
  maxHeight: 340,
  overflowY: "auto",
};

const dropdownHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 4,
};

const miniBtn = {
  border: "1px solid #ccc",
  borderRadius: 6,
  background: "#fafafa",
  padding: "2px 6px",
  fontSize: 12,
  cursor: "pointer",
};

const dropdownItem = {
  display: "flex",
  alignItems: "center",
  padding: "4px 6px",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 13,
};

const checkboxStyle = { width: 18, height: 18, marginRight: 8 };
const projectName = { flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const divider = { margin: "6px 0", borderColor: "#eee" };
const emptyText = { fontSize: 13, color: "#777", padding: "4px 6px" };
const countText = { fontSize: 12, color: "#555", textAlign: "right", marginTop: 4 };
const actionBtn = {
  border: "1px solid #ccc",
  borderRadius: 6,
  background: "#fff",
  padding: "6px 10px",
  fontSize: 13,
  cursor: "pointer",
};
