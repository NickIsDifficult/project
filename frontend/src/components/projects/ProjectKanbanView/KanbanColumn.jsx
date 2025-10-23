// src/components/projects/ProjectKanbanView/KanbanColumn.jsx
import { Droppable } from "@hello-pangea/dnd";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import ProjectCard from "./ProjectCard";
import TaskCard from "./TaskCard";

export default function KanbanColumn({ column, projectColorMap, onProjectClick, onTaskClick }) {
  const { uiState } = useProjectGlobal();
  const showTasks = uiState.expand?.kanban ?? true; // 기본 true

  return (
    <Droppable droppableId={column.key} direction="vertical" type="task">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          style={{
            minWidth: 320,
            display: "flex",
            flexDirection: "column",
            borderRadius: 12,
            border: `1px solid ${snapshot.isDraggingOver ? "#60a5fa" : "#e5e7eb"}`,
            background: snapshot.isDraggingOver ? "#f0f9ff" : "#ffffff",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            transition: "all 0.2s ease",
          }}
        >
          {/* 컬럼 헤더 */}
          <div
            style={{
              position: "sticky",
              top: 0,
              background: "#fff",
              borderBottom: "1px solid #e5e7eb",
              fontWeight: 600,
              fontSize: 15,
              padding: "8px 10px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>{column.label}</span>
            <span
              style={{
                fontSize: 13,
                background: "#f3f4f6",
                borderRadius: 12,
                padding: "2px 8px",
                color: "#4b5563",
              }}
            >
              {column.items.length}
            </span>
          </div>

          {/* 카드 리스트 */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
            {column.items.length === 0 && (
              <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, marginTop: 10 }}>
                항목 없음
              </p>
            )}

            {column.items.map((item, idx) => {
              // ✅ 업무 숨김 상태일 때는 TaskCard를 렌더하지 않음
              if (item.type === "task" && !showTasks) return null;

              // ✅ 프로젝트 카드
              if (item.type === "project") {
                return (
                  <div
                    key={`proj-${item.project_id}`}
                    style={{
                      marginBottom: 12,
                      background: "#f9fafb",
                      borderRadius: 10,
                      padding: 6,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                    }}
                  >
                    <ProjectCard
                      project={item}
                      index={idx}
                      color={projectColorMap[item.project_id]}
                      onClick={onProjectClick}
                    />

                    {/* ✅ 업무 숨김 중 표시줄 */}
                    {!showTasks && (
                      <div
                        style={{
                          fontSize: 12,
                          color: "#9ca3af",
                          fontStyle: "italic",
                          textAlign: "center",
                          marginTop: 4,
                        }}
                      >
                        업무 숨김 중
                      </div>
                    )}
                  </div>
                );
              }

              // ✅ 업무 카드 (Task)
              return (
                <TaskCard
                  key={`task-${item.task_id}`}
                  task={item}
                  index={idx}
                  onClick={onTaskClick}
                  projectColor={projectColorMap[item.project_id]}
                />
              );
            })}
            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );
}
