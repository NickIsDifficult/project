// src/components/project/ProjectDetailPanel/index.jsx
import { useEffect, useState } from "react";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import { deleteTask } from "../../../services/api/task";
import Button from "../../common/Button";
import { Drawer } from "../../common/Drawer";
import { Loader } from "../../common/Loader";
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
 * ✅ ProjectDetailPanel (프로젝트/업무 상세보기)
 */
export default function ProjectDetailPanel({ projectId, taskId, onClose, onAddSubtask }) {
  const { fetchTasksByProject, setUiState } = useProjectGlobal();
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

  const [jwtUser, setJwtUser] = useState(null);
  const [openEditDrawer, setOpenEditDrawer] = useState(false);


  // ✅ JWT 디코딩
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) setJwtUser(decodeJwt(token));
  }, []);

  // ✅ ESC 닫기 핸들러
  useEffect(() => {
    const onEsc = e => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  const handleClose = () => {
    setUiState(prev => ({
      ...prev,
      panel: { selectedTask: null },
      drawer: { ...prev.drawer, task: false, project: false },
    }));
    onClose?.();
  };

  // 🔹 업무 삭제 처리
  const handleDeleteTask = async () => {
    if (!taskId) return;
    if (!window.confirm("이 업무를 삭제하시겠습니까?")) return;
    try {
      await deleteTask(projectId, taskId);
      await fetchTasksByProject(projectId);
      handleClose(); // 패널 닫기
    } catch (err) {
      console.error("❌ 업무 삭제 실패:", err);
      alert("업무 삭제 중 오류가 발생했습니다.");
    }
  };

  // ✅ 로딩 상태
  if (loading)
    return (
      <div className="fixed top-0 right-0 w-[480px] h-full bg-white flex items-center justify-center shadow-lg z-50">
        <Loader text="상세 정보 불러오는 중..." />
      </div>
    );

  if (!task)
    return (
      <div className="fixed top-0 right-0 w-[480px] h-full bg-white flex flex-col items-center justify-center shadow-lg z-50">
        <p className="text-gray-600 mb-4">❌ 데이터를 찾을 수 없습니다.</p>
        <Button variant="secondary" onClick={handleClose}>
          닫기
        </Button>
      </div>
    );

  const isProject = task.isProject || task.type === "PROJECT" || task.task_type === "PROJECT";

  return (
    <>
      <Drawer open title={isProject ? "📁 프로젝트 상세" : "🧩 업무 상세"} onClose={handleClose}>
        <div className="flex flex-col gap-6 pb-6">
          {isProject ? (
            <ProjectInfoView project={task} onClose={handleClose} />
          ) : (
            <TaskInfoView
              task={task}
              onEdit={() => setOpenEditDrawer(true)}
              onStatusChange={async status => {
                await handleStatusChange(status);
                await fetchTasksByProject(projectId);
              }}
              onProgressChange={async progress => {
                await handleProgressChange(progress);
                await fetchTasksByProject(projectId);
              }}
              onAddSubtask={onAddSubtask}
              onDeleteTask={handleDeleteTask}
            />
          )}

          {/* 업무 상세 전용: 첨부 + 댓글 */}
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

      {/* 🔹 업무 수정 Drawer */}
      {!isProject && (
        <Drawer open={openEditDrawer} title="✏️ 업무 수정" onClose={() => setOpenEditDrawer(false)}>
          <TaskEditForm
            task={task}
            employees={employees}
            onSave={async formData => {
              const updated = await handleSaveEdit(formData);
              if (updated) {
                await fetchTasksByProject(projectId);
                setOpenEditDrawer(false);
              }
            }}
            onCancel={() => setOpenEditDrawer(false)}
          />
        </Drawer>
      )}
    </>
  );
}
