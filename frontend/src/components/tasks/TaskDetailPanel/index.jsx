// src/components/tasks/TaskDetailPanel/index.jsx
import { useEffect, useState } from "react";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import Button from "../../common/Button";
import { Drawer } from "../../common/Drawer";
import { Loader } from "../../common/Loader";
import ProjectInfoView from "./ProjectInfoView";
import TaskAttachments from "./TaskAttachments";
import TaskComments from "./TaskComments";
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
 * ✅ TaskDetailPanel (상세보기 전용)
 * - 수정/편집 모드 제거됨
 * - 프로젝트/업무 상세정보 + 첨부파일/댓글만 표시
 */
export default function TaskDetailPanel({ projectId, taskId, onClose, onAddSubtask }) {
  const { fetchTasksByProject, setOpenDrawer } = useProjectGlobal();

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
  } = useTaskDetail(projectId, taskId);

  const [jwtUser, setJwtUser] = useState(null);

  // ✅ JWT 복호화
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) setJwtUser(decodeJwt(token));
  }, []);

  // ✅ 드로어 동시 열림 방지
  useEffect(() => {
    setOpenDrawer(false);
  }, [setOpenDrawer]);

  // ✅ ESC 키 닫기
  useEffect(() => {
    const onEsc = e => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  const handleClose = () => {
    setOpenDrawer(false);
    onClose?.();
  };

  // ✅ 로딩 중
  if (loading)
    return (
      <div className="fixed top-0 right-0 w-[480px] h-full bg-white flex items-center justify-center shadow-lg z-50">
        <Loader text="상세 정보 불러오는 중..." />
      </div>
    );

  // ✅ 데이터 없음
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

  // ✅ 렌더링 (상세보기 전용)
  return (
    <Drawer
      open
      title={isProject ? "프로젝트 상세" : "업무 상세"}
      onClose={handleClose}
    >
      <div className="flex flex-col gap-5 pb-6">
        {isProject ? (
          <ProjectInfoView project={task} />
        ) : (
          <TaskInfoView
            task={task}
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
      </div>
    </Drawer>
  );
}
