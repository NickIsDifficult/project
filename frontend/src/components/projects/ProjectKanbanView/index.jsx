import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { useEffect, useMemo, useState } from "react";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import { Loader } from "../../common/Loader";
import ViewHeaderSection from "../ViewHeaderSection";
import ProjectCard from "./ProjectCard";
import TaskCard from "./TaskCard";
import { useKanbanData } from "./useKanbanData";

export default function ProjectKanbanView({ onProjectClick, onTaskClick }) {
  const { columns, stats, assigneeOptions, handleDragEnd, projectColorMap } = useKanbanData();
  const { isAllExpanded, setIsAllExpanded } = useProjectGlobal();

  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterAssignee, setFilterAssignee] = useState("ALL");
  const [searchKeyword, setSearchKeyword] = useState("");

  // 🔍 검색 시 자동 전체 펼치기
  useEffect(() => {
    if (searchKeyword.trim()) setIsAllExpanded(true);
    else setIsAllExpanded(false);
  }, [searchKeyword, setIsAllExpanded]);

  if (!columns?.length) return <Loader text="칸반 데이터를 불러오는 중..." />;

  /* ✅ 필터 및 검색 */
  const filteredColumns = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return columns.map(col => ({
      ...col,
      items: col.items
        .filter(project => {
          // 프로젝트 이름 또는 하위 업무 중 검색 키워드가 포함된 경우만 표시
          if (
            keyword &&
            !project.project_name?.toLowerCase().includes(keyword) &&
            !project.tasks?.some(t => t.title?.toLowerCase().includes(keyword))
          )
            return false;
          return true;
        })
        .map(project => ({
          ...project,
          // 🔹 현재 컬럼에 속한 업무만 남김
          tasks: project.tasks?.filter(t => {
            const taskStatus = (t.status || "PLANNED").toUpperCase();
            if (filterStatus !== "ALL" && taskStatus !== filterStatus) return false;
            if (filterAssignee !== "ALL" && !t.assignees?.some(a => a.name === filterAssignee))
              return false;
            if (keyword && !t.title?.toLowerCase().includes(keyword)) return false;
            // ✅ 컬럼 상태 일치 시 표시
            return taskStatus === col.key;
          }),
        })),
    }));
  }, [columns, filterStatus, filterAssignee, searchKeyword]);

  const resetFilters = () => {
    setFilterStatus("ALL");
    setFilterAssignee("ALL");
    setSearchKeyword("");
  };

  return (
    <>
      <ViewHeaderSection
        stats={stats}
        assigneeOptions={assigneeOptions}
        filterStatus={filterStatus}
        filterAssignee={filterAssignee}
        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}
        setFilterAssignee={setFilterAssignee}
        handleStatusFilter={setFilterStatus}
        resetFilters={resetFilters}
      />

      <div style={styles.wrapper}>
        <DragDropContext onDragEnd={handleDragEnd}>
          <div style={styles.board}>
            {filteredColumns.map(col => (
              <Droppable key={col.key} droppableId={col.key} direction="vertical">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      ...styles.column,
                      background: snapshot.isDraggingOver ? "#E3F2FD" : "#F8F9FA",
                      border: snapshot.isDraggingOver ? "2px dashed #42A5F5" : "1px solid #e0e0e0",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {/* 🏷 컬럼 헤더 */}
                    <div style={styles.colHeader}>
                      <span>
                        {col.label}
                        <span style={styles.badge}>{col.items.length}</span>
                      </span>
                    </div>

                    {/* 📦 카드 목록 */}
                    <div style={styles.scrollArea}>
                      {col.items.length === 0 ? (
                        <p style={styles.empty}>프로젝트 없음</p>
                      ) : (
                        col.items.map((project, pIdx) => {
                          const taskIndexBase = pIdx * 1000;
                          const projectTasks = project.tasks || [];
                          return (
                            <div key={project.project_id} style={styles.projectBlock}>
                              <ProjectCard
                                project={project}
                                index={pIdx}
                                color={projectColorMap[project.project_id]}
                                onClick={onProjectClick}
                              />

                              {/* ✅ 업무 카드: 전체 펼침 시만 보이게 */}
                              {isAllExpanded &&
                                projectTasks.map((task, tIdx) => (
                                  <TaskCard
                                    key={task.task_id}
                                    task={task}
                                    index={taskIndexBase + tIdx}
                                    onClick={onTaskClick}
                                    projectColor={projectColorMap[project.project_id]}
                                  />
                                ))}
                            </div>
                          );
                        })
                      )}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </div>
    </>
  );
}

/* 🎨 스타일 */
const styles = {
  wrapper: { width: "100%", overflowX: "auto", padding: "8px 0" },
  board: {
    display: "flex",
    gap: 12,
    minHeight: "calc(100vh - 180px)",
    padding: "0 8px",
  },
  column: {
    minWidth: 300,
    borderRadius: 10,
    display: "flex",
    flexDirection: "column",
    background: "#f8f9fa",
  },
  colHeader: {
    position: "sticky",
    top: 0,
    zIndex: 5,
    background: "#fff",
    fontWeight: 600,
    fontSize: 15,
    padding: "10px 8px 6px",
    borderBottom: "1px solid #ddd",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    background: "#dee2e6",
    borderRadius: 12,
    fontSize: 12,
    padding: "2px 8px",
    color: "#333",
    marginLeft: 6,
  },
  scrollArea: {
    flex: 1,
    overflowY: "auto",
    padding: "8px 4px",
  },
  projectBlock: {
    marginBottom: 10,
  },
  empty: {
    textAlign: "center",
    color: "#aaa",
    marginTop: 12,
    fontSize: 13,
  },
};
