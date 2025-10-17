import { useEffect, useState } from "react";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import Button from "../../common/Button";
import { Drawer } from "../../common/Drawer";
import { Loader } from "../../common/Loader";
import ProjectEditForm from "../../projects/ProjectEditForm";
import TaskAttachments from "./TaskAttachments";
import TaskComments from "./TaskComments";
import TaskEditForm from "./TaskEditForm";
import TaskInfoView from "./TaskInfoView";
import { useTaskDetail } from "./useTaskDetail";

/**
 * ✅ TaskDetailPanel (전역형)
 * - 업무 또는 프로젝트의 상세 / 수정 / 댓글 / 파일 관리
 * - Kanban/List/Calendar 등 어디서든 호출 가능
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

  /** ✅ ESC 키로 닫기 */
  useEffect(() => {
    const handleEsc = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  /** ✅ 로딩 상태 */
  if (loading) {
    return (
      <div className="fixed top-0 right-0 w-[480px] h-full bg-white flex items-center justify-center shadow-lg z-50">
        <Loader text="업무 상세 불러오는 중..." />
      </div>
    );
  }

  /** ✅ 데이터 없음 */
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

  const isProject = task.isProject || task.type === "PROJECT";

  /** ✅ 수정 저장 + 전역 동기화 */
  const handleSaveAndSync = async payload => {
    const updated = await handleSaveEdit(payload);
    if (updated) {
      updateTaskLocal(taskId, updated);
      fetchTasksByProject(projectId);
    }
    setIsEditing(false);
  };

  /** ✅ Drawer 본문 */
  return (
    <Drawer
      open
      title={
        isEditing
          ? isProject
            ? "프로젝트 수정"
            : "업무 수정"
          : isProject
            ? "프로젝트 상세"
            : "업무 상세"
      }
      onClose={onClose}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* ----------------------------- */}
        {/* ✅ 수정 모드 분기 */}
        {/* ----------------------------- */}
        {isEditing ? (
          isProject ? (
            <ProjectEditForm
              project={task}
              onClose={() => setIsEditing(false)}
              onSaved={() => {
                fetchTasksByProject(projectId);
                setIsEditing(false);
              }}
            />
          ) : (
            <TaskEditForm
              task={task}
              employees={employees}
              onSave={handleSaveAndSync}
              onCancel={() => setIsEditing(false)}
            />
          )
        ) : (
          <>
            {/* ----------------------------- */}
            {/* ✅ 상세보기 영역 */}
            {/* ----------------------------- */}
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

            {/* ----------------------------- */}
            {/* ✅ 프로젝트는 첨부/댓글 생략 */}
            {/* ----------------------------- */}
            {!isProject && (
              <>
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

                <TaskComments
                  comments={comments}
                  onAdd={handleAddComment}
                  onEdit={handleUpdateComment}
                  onDelete={handleDeleteComment}
                />
              </>
            )}
          </>
        )}
      </div>
    </Drawer>
  );
}
