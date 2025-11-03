// ✅ FULL UPDATED FILE — src/components/projects/ProjectCalendarView/UndatedProjectList.jsx
import { getStatusLabel, getTaskColor } from "../constants/taskDisplay";

export default function UndatedProjectList({
  tasks = [],
  onTaskClick,
  colorMode = "status",
  projectColorMap = {},
}) {
  if (!tasks.length) {
    return <div style={emptyBox}>모든 업무가 날짜를 가지고 있습니다 🎉</div>;
  }

  const grouped = tasks.reduce((acc, t) => {
    const pid = Number(t.project_id) || 0;
    const pname = t.project_name || "프로젝트 미지정";
    if (!acc[pid]) acc[pid] = { project_name: pname, items: [] };
    acc[pid].items.push(t);
    return acc;
  }, {});

  return (
    <div style={container}>
      {Object.entries(grouped).map(([pid, group]) => (
        <div key={pid} style={projectSection}>
          <h4 style={projectTitle}>
            📁 {group.project_name}
            <span style={countBadge}>{group.items.length}</span>
          </h4>

          <ul style={listStyle}>
            {group.items.map(t => {
              const color = getTaskColor(t, colorMode, projectColorMap);
              const statusLabel = getStatusLabel(t.status);

              const validProjectId =
                Number(t.project_id) ||
                Number(t.project?.project_id) ||
                Number(t.parent_project_id) ||
                0;

              const isDraggable = !!validProjectId && !isNaN(validProjectId);

              return (
                <li
                  key={t.task_id}
                  draggable={isDraggable}
                  data-raw={JSON.stringify(t)}
                  onDragStart={e => {
                    console.log("🔥 DRAG START fired for task:", t.task_id);

                    const payload = {
                      ...t,
                      project_id: validProjectId,
                      project_name: t.project_name || "프로젝트 미지정",
                    };

                    window.__dragPayload = JSON.stringify(payload); // ✅ v6 대응
                    console.log("✅ window.__dragPayload set =", window.__dragPayload);

                    e.currentTarget.style.opacity = 0.6;
                  }}
                  onDragEnd={e => (e.currentTarget.style.opacity = 1)}
                  onClick={() => onTaskClick?.(t)}
                  style={{
                    ...taskItem,
                    borderLeft: `4px solid ${color}`,
                    opacity: isDraggable ? 1 : 0.5,
                    cursor: isDraggable ? "grab" : "not-allowed",
                  }}
                >
                  <div style={taskLeft}>
                    <span style={taskDot(color)} />
                    <span style={taskTitle}>
                      {t.title || "제목 없음"}
                      {!isDraggable && (
                        <span style={{ fontSize: 11, color: "#b71c1c", marginLeft: 6 }}>
                          (⚠️ 등록 불가)
                        </span>
                      )}
                    </span>
                  </div>

                  <div style={taskRight}>
                    {t.assignee_name && <span style={assigneeTag}>👤 {t.assignee_name}</span>}
                    <span
                      style={{
                        ...statusTag,
                        background: color,
                        color: "#111",
                      }}
                    >
                      {statusLabel}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ---------------------- 스타일 ---------------------- */
const container = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  marginTop: 8,
};

const projectSection = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "8px 12px",
  background: "#ffffff",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
};

const projectTitle = {
  fontSize: 14,
  fontWeight: 600,
  color: "#333",
  marginBottom: 8,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const countBadge = {
  fontSize: 11,
  background: "#f3f4f6",
  color: "#555",
  padding: "1px 6px",
  borderRadius: 10,
  marginLeft: 6,
};

const listStyle = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const taskItem = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  border: "1px solid #eee",
  borderRadius: 6,
  padding: "6px 10px",
  background: "#fff",
  cursor: "pointer",
  transition: "background 0.2s, transform 0.1s",
};

const taskLeft = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flex: 1,
  minWidth: 0,
};

const taskDot = color => ({
  width: 10,
  height: 10,
  borderRadius: "50%",
  background: color,
  flexShrink: 0,
});

const taskTitle = {
  fontWeight: 500,
  color: "#333",
  fontSize: 13,
  lineHeight: "1.3em",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const taskRight = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexShrink: 0,
};

const assigneeTag = {
  fontSize: 11,
  color: "#444",
  background: "#f1f8e9",
  padding: "2px 5px",
  borderRadius: 6,
};

const statusTag = {
  fontSize: 11,
  color: "#333",
  padding: "2px 6px",
  borderRadius: 4,
  border: "1px solid rgba(0,0,0,0.1)",
};

const emptyBox = {
  fontSize: 13,
  color: "#888",
  background: "#fafafa",
  padding: "8px 12px",
  border: "1px solid #eee",
  borderRadius: 8,
  textAlign: "center",
};
