import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getEmployees } from "../../../services/api/employee";
import { deleteTask, updateTask } from "../../../services/api/task";
import AssigneeSelector from "../AssigneeSelector"; // ✅ 분리된 컴포넌트 불러오기
import TaskNode from "../TaskNode"; // 하위업무 렌더링용

export default function TaskInfoView({ task, parentTask, onRefresh }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [taskData, setTaskData] = useState(task);

  useEffect(() => {
    getEmployees().then(setEmployees);
  }, []);

  if (!taskData) return <p style={{ padding: 20 }}>⏳ 업무 데이터를 불러오는 중...</p>;

 const handleSave = async () => {
  try {
    await updateTask(taskData.project_id, taskData.task_id, taskData);
    toast.success("업무 수정 완료!");
    setIsEditing(false);
    onRefresh?.();
  } catch (err) {
    console.error("❌ 태스크 수정 중 오류:", err);
    toast.error("태스크 수정 중 오류 발생: " + err.message);
  }
};

const handleAddSibling = () => {
  const newTask = {
    title: "새 업무",
    description: "",
    status: "PLANNED",
    priority: "MEDIUM",
    start_date: null,
    end_date: null,
    estimate_hours: 0,
    progress: 0,
    project_id: taskData.project_id,
    assignees: [],
    subtask: [],
  };

  // 현재 업무의 상위(parentTask)가 있는 경우, 그쪽에 추가 이벤트를 전달해야 함
  if (parentTask) {
    if (!parentTask.subtask) parentTask.subtask = [];
    parentTask.subtask.push(newTask);
    toast.success("동일 레벨 업무가 추가되었습니다.");
  } else {
    toast("현재 구조에서는 동일 레벨 추가 기능은 루트 수준에서 처리해야 합니다.");
  }

  onRefresh?.();
};

// ✅ 세부업무 추가
const handleAddSubtask = () => {
  const newSub = {
    title: "새 하위업무",
    description: "",
    status: "PLANNED",
    priority: "MEDIUM",
    start_date: null,
    end_date: null,
    estimate_hours: 0,
    progress: 0,
    project_id: taskData.project_id,
    parent_task_id: taskData.task_id,
    assignees: [],
    subtask: [],
  };

  setTaskData(prev => ({
    ...prev,
    subtask: [...(prev.subtask || []), newSub],
  }));

  toast.success("새 하위업무가 추가되었습니다.");
};



  const handleDelete = async () => {
    if (!window.confirm("이 업무를 삭제하시겠습니까?")) return;
    try {
      await deleteTask(taskData.task_id);
      toast.success("업무가 삭제되었습니다.");
      onRefresh?.();
    } catch (err) {
      toast.error("삭제 중 오류 발생");
    }
  };

  // 💄 디자인 추가 — 메인 카드 컨테이너
  return (
  <div
    style={{
      padding: 24,
      background: "linear-gradient(180deg,#fdfdfd,#f7f8fa)",
      borderRadius: 12,
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      maxWidth: 800,
      margin: "0 auto",
    }}
  >

      {/* 상위업무 표시 */}
      {parentTask && (
  <p
    style={{
      color: "#666",
      fontSize: 14,
      marginBottom: 6,
      padding: "4px 8px",
      background: "#eef2ff",
      borderRadius: 6,
      display: "inline-block",
    }}
  >
          <strong style={{ color: "#444" }}>📁 상위업무:</strong> {parentTask.title} &gt;{" "}
          <span style={{ color: "#1976d2" }}>{taskData.title || "제목 없음"}</span>
        </p>
      )}

      <h2
  style={{
    marginTop: 8,
    fontSize: 20,
    fontWeight: 600,
    color: "#222",
    borderBottom: "2px solid #1976d2",
    paddingBottom: 6,
    marginBottom: 16,
  }}
>📌 업무 상세정보</h2>

      <label>업무 제목</label>
      <input
  value={taskData.title || ""}
  onChange={e => setTaskData({ ...taskData, title: e.target.value })}
  disabled={!isEditing}
  style={{
    width: "100%",
    marginBottom: 12,
    background: !isEditing ? "#f6f6f6" : "white",
    border: "1px solid #ccc",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 15,
    transition: "all 0.2s",
  }}
/>

      <label style={{ fontWeight: 500, color: "#444" }}>업무 설명</label>
      <textarea
  value={taskData.description || ""}
  onChange={e => setTaskData({ ...taskData, description: e.target.value })}
  disabled={!isEditing}
  style={{
    width: "100%",
    minHeight: 100,
    padding: 10,
    borderRadius: 8,
    border: "1px solid #ccc",
    fontSize: 15,
    background: !isEditing ? "#f6f6f6" : "white",
    resize: "vertical",
  }}
/>

      {/* 상세입력 토글 */}
      <button
  onClick={() => setShowDetails(!showDetails)}
  style={{
    background: showDetails ? "#444" : "#1976d2",
    color: "white",
    border: "none",
    borderRadius: 8,
    padding: "10px 16px",
    cursor: "pointer",
    marginTop: 16,
    fontSize: 15,
    boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
  }}
>
  {showDetails ? "▲ 상세입력 닫기" : "▼ 상세입력 보기"}
</button>

      {showDetails && (
        <div
          style={{
            background: "#f9f9f9",
            padding: 12,
            borderRadius: 8,
            marginTop: 10,
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <label>시작일</label>
            <input
              type="date"
              value={taskData.start_date || ""}
              disabled={!isEditing}
              onChange={e => setTaskData({ ...taskData, start_date: e.target.value })}
              style={{
                marginLeft: 8,
                background: !isEditing ? "#f6f6f6" : "white",
              }}
            />
            <label style={{ marginLeft: 16 }}>종료일</label>
            <input
              type="date"
              value={taskData.end_date || ""}
              disabled={!isEditing}
              onChange={e => setTaskData({ ...taskData, end_date: e.target.value })}
              style={{
                marginLeft: 8,
                background: !isEditing ? "#f6f6f6" : "white",
              }}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <strong>담당자:</strong>
            <AssigneeSelector
              employees={employees}
              selected={taskData.assignees || []}
              setSelected={sel => setTaskData({ ...taskData, assignees: sel })}
              disabled={!isEditing}
            />
          </div>
        </div>
      )}

      {/* 진행률 */}
      <div style={{ marginTop: 16 }}>
        <label>📊 진행률: {taskData.progress || 0}%</label>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={taskData.progress || 0}
          onChange={e => setTaskData({ ...taskData, progress: Number(e.target.value) })}
          disabled={!isEditing}
          style={{ width: "100%" }}
        />
      </div>

      {/* 하위업무 목록 */}
      <div
  style={{
    marginTop: 24,
    background: "#fafafa",
    border: "1px solid #eee",
    borderRadius: 10,
    padding: 16,
  }}
>
  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>📋 하위업무 목록</h3>
  {taskData.subtask?.length ? (
    taskData.subtask.map((st, i) => (
      <TaskNode
        key={st.task_id ?? `sub-${i}`}
        task={st}
        employees={employees}
        depth={1}
        isEditing={isEditing}  // ✅ 편집모드 내려보내기

        // ✅ 자식이 바뀌면 1레벨 배열에 반영
        onUpdate={updatedChild =>
          setTaskData(prev => ({
            ...prev,
            subtask: (prev.subtask || []).map((t, idx) =>
              idx === i ? updatedChild : t
            ),
          }))
        }

        // ✅ 동일 레벨(형제) 추가: target 바로 뒤에 삽입
        onAddSibling={(newSibling, target) =>
          setTaskData(prev => {
            const list = [...(prev.subtask || [])];
            const tid = t => t.task_id ?? t.id;
            const idx = list.findIndex(t => tid(t) === tid(target));
            if (idx >= 0) list.splice(idx + 1, 0, {
              ...newSibling,
              isEditing: true,
            });
            return { ...prev, subtask: list };
          })
        }
      />
    ))
  ) : (
    <p style={{ color: "#999" }}>등록된 하위업무가 없습니다.</p>
  )}
</div>



      {/* 하단 버튼 */}
      <div
  style={{
    borderTop: "1px solid #eee",
    paddingTop: 20,
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 30,
  }}
>
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              style={{
                background: "#1976d2",
                color: "white",
                border: "none",
                borderRadius: 6,
                padding: "8px 14px",
                cursor: "pointer",
              }}
            >
              저장
            </button>
            <button
              onClick={() => setIsEditing(false)}
              style={{
                background: "#f1f1f1",
                border: "1px solid #ccc",
                borderRadius: 6,
                padding: "8px 14px",
                cursor: "pointer",
              }}
            >
              취소
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              style={{
                background: "#4caf50",
                color: "white",
                border: "none",
                borderRadius: 6,
                padding: "8px 14px",
                cursor: "pointer",
              }}
            >
              ✏️ 수정
            </button>
            <button
              onClick={handleDelete}
              style={{
                background: "#f44336",
                color: "white",
                border: "none",
                borderRadius: 6,
                padding: "8px 14px",
                cursor: "pointer",
              }}
            >
              🗑️ 삭제
            </button>
          </>
        )}
      </div>
    </div>
  );
}
