// src/components/tasks/TaskDetailPanel/index.jsx
import { useEffect, useState } from "react";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import Button from "../../common/Button";
import { Drawer } from "../../common/Drawer";
import { Loader } from "../../common/Loader";
import TaskAttachments from "./TaskAttachments";
import TaskComments from "./TaskComments";
import TaskEditForm from "./TaskEditForm";
import TaskInfoView from "./TaskInfoView";
import { useTaskDetail } from "./useTaskDetail";

/**
 * ✅ TaskDetailPanel (전역형)
 * - projectId, taskId 기반으로 업무 상세 관리
 * - Kanban/List/Calendar 어디서든 호출 가능
 */
export default function TaskDetailPanel({ projectId, taskId, onClose, onAddSubtask }) {
  const { fetchTasksByProject, updateTaskLocal } = useProjectGlobal();

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

  const [isEditing, setIsEditing] = useState(false);

  // ✅ ESC 키로 닫기
  useEffect(() => {
    const handleEsc = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // ✅ 로딩 상태
  if (loading) {
    return (
      <div className="fixed top-0 right-0 w-[480px] h-full bg-white flex items-center justify-center shadow-lg z-50">
        <Loader text="업무 상세 불러오는 중..." />
      </div>
    );
  }

  // ✅ 데이터 없음
  if (!task) {
    return (
      <div className="fixed top-0 right-0 w-[480px] h-full bg-white flex flex-col items-center justify-center shadow-lg z-50">
        <p className="text-gray-600 mb-4">❌ 해당 업무를 찾을 수 없습니다.</p>
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
      </div>
    );
  }

  // ✅ 수정 저장 + 동기화 (Optimistic Update + 새로고침)
  const handleSaveAndSync = async payload => {
    const updated = await handleSaveEdit(payload);
    if (updated) {
      updateTaskLocal(taskId, updated); // 로컬 즉시 반영
      fetchTasksByProject(projectId); // 서버 데이터 동기화
    }
    setIsEditing(false);
  };

  return (
    <Drawer open title={isEditing ? "업무 수정" : "업무 상세"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* 기본정보 or 수정폼 */}
        {isEditing ? (
          <TaskEditForm
            task={task}
            employees={employees}
            onSave={handleSaveAndSync}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <TaskInfoView
            task={task}
            onEdit={() => setIsEditing(true)}
            onStatusChange={async status => {
              await handleStatusChange(status);
              fetchTasksByProject(projectId);
            }}
            onProgressChange={async progress => {
              await handleProgressChange(progress);
              fetchTasksByProject(projectId);
            }}
            onAddSubtask={onAddSubtask}
          />
        )}

        {/* 첨부파일 */}
        <TaskAttachments
          attachments={attachments}
          onUpload={async file => {
            await handleUploadFile(file);
            fetchTasksByProject(projectId);
          }}
          onDelete={async id => {
            await handleDeleteFile(id);
            fetchTasksByProject(projectId);
          }}
        />

        {/* 댓글 */}
        <TaskComments
          comments={comments}
          onAdd={handleAddComment}
          onEdit={handleUpdateComment}
          onDelete={handleDeleteComment}
        />
      </div>
    </Drawer>
  );
}
