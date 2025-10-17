import TaskCard from "./TaskCard";

/**
 * ✅ Kanban Column (상태별 업무 그룹)
 * - props:
 *   - label: 컬럼 이름 (예: "진행 중 🚧")
 *   - tasks: 해당 상태의 업무 배열
 *   - onTaskClick: 업무 클릭 시 호출되는 콜백
 */
export default function TaskColumn({ label, tasks, onTaskClick }) {
  return (
    <div style={colWrapper}>
      {/* 헤더 */}
      <div style={colHeader}>
        <span>{label}</span>
        <span style={countBadge}>{tasks.length}</span>
      </div>

      {/* 카드 리스트 */}
      <div style={colBody}>
        {tasks.length === 0 ? (
          <p style={emptyText}>업무 없음</p>
        ) : (
          tasks.map((task, index) => (
            <TaskCard
              key={task.task_id}
              task={task}
              index={index}
              onClick={() => onTaskClick?.(task)}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ---------------------------
 * 🎨 스타일 정의
 * --------------------------- */
const colWrapper = {
  minWidth: 260,
  background: "#f8f9fa",
  borderRadius: 8,
  display: "flex",
  flexDirection: "column",
  height: "calc(100vh - 200px)",
  padding: 8,
  boxShadow: "inset 0 0 0 1px #e0e0e0",
};

const colHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontWeight: "bold",
  fontSize: 16,
  margin: "4px 0 8px 4px",
  paddingBottom: 4,
  borderBottom: "1px solid #ddd",
};

const countBadge = {
  background: "#dee2e6",
  borderRadius: 12,
  fontSize: 12,
  padding: "2px 8px",
  color: "#333",
};

const colBody = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  overflowY: "auto", // ✅ 컬럼 단위 스크롤
  paddingRight: 4,
};

const emptyText = {
  textAlign: "center",
  color: "#aaa",
  marginTop: 12,
  fontSize: 13,
};
