import React, { useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import toast from "react-hot-toast";
import { updateTaskStatus } from "../../services/api/task";

const STATUS_COLUMNS = [
  { key: "TODO", label: "할 일 📝" },
  { key: "IN_PROGRESS", label: "진행 중 🚧" },
  { key: "REVIEW", label: "검토 중 🔍" },
  { key: "DONE", label: "완료 ✅" },
];

export default function KanbanView({ projectId, tasks = [], onTaskMove, onTaskClick }) {
  // ---------------------------
  // 트리 평탄화 후 상태별 그룹화
  // ---------------------------
  const grouped = useMemo(() => {
    const map = {};
    STATUS_COLUMNS.forEach((col) => (map[col.key] = []));

    const topLevelTasks = tasks.filter((t) => !t.parent_task_id);

    topLevelTasks.forEach((t) => {
      const key = t.status || "TODO";
      map[key].push(t);
    });

    return map;
  }, [tasks]);

  // ---------------------------
  // 드래그 완료 시
  // ---------------------------
  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const sourceStatus = source.droppableId;
    const destStatus = destination.droppableId;
    if (sourceStatus === destStatus) return;

    try {
      await updateTaskStatus(projectId, draggableId, destStatus);
      toast.success(`업무가 '${destStatus}'로 이동되었습니다.`);
      onTaskMove?.();
    } catch (err) {
      console.error("상태 변경 실패:", err);
      toast.error("상태 변경 실패");
    }
  };

  return (
    <div style={{ padding: "8px 16px" }}>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div
          style={{
            display: "flex",
            gap: "16px",
            alignItems: "flex-start",
            overflowX: "auto",
            paddingBottom: 16,
          }}
        >
          {STATUS_COLUMNS.map((col) => (
            <Droppable droppableId={col.key} key={col.key}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  style={{
                    flex: "1 0 250px",
                    minWidth: 250,
                    background: "#f8f9fa",
                    borderRadius: 8,
                    padding: 12,
                    boxShadow: "inset 0 0 3px rgba(0,0,0,0.05)",
                  }}
                >
                  <h3 style={{ fontSize: 16, marginBottom: 8, color: "#333", fontWeight: 600 }}>
                    {col.label} ({grouped[col.key].length})
                  </h3>

                  {grouped[col.key].length === 0 && (
                    <div
                      style={{
                        color: "#aaa",
                        fontSize: 13,
                        padding: "10px 0",
                        textAlign: "center",
                      }}
                    >
                      (업무 없음)
                    </div>
                  )}

                  {grouped[col.key].map((task, index) => (
                    <Draggable key={task.task_id} draggableId={String(task.task_id)} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          onClick={() => onTaskClick(task)}
                          style={{
                            userSelect: "none",
                            background: snapshot.isDragging ? "#e3f2fd" : "#fff",
                            border: "1px solid #ddd",
                            borderRadius: 8,
                            padding: "10px 12px",
                            marginBottom: 8,
                            boxShadow: snapshot.isDragging ? "0 2px 6px rgba(0,0,0,0.1)" : "none",
                            cursor: "pointer",
                            transition: "background 0.2s",
                            ...provided.draggableProps.style,
                          }}
                        >
                          <div style={{ fontWeight: 500, marginBottom: 4, color: "#333" }}>
                            {task.title}
                          </div>
                          {task.assignee_name && (
                            <div style={{ fontSize: 13, color: "#555", marginBottom: 4 }}>
                              👤 {task.assignee_name}
                            </div>
                          )}
                          <div style={{ fontSize: 12, color: "#777" }}>
                            📅 {task.start_date || "-"} ~ {task.due_date || "-"}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}

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
