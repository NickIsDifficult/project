// src/components/tasks/TaskDetailPanel/index.jsx
import { useEffect, useState } from "react";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import Button from "../../common/Button";
import { Drawer } from "../../common/Drawer";
import { Loader } from "../../common/Loader";
import ProjectEditForm from "./ProjectEditForm";
import ProjectInfoView from "./ProjectInfoView";
import TaskAttachments from "./TaskAttachments";
import TaskComments from "./TaskComments";
import TaskEditForm from "./TaskEditForm";
import TaskInfoView from "./TaskInfoView";
import { useTaskDetail } from "./useTaskDetail";

/* ----------------------------------------
 * 🧩 JWT 디코더
 * ---------------------------------------- */
function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * ✅ TaskDetailPanel (전역형)
 * - 프로젝트와 업무 모두 통합 관리
 * - List / Kanban / Calendar 어디서든 호출 가능
 */
export default function TaskDetailPanel({ projectId, taskId, onClose, onAddSubtask }) {
  const { fetchTasksByProject, updateTaskLocal, setOpenDrawer } = useProjectGlobal();

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
  const [jwtUser, setJwtUser] = useState(null);

  /* ----------------------------------------
   * ✅ JWT 디코드
   * ---------------------------------------- */
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) setJwtUser(decodeJwt(token));
  }, []);

  /* ----------------------------------------
   * ✅ 패널 열릴 때 Drawer는 자동 닫기
   * ---------------------------------------- */
  useEffect(() => {
    setOpenDrawer(false); // 🧩 패널과 드로어 동시 열림 방지
  }, [setOpenDrawer]);

  /* ----------------------------------------
   * ✅ ESC 닫기
   * ---------------------------------------- */
  useEffect(() => {
    const onEsc = e => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  const handleClose = () => {
    setOpenDrawer(false);
    onClose?.();
  };

  /* ----------------------------------------
   * ✅ 로딩 처리
   * ---------------------------------------- */
  if (loading)
    return (
      <div className="fixed top-0 right-0 w-[480px] h-full bg-white flex items-center justify-center shadow-lg z-50">
        <Loader text="상세 정보 불러오는 중..." />
      </div>
    );

  /* ----------------------------------------
   * ✅ 데이터 없음 처리
   * ---------------------------------------- */
  if (!task)
    return (
      <div className="fixed top-0 right-0 w-[480px] h-full bg-white flex flex-col items-center justify-center shadow-lg z-50">
        <p className="text-gray-600 mb-4">❌ 해당 항목을 찾을 수 없습니다.</p>
        <Button variant="secondary" onClick={handleClose}>
          닫기
        </Button>
      </div>
    );

  const isProject = task.isProject || task.type === "PROJECT" || task.task_type === "PROJECT";

  /* ----------------------------------------
   * ✅ 수정 저장 → 전역 동기화
   * ---------------------------------------- */
  const handleSaveAndSync = async payload => {
    const updated = await handleSaveEdit(payload);
    if (updated) {
      updateTaskLocal(taskId, updated);
      await fetchTasksByProject(projectId);
    }
    setIsEditing(false);
  };

  /* ----------------------------------------
   * ✅ 권한 확인
   * ---------------------------------------- */
  const canEdit =
    jwtUser &&
    ((isProject && task.owner_emp_id === jwtUser.emp_id) ||
      (!isProject && task.assignee_emp_id === jwtUser.emp_id));

  /* ----------------------------------------
   * ✅ 렌더링
   * ---------------------------------------- */
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
      onClose={handleClose}
    >
      <div className="flex flex-col gap-5 pb-6">
        {/* ✏️ 수정 모드 */}
        {isEditing ? (
          isProject ? (
            <ProjectEditForm
              project={task}
              onClose={() => setIsEditing(false)}
              onSaved={async () => {
                await fetchTasksByProject(projectId);
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
            {/* 📋 상세 보기 */}
            {isProject ? (
              <ProjectInfoView project={task} />
            ) : (
              <TaskInfoView
                task={task}
                onEdit={() => canEdit && setIsEditing(true)}
                onStatusChange={async status => {
                  await handleStatusChange(status);
                  await fetchTasksByProject(projectId);
                }}
                onProgressChange={async progress => {
                  await handleProgressChange(progress);
                  await fetchTasksByProject(projectId);
                }}
                onAddSubtask={onAddSubtask}
              />
            )}

            {/* 📎 첨부파일 + 💬 댓글 (업무 전용) */}
            {!isProject && (
              <>
                <TaskAttachments
                  attachments={attachments}
                  onUpload={async file => {
                    await handleUploadFile(file);
                    await fetchTasksByProject(projectId);
                  }}
                  onDelete={async id => {
                    await handleDeleteFile(id);
                    await fetchTasksByProject(projectId);
                  }}
                />
                <TaskComments
                  comments={comments}
                  currentUser={jwtUser}
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
