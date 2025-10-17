import { Draggable } from "@hello-pangea/dnd";

export default function ProjectCard({ task: project, index, onClick }) {
  const colorByStatus = {
    PLANNED: "#E5E7EB",
    IN_PROGRESS: "#BFDBFE",
    ON_HOLD: "#FDE68A",
    DONE: "#BBF7D0",
  };
  const bg = colorByStatus[project.status?.toUpperCase()] ?? "#F3F4F6";

  return (
    <Draggable draggableId={String(project.project_id)} index={index}>
      {provided => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick?.(project)}
          style={{
            backgroundColor: bg,
            borderRadius: "8px",
            padding: "10px",
            marginBottom: "8px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
            cursor: "pointer",
            ...provided.draggableProps.style,
          }}
        >
          <div style={{ fontWeight: 600 }}>{project.project_name}</div>
          {project.owner_name && (
            <div style={{ fontSize: 13, color: "#555" }}>👤 {project.owner_name}</div>
          )}
          {project.start_date && (
            <div style={{ fontSize: 12, color: "#666" }}>
              📅 {project.start_date} ~ {project.due_date ?? "미정"}
            </div>
          )}
          {project.description && (
            <div
              style={{
                fontSize: 12,
                color: "#777",
                marginTop: 4,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {project.description}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
