// src/components/tasks/TaskDetailPanel/index.jsx
import { useState } from "react";
import { useProjectDetailContext } from "../../../context/ProjectDetailContext";
import Button from "../../common/Button";
import { Loader } from "../../common/Loader";
import TaskAttachments from "./TaskAttachments";
import TaskComments from "./TaskComments";
import TaskEditForm from "./TaskEditForm";
import TaskInfoView from "./TaskInfoView";
import { useTaskDetail } from "./useTaskDetail";

export default function TaskDetailPanel({ taskId, onClose, onAddSubtask, currentUser }) {
  /* ----------------------------------------
   * ✅ ProjectDetailContext 연결
   * ---------------------------------------- */
  const { fetchTasks, updateTaskLocal } = useProjectDetailContext();

  /* ----------------------------------------
   * ✅ 업무 상세 데이터 로드 (커스텀 훅)
   * ---------------------------------------- */
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
  } = useTaskDetail(taskId);

  const [isEditing, setIsEditing] = useState(false);

  /* ----------------------------------------
   * 로딩 / 예외 처리
   * ---------------------------------------- */
  if (loading) return <Loader text="업무 상세 불러오는 중..." />;

  if (!task)
    return (
      <div style={{ padding: 24 }}>
        ❌ 해당 업무를 찾을 수 없습니다.
        <Button variant="secondary" onClick={onClose} style={{ marginTop: 16 }}>
          닫기
        </Button>
      </div>
    );

  /* ----------------------------------------
   * ✅ 수정 저장 핸들러 통합
   * ---------------------------------------- */
  const handleSaveAndSync = async payload => {
    const updated = await handleSaveEdit(payload);
    if (updated) {
      updateTaskLocal(updated); // Context의 로컬 task 리스트 갱신
      fetchTasks(); // 전체 새로고침 (서버 반영)
    }
    setIsEditing(false);
  };

  /* ----------------------------------------
   * UI 렌더링
   * ---------------------------------------- */
  return (
    <>
      {/* 🔲 배경 오버레이 */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.3)",
          zIndex: 999,
        }}
        onClick={e => e.target === e.currentTarget && onClose()}
      />

      {/* ⚙️ 오른쪽 패널 */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "45vw",
          height: "100%",
          background: "#fff",
          boxShadow: "-2px 0 8px rgba(0,0,0,0.1)",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            borderBottom: "1px solid #ddd",
            padding: "12px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0 }}>{task.title}</h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* 본문 */}
        <div style={{ padding: 16, flex: 1 }}>
          {/* ✏️ 수정 모드 */}
          {isEditing ? (
            <TaskEditForm
              task={task}
              employees={employees}
              onSave={handleSaveAndSync}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            /* 🔍 읽기 모드 */
            <TaskInfoView
              task={task}
              onStatusChange={async status => {
                await handleStatusChange(status);
                fetchTasks();
              }}
              onProgressChange={async progress => {
                await handleProgressChange(progress);
                fetchTasks();
              }}
              onEdit={() => setIsEditing(true)}
              onAddSubtask={onAddSubtask}
            />
          )}

          {/* 📎 첨부파일 섹션 */}
          <TaskAttachments
            attachments={attachments}
            onUpload={async file => {
              await handleUploadFile(file);
              fetchTasks();
            }}
            onDelete={async id => {
              await handleDeleteFile(id);
              fetchTasks();
            }}
          />

          {/* 💬 댓글 섹션 */}
          <TaskComments
            comments={comments}
            currentUser={currentUser}
            onAdd={handleAddComment}
            onEdit={handleUpdateComment}
            onDelete={handleDeleteComment}
          />
        </div>
      </aside>
    </>
  );
}
