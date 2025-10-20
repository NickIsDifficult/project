// src/components/projects/ViewHeaderSection.jsx
import { useProjectGlobal } from "../../context/ProjectGlobalContext";
import Button from "../common/Button";
import { STATUS_LABELS } from "./constants/statusMaps";

export default function ViewHeaderSection({
  stats = {},
  assigneeOptions = [],
  filterStatus = "ALL",
  filterAssignee = "ALL",
  searchKeyword = "",
  setSearchKeyword,
  setFilterAssignee,
  handleStatusFilter,
  resetFilters,
}) {
  const total = stats.total ?? 0;
  const done = stats.DONE ?? 0;
  const doneRatio = stats.doneRatio ?? (total ? Math.round((done / total) * 100) : 0);

  // ✅ 전역 전체 접기/펼치기
  const { isAllExpanded, setIsAllExpanded } = useProjectGlobal();

  const toggleExpandAll = () => setIsAllExpanded(prev => !prev);

  return (
    <>
      {/* 📊 통계 영역 */}
      <div style={summaryBox}>
        <div>📋 전체 {total}건</div>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div
            key={key}
            onClick={() => handleStatusFilter?.(key)}
            style={{
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: 6,
              background: filterStatus === key ? "#dbeafe" : "transparent",
              border: filterStatus === key ? "1px solid #60a5fa" : "1px solid transparent",
            }}
          >
            {label} {stats[key] ?? 0}
          </div>
        ))}
        <div style={{ marginLeft: "auto", fontWeight: 600 }}>✅ 완료율 {doneRatio}%</div>
        <div style={progressOuter}>
          <div style={{ ...progressInner, width: `${doneRatio}%` }} />
        </div>
      </div>

      {/* 🔍 필터 영역 */}
      <div style={filterBar}>
        <select
          value={filterAssignee}
          onChange={e => setFilterAssignee?.(e.target.value)}
          style={filterSelect}
        >
          {assigneeOptions.map(name => (
            <option key={name} value={name}>
              {name === "ALL" ? "전체 담당자" : name}
            </option>
          ))}
        </select>

        <input
          placeholder="업무 또는 프로젝트 검색..."
          value={searchKeyword}
          onChange={e => setSearchKeyword?.(e.target.value)}
          style={filterInput}
        />

        {/* ✅ 전체 접기/펼치기 */}
        <Button variant="outline" onClick={toggleExpandAll}>
          {isAllExpanded ? "🔽 전체 접기" : "🔼 전체 펼치기"}
        </Button>

        <Button variant="outline" onClick={resetFilters}>
          🔄 초기화
        </Button>
      </div>
    </>
  );
}

/* 🎨 스타일 동일 */
const summaryBox = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  background: "#f8f9fa",
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: "8px 12px",
  marginBottom: 10,
  fontSize: 14,
  flexWrap: "wrap",
};
const progressOuter = {
  flex: 1,
  height: 8,
  background: "#e0e0e0",
  borderRadius: 4,
  overflow: "hidden",
};
const progressInner = { height: "100%", background: "#4caf50", transition: "width 0.3s ease" };
const filterBar = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginBottom: 10,
  background: "#fafafa",
  border: "1px solid #e0e0e0",
  borderRadius: 8,
  padding: "8px 12px",
};
const filterSelect = {
  border: "1px solid #ccc",
  borderRadius: 6,
  padding: "6px 10px",
  fontSize: 13,
};
const filterInput = {
  border: "1px solid #ccc",
  borderRadius: 6,
  padding: "6px 10px",
  minWidth: 160,
  fontSize: 13,
};
