// src/components/tasks/TaskKanbanView/index.jsx
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { Loader } from "../../common/Loader";
import TaskColumn from "./TaskColumn";
import { useKanbanData } from "./useKanbanData";

export default function TaskKanbanView({ onTaskClick }) {
  const { columns, loading, handleDragEnd } = useKanbanData();

  if (loading) return <Loader text="칸반 보드를 불러오는 중..." />;

  return (
    <div style={boardWrapper}>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div style={boardContainer}>
          {columns.map(col => (
            <Droppable key={col.key} droppableId={col.key} direction="vertical">
              {provided => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  <TaskColumn
                    status={col.key}
                    label={col.label}
                    tasks={col.tasks}
                    onTaskClick={onTaskClick}
                  />
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}

/* ---------------------------
 * ✅ 스타일 정의
 * --------------------------- */
const boardWrapper = {
  width: "100%",
  overflowX: "auto", // ✅ 최상위만 스크롤 허용
  padding: "8px 0",
};

const boardContainer = {
  display: "flex",
  flexDirection: "row",
  gap: 12,
  minHeight: "calc(100vh - 180px)",
  padding: "0 8px",
};
