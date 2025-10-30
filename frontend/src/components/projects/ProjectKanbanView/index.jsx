// src/components/projects/ProjectKanbanView/index.jsx
import { DragDropContext } from "@hello-pangea/dnd";
import { useEffect, useMemo } from "react";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import { Loader } from "../../common/Loader";
import ViewHeaderSection from "../ViewHeaderSection";
import KanbanColumn from "./KanbanColumn";
import { useKanbanDnD } from "./hooks/useKanbanDnD";
import { useKanbanState } from "./hooks/useKanbanState";
import { useKanbanStats } from "./hooks/useKanbanStats";

export default function ProjectKanbanView({ onProjectClick, onTaskClick }) {
  const { uiState, setUiState } = useProjectGlobal();
  const { filter, expand } = uiState;
  const { keyword, status, assignee } = filter;

  // 1) 상태/데이터 조합
  const { columns, assigneeOptions, projectColorMap, filterProjectsAndTasks } = useKanbanState();

  // 2) 통계
  const stats = useKanbanStats(columns);

  // 3) 드래그 핸들러
  const handleDragEnd = useKanbanDnD();

  // ✅ 카드 클릭 시 상세 패널 오픈
  const handleCardClick = item => {
    if (!item) return;

    if (item.type === "project") {
      // 📁 프로젝트 카드 클릭 → 프로젝트 상세 패널 열기
      setUiState(prev => ({
        ...prev,
        drawer: { ...prev.drawer, project: false, task: false },
        panel: { selectedTask: { ...item, isProject: true } },
      }));
    } else if (item.type === "task") {
      // 📋 업무 카드 클릭 → 업무 상세 패널 열기
      setUiState(prev => ({
        ...prev,
        drawer: { ...prev.drawer, task: true, project: false },
        panel: { ...prev.panel, selectedTask: item },
      }));
    }
  };

  // 🔍 검색 시 자동 전체 펼치기
  useEffect(() => {
    if (keyword.trim()) {
      setUiState(prev => ({ ...prev, expand: { ...prev.expand, kanban: true } }));
    }
  }, [keyword, setUiState]);

  if (!columns?.length) return <Loader text="칸반 데이터를 불러오는 중..." />;

  // ✅ 필터 + 검색 (공용 함수로 통일)
  const filteredColumns = useMemo(
    () => filterProjectsAndTasks(columns, { keyword, status, assignee }),
    [columns, keyword, status, assignee, filterProjectsAndTasks],
  );

  // ✅ 필터 초기화
  const resetFilters = () =>
    setUiState(prev => ({
      ...prev,
      filter: { keyword: "", status: "ALL", assignee: "ALL" },
    }));

  const isExpanded = expand.kanban;

  return (
    <div style={{ width: "100%" }}>
      {/* 상단 필터 / 검색 / 통계 */}
      <ViewHeaderSection
        viewType="kanban"
        stats={stats}
        assigneeOptions={assigneeOptions}
        filterStatus={status}
        filterAssignee={assignee}
        searchKeyword={keyword}
        setSearchKeyword={kw =>
          setUiState(prev => ({ ...prev, filter: { ...prev.filter, keyword: kw } }))
        }
        setFilterAssignee={val =>
          setUiState(prev => ({ ...prev, filter: { ...prev.filter, assignee: val } }))
        }
        handleStatusFilter={val =>
          setUiState(prev => ({ ...prev, filter: { ...prev.filter, status: val } }))
        }
        resetFilters={resetFilters}
      />

      {/* 가로형 칸반 보드 */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div
          style={{
            display: "flex",
            gap: 16,
            overflowX: "auto",
            padding: "10px 16px",
            minHeight: "calc(100vh - 220px)",
            background: "#f9fafb",
          }}
        >
          {filteredColumns.map(col => (
            <KanbanColumn
              key={col.key}
              column={col}
              projectColorMap={projectColorMap}
              isExpanded={isExpanded}
              onProjectClick={item => handleCardClick({ ...item, type: "project" })}
              onTaskClick={item => handleCardClick({ ...item, type: "task" })}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
