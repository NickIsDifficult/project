// ✅ src/components/tasks/TaskDetailPanel/index.jsx
import { useState } from "react";
import Button from "../../common/Button";
import { Loader } from "../../common/Loader";
import TaskAttachments from "./TaskAttachments";
import TaskComments from "./TaskComments";
import TaskEditForm from "./TaskEditForm";
import TaskInfoView from "./TaskInfoView";
import { useTaskDetail } from "./useTaskDetail";

export default function TaskDetailPanel({ projectId, taskId, onClose, onAddSubtask }) {
  const [isEditing, setIsEditing] = useState(false);

  // ✅ 훅은 항상 호출 — 내부에서 안전하게 guard 처리됨
  const {
    task,
    comments,
    attachments,
    employees,
    loading,
    handleAddComment,
    handleUpdateComment,
    handleDeleteComment,
    handleUploadFile,
    handleDeleteFile,
    handleStatusChange,
    handleProgressChange,
    handleSaveEdit,
  } = useTaskDetail(projectId, taskId);

  // ✅ projectId, taskId 없을 경우 UI로 안내
  if (!projectId || !taskId) {
    return (
      <div style={{ padding: 20 }}>
        ⚠️ 잘못된 업무 정보입니다.
        <div style={{ marginTop: 10 }}>
          <Button onClick={onClose}>닫기</Button>
        </div>
      </div>
    );
  }

  // ✅ 로딩 중
  if (loading) return <Loader message="업무 정보를 불러오는 중..." />;

  // ✅ 데이터가 null일 경우
  if (!task) {
    return (
      <div style={{ padding: 20 }}>
        ⚠️ 업무 정보를 찾을 수 없습니다.
        <div style={{ marginTop: 10 }}>
          <Button onClick={onClose}>닫기</Button>
        </div>
      </div>
    );
  }

  // ✅ 정상 렌더링
  return (
    <div style={{ padding: 20, background: "#fff", borderRadius: 10, minHeight: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>📋 {task.title || "제목 없음"}</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={() => window.location.reload()}>🔄 새로고침</Button>
          <Button onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? "보기 모드" : "✏️ 수정 모드"}
          </Button>
          <Button onClick={onClose}>닫기</Button>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        {isEditing ? (
          <TaskEditForm
            task={task}
            employees={employees}
            onSave={async payload => {
              await handleSaveEdit(payload);
              setIsEditing(false);
            }}
          />
        ) : (
          <TaskInfoView
            task={task}
            employees={employees}
            onStatusChange={handleStatusChange}
            onProgressChange={handleProgressChange}
          />
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>📎 첨부파일</h3>
        <TaskAttachments
          attachments={attachments}
          onUpload={handleUploadFile}
          onDelete={handleDeleteFile}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>💬 댓글</h3>
        <TaskComments
          comments={comments}
          onAdd={handleAddComment}
          onUpdate={handleUpdateComment}
          onDelete={handleDeleteComment}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24, gap: 8 }}>
        <Button onClick={() => onAddSubtask?.(task.task_id)}>＋ 하위 업무 추가</Button>
        <Button onClick={onClose}>닫기</Button>
      </div>
    </div>
  );
}
