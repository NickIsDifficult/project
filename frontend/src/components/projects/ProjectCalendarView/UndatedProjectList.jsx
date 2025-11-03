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

  // ✅ 프로젝트별 그룹화
  const grouped = tasks.reduce((acc, t) => {
    const pid = t.project_id || "기타";
    if (!acc[pid]) acc[pid] = { project_name: t.project_name, items: [] };
    acc[pid].items.push(t);
    return acc;
  }, {});

  return (
    <div style={container}>
      {Object.entries(grouped).map(([pid, group]) => (
        <div key={pid} style={projectSection}>
          <h4 style={projectTitle}>📁 {group.project_name || "프로젝트 미지정"}</h4>

          <ul style={listStyle}>
            {group.items.map(t => {
              const color = getTaskColor(t, colorMode, projectColorMap);
              const statusLabel = getStatusLabel(t.status);
              return (
                <li
                  key={t.task_id}
                  onClick={() => onTaskClick?.(t)}
                  style={{ ...taskItem, borderLeft: `4px solid ${color}` }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fa")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                >
                  <div style={taskMain}>
                    <span style={taskTitle}>{t.title}</span>
                    {t.assignee_name && <span style={assigneeTag}>👤 {t.assignee_name}</span>}
                  </div>

                  <div style={taskMeta}>
                    <span
                      style={{
                        ...statusTag,
                        background: color,
                        color: "#222",
                      }}
                    >
                      {statusLabel}
                    </span>
                    <span style={projectTag}>#{pid}</span>
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
  border: "1px solid #eee",
  borderRadius: 8,
  padding: "8px 12px",
  background: "#fafafa",
};

const projectTitle = {
  fontSize: 14,
  fontWeight: "bold",
  color: "#333",
  marginBottom: 6,
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
  border: "1px solid #ddd",
  borderRadius: 6,
  padding: "6px 10px",
  background: "#fff",
  cursor: "pointer",
  transition: "background 0.2s, box-shadow 0.2s",
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
};

const taskMain = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const taskTitle = {
  fontWeight: 500,
  color: "#333",
  fontSize: 13,
  lineHeight: "1.3em",
};

const assigneeTag = {
  fontSize: 12,
  color: "#555",
  background: "#f1f8e9",
  padding: "2px 6px",
  borderRadius: 6,
};

const taskMeta = {
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const statusTag = {
  fontSize: 11,
  color: "#333",
  padding: "2px 6px",
  borderRadius: 4,
};

const projectTag = {
  fontSize: 11,
  color: "#888",
  background: "#f5f5f5",
  padding: "2px 5px",
  borderRadius: 4,
};

const emptyBox = {
  fontSize: 13,
  color: "#888",
  background: "#fafafa",
  padding: "8px 12px",
  border: "1px solid #eee",
  borderRadius: 8,
};
