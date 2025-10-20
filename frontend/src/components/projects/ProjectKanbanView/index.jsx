import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { Loader } from "../../common/Loader";
import ProjectColumn from "./ProjectColumn";
import { useKanbanData } from "./useKanbanData";

export default function ProjectKanbanView({ onProjectClick }) {
  const { columns, handleDragEnd } = useKanbanData();

  if (!columns?.length) return <Loader text="칸반 데이터를 불러오는 중..." />;

  return (
    <div style={boardWrapper}>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div style={boardContainer}>
          {columns.filter(Boolean).map(col => (
            <Droppable key={col.key} droppableId={col.key} direction="vertical">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={{
                    ...colStyle,
                    background: snapshot.isDraggingOver ? "#E3F2FD" : "#F8F9FA",
                    transition: "background 0.25s ease",
                  }}
                >
                  <ProjectColumn
                    label={col.label}
                    tasks={col.tasks}
                    onTaskClick={onProjectClick}
                    columnKey={col.key}
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

/* 🎨 스타일 정의 */
const boardWrapper = {
  width: "100%",
  overflowX: "auto",
  padding: "8px 0",
};

const boardContainer = {
  display: "flex",
  flexDirection: "row",
  gap: 12,
  minHeight: "calc(100vh - 180px)",
  padding: "0 8px",
};

const colStyle = {
  minWidth: 280,
  borderRadius: 8,
};
