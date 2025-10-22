import { ChevronDown, ChevronUp, Filter, RefreshCw, Search as SearchIcon } from "lucide-react";
import { useProjectGlobal } from "../../context/ProjectGlobalContext";
import Button from "../common/Button";
import { STATUS_LABELS } from "./constants/statusMaps";

export default function ViewHeaderSection({
  viewType = "list",
  assigneeOptions = [],
  setSearchKeyword,
  setFilterAssignee,
  handleStatusFilter,
  resetFilters,
  onToggleExpandAll, // ✅ 새로 추가
}) {
  const { uiState, setUiState, tasksByProject } = useProjectGlobal();
  const { keyword, status, assignee } = uiState.filter;
  const isAllExpanded = uiState.expand?.[viewType] ?? true;

  // ✅ 전체 접기/펼치기 버튼 동기화
  const toggleExpandAll = () => {
    const newExpand = !isAllExpanded;
    setUiState(prev => ({
      ...prev,
      expand: { ...prev.expand, [viewType]: newExpand },
    }));
    onToggleExpandAll?.(newExpand); // ✅ collapsedTasks 업데이트
  };

  /** 완료율 계산 (시각용) */
  const calculateCompletionRate = () => {
    let total = 0;
    let done = 0;
    Object.values(tasksByProject).forEach(taskList => {
      taskList.forEach(task => {
        total++;
        if (task.status === "DONE") done++;
      });
    });
    return total ? Math.round((done / total) * 100) : 0;
  };

  const completionRate = calculateCompletionRate();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* 상태 필터 + 완료율 */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "12px 16px",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
          <Filter size={16} color="#3b82f6" />
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <div
              key={key}
              onClick={() => handleStatusFilter?.(key)}
              style={{
                cursor: "pointer",
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid",
                borderColor: status === key ? "#60a5fa" : "#e5e7eb",
                color: status === key ? "#1d4ed8" : "#374151",
                background: status === key ? "#eff6ff" : "#fff",
                fontWeight: 500,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        <div style={{ minWidth: "160px", textAlign: "right" }}>
          <div style={{ fontWeight: 600, color: "#2563eb" }}>완료율: {completionRate}%</div>
          <div style={{ height: "6px", background: "#e5e7eb", borderRadius: "9999px" }}>
            <div
              style={{
                width: `${completionRate}%`,
                height: "100%",
                background: "linear-gradient(90deg,#3b82f6,#60a5fa)",
              }}
            />
          </div>
        </div>
      </div>

      {/* 검색 및 필터바 */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "12px",
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "12px 16px",
        }}
      >
        <select
          value={assignee}
          onChange={e => setFilterAssignee?.(e.target.value)}
          style={{
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            padding: "6px 8px",
            fontSize: "14px",
          }}
        >
          {assigneeOptions.map(name => (
            <option key={name} value={name}>
              {name === "ALL" ? "전체 담당자" : name}
            </option>
          ))}
        </select>

        <div style={{ position: "relative", flex: 1, minWidth: "240px", maxWidth: "360px" }}>
          <SearchIcon
            size={16}
            color="#9ca3af"
            style={{ position: "absolute", left: "8px", top: "8px" }}
          />
          <input
            type="text"
            placeholder="업무 또는 프로젝트 검색..."
            value={keyword}
            onChange={e => setSearchKeyword?.(e.target.value)}
            style={{
              width: "100%",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              padding: "6px 8px 6px 28px",
              fontSize: "14px",
            }}
          />
        </div>

        {/* 전체 접기/펼치기 */}
        <Button variant="outline" onClick={toggleExpandAll}>
          {isAllExpanded ? (
            <>
              <ChevronUp size={16} /> 전체 접기
            </>
          ) : (
            <>
              <ChevronDown size={16} /> 전체 펼치기
            </>
          )}
        </Button>

        {/* 초기화 */}
        <Button variant="outline" onClick={resetFilters}>
          <RefreshCw size={16} /> 초기화
        </Button>
      </div>
    </div>
  );
}
