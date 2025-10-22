import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { useEffect, useMemo } from "react";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import { Loader } from "../../common/Loader";
import ViewHeaderSection from "../ViewHeaderSection";
import ProjectCard from "./ProjectCard";
import TaskCard from "./TaskCard";
import { useKanbanData } from "./useKanbanData";

export default function ProjectKanbanView({ onProjectClick, onTaskClick }) {
  const { uiState, setUiState } = useProjectGlobal();
  const { columns, stats, assigneeOptions, handleDragEnd, projectColorMap } = useKanbanData();

  const { filter, expand } = uiState;
  const { keyword, status, assignee } = filter;

  // 🔍 검색 시 자동 전체 펼치기
  useEffect(() => {
    if (keyword.trim()) {
      setUiState(prev => ({
        ...prev,
        expand: { ...prev.expand, kanban: true },
      }));
    }
  }, [keyword, setUiState]);

  if (!columns?.length) return <Loader text="칸반 데이터를 불러오는 중..." />;

  // ✅ 필터 + 검색
  const filteredColumns = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return columns.map(col => ({
      ...col,
      items: col.items
        .filter(project => {
          if (
            kw &&
            !project.project_name?.toLowerCase().includes(kw) &&
            !project.tasks?.some(t => t.title?.toLowerCase().includes(kw))
          )
            return false;
          return true;
        })
        .map(project => ({
          ...project,
          tasks: project.tasks?.filter(t => {
            const tStatus = (t.status || "PLANNED").toUpperCase();
            if (status !== "ALL" && tStatus !== status) return false;
            if (assignee !== "ALL" && !t.assignees?.some(a => a.name === assignee)) return false;
            if (kw && !t.title?.toLowerCase().includes(kw)) return false;
            return tStatus === col.key;
          }),
        })),
    }));
  }, [columns, status, assignee, keyword]);

  // ✅ 필터 초기화
  const resetFilters = () =>
    setUiState(prev => ({
      ...prev,
      filter: { keyword: "", status: "ALL", assignee: "ALL" },
    }));

  const isExpanded = expand.kanban; // ✅ 현재 칸반 확장 여부

  return (
    <div style={{ width: "100%" }}>
      {/* 🔹 상단 필터 / 검색 / 전체 접기/펼치기 */}
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

      {/* 🎯 가로형 칸반 보드 */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="kanban-board" direction="horizontal" type="column">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{
                display: "flex",
                gap: "16px",
                overflowX: "auto",
                padding: "10px 16px",
                minHeight: "calc(100vh - 200px)",
                background: snapshot.isDraggingOver ? "#e3f2fd" : "#f9fafb",
                transition: "background 0.2s ease",
              }}
            >
              {filteredColumns.map(col => (
                <Droppable key={col.key} droppableId={col.key} direction="vertical" type="task">
                  {(innerProvided, innerSnapshot) => (
                    <div
                      ref={innerProvided.innerRef}
                      {...innerProvided.droppableProps}
                      style={{
                        minWidth: 320,
                        display: "flex",
                        flexDirection: "column",
                        borderRadius: 12,
                        border: `1px solid ${innerSnapshot.isDraggingOver ? "#60a5fa" : "#e5e7eb"}`,
                        background: innerSnapshot.isDraggingOver ? "#f0f9ff" : "#ffffff",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {/* 컬럼 헤더 */}
                      <div
                        style={{
                          position: "sticky",
                          top: 0,
                          background: "#ffffff",
                          borderBottom: "1px solid #e5e7eb",
                          fontWeight: 600,
                          fontSize: 15,
                          padding: "8px 10px",
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>{col.label}</span>
                        <span
                          style={{
                            fontSize: 13,
                            background: "#f3f4f6",
                            borderRadius: 12,
                            padding: "2px 8px",
                            color: "#4b5563",
                          }}
                        >
                          {col.items.length}
                        </span>
                      </div>

                      {/* 카드 리스트 */}
                      <div
                        style={{
                          flex: 1,
                          overflowY: "auto",
                          padding: "8px 10px",
                          borderRadius: "0 0 12px 12px",
                        }}
                      >
                        {col.items.length === 0 ? (
                          <p
                            style={{
                              textAlign: "center",
                              color: "#9ca3af",
                              fontSize: 13,
                              marginTop: 10,
                            }}
                          >
                            프로젝트 없음
                          </p>
                        ) : (
                          col.items.map((project, pIdx) => {
                            const projectTasks = project.tasks || [];
                            const baseIndex = pIdx * 1000;

                            return (
                              <div
                                key={project.project_id}
                                style={{
                                  marginBottom: 12,
                                  background: "#f9fafb",
                                  borderRadius: 10,
                                  padding: 6,
                                }}
                              >
                                {/* 🧱 프로젝트 카드 */}
                                <ProjectCard
                                  project={project}
                                  index={pIdx}
                                  color={projectColorMap[project.project_id]}
                                  onClick={onProjectClick}
                                />

                                {/* 🧩 하위 업무: 전체 펼치기 시 표시 */}
                                {isExpanded &&
                                  (projectTasks.length > 0 ? (
                                    projectTasks.map((task, tIdx) => (
                                      <TaskCard
                                        key={task.task_id}
                                        task={task}
                                        index={baseIndex + tIdx}
                                        onClick={onTaskClick}
                                        projectColor={projectColorMap[project.project_id]}
                                      />
                                    ))
                                  ) : (
                                    <p
                                      style={{
                                        fontSize: 12,
                                        color: "#9ca3af",
                                        fontStyle: "italic",
                                        marginLeft: 12,
                                        marginTop: 4,
                                      }}
                                    >
                                      하위 업무 없음
                                    </p>
                                  ))}
                              </div>
                            );
                          })
                        )}
                        {innerProvided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
