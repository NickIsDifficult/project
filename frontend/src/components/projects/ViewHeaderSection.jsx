// src/components/projects/ViewHeaderSection.jsx
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Filter,
  RefreshCw,
  Search as SearchIcon,
} from "lucide-react";
import { useMemo } from "react";
import { useProjectGlobal } from "../../context/ProjectGlobalContext";
import Button from "../common/Button";
import { STATUS_LABELS } from "./constants/statusMaps";

export default function ViewHeaderSection({
  viewType = "list",
  assigneeOptions = [],
  setSearchKeyword = () => {},
  setFilterAssignee = () => {},
  handleStatusFilter = () => {},
  resetFilters = () => {},
  onToggleExpandAll = () => {},
}) {
  const { uiState, setUiState, tasksByProject } = useProjectGlobal();
  const { keyword, status, assignee } = uiState.filter;
  const isExpanded = uiState.expand?.[viewType] ?? true;

  // 🔹 접기/펼치기 or 업무 표시 토글
  const toggleExpandAll = () => {
    const newExpand = !isExpanded;
    setUiState(prev => ({
      ...prev,
      expand: { ...prev.expand, [viewType]: newExpand },
    }));
    onToggleExpandAll?.(newExpand);
  };

  // 🔹 완료율 계산
  const completionRate = useMemo(() => {
    let total = 0,
      done = 0;
    Object.values(tasksByProject).forEach(list =>
      list.forEach(t => {
        total++;
        if (t.status === "DONE") done++;
      }),
    );
    return total ? Math.round((done / total) * 100) : 0;
  }, [tasksByProject]);

  const gradient =
    completionRate < 50
      ? "linear-gradient(90deg,#f97316,#facc15)"
      : "linear-gradient(90deg,#22c55e,#3b82f6)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* 상태 필터 + 완료율 */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          padding: "12px 18px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        {/* 상태 필터 */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <Filter size={16} color="#2563eb" />
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <div
              key={key}
              onClick={() => {
                const newStatus = status === key ? "ALL" : key;
                handleStatusFilter(newStatus);
              }}
              style={{
                cursor: "pointer",
                padding: "6px 12px",
                borderRadius: "20px",
                border: status === key ? "1px solid #2563eb" : "1px solid #e5e7eb",
                background: status === key ? "#eff6ff" : "#fff",
                color: status === key ? "#1d4ed8" : "#374151",
                fontSize: "13px",
                fontWeight: 500,
                transition: "all 0.2s ease",
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* 완료율 */}
        <div style={{ textAlign: "right", minWidth: "180px" }}>
          <div style={{ fontSize: "13px", color: "#2563eb", fontWeight: 600 }}>
            완료율: {completionRate}%
          </div>
          <div
            style={{
              marginTop: "4px",
              height: "6px",
              background: "#e5e7eb",
              borderRadius: "9999px",
            }}
          >
            <div
              style={{
                width: `${completionRate}%`,
                height: "100%",
                background: gradient,
                borderRadius: "9999px",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* 🔹 검색 + 담당자 + 버튼 라인 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          padding: "10px 18px",
        }}
      >
        {/* 왼쪽: 담당자 + 검색창 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flex: 1,
            minWidth: "300px",
          }}
        >
          {/* 담당자 선택 */}
          <select
            value={assignee}
            onChange={e => setFilterAssignee(e.target.value)}
            style={{
              width: "150px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              padding: "6px 8px",
              fontSize: "13px",
              background: "#fff",
            }}
          >
            {assigneeOptions.map(name => (
              <option key={name} value={name}>
                {name === "ALL" ? "전체 담당자" : name}
              </option>
            ))}
          </select>

          {/* 검색창 */}
          <div style={{ position: "relative", flex: 1, minWidth: "220px", maxWidth: "400px" }}>
            <SearchIcon
              size={16}
              color="#9ca3af"
              style={{ position: "absolute", left: "8px", top: "8px" }}
            />
            <input
              type="text"
              placeholder="업무 또는 프로젝트 검색..."
              value={keyword}
              onChange={e => setSearchKeyword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && setSearchKeyword(e.target.value.trim())}
              style={{
                width: "100%",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                padding: "6px 8px 6px 28px",
                fontSize: "13px",
              }}
              onFocus={e => (e.target.style.border = "1px solid #2563eb")}
              onBlur={e => (e.target.style.border = "1px solid #d1d5db")}
            />
          </div>
        </div>

        {/* 오른쪽: 버튼 그룹 */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          {/* ✅ 뷰 타입별 다른 버튼 */}
          {viewType === "list" ? (
            <Button
              variant="outline"
              onClick={toggleExpandAll}
              style={{ fontSize: "13px", padding: "5px 10px" }}
            >
              {isExpanded ? (
                <>
                  <ChevronUp size={14} /> 전체 접기
                </>
              ) : (
                <>
                  <ChevronDown size={14} /> 전체 펼치기
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={toggleExpandAll}
              style={{ fontSize: "13px", padding: "5px 10px" }}
            >
              {isExpanded ? (
                <>
                  <EyeOff size={14} /> 업무 표시 비활성
                </>
              ) : (
                <>
                  <Eye size={14} /> 업무 표시 활성
                </>
              )}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={resetFilters}
            style={{ fontSize: "13px", padding: "5px 10px" }}
          >
            <RefreshCw size={14} /> 초기화
          </Button>
        </div>
      </div>
    </div>
  );
}
