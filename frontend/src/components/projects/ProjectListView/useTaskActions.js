// src/components/projects/ProjectListView/useTaskActions.js
import toast from "react-hot-toast";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import { deleteProject, updateProject } from "../../../services/api/project";
import { deleteTask, updateTask, updateTaskStatus } from "../../../services/api/task";

/**
 * ✅ useTaskActions
 * - 프로젝트 / 업무의 CRUD 및 상태 변경 로직 담당
 */
export function useTaskActions() {
  const { fetchTasksByProject, fetchAllProjects, updateTaskLocal, updateProjectLocal } =
    useProjectGlobal();

  /* ----------------------------------------
   * 🔄 상태 변경
   * ---------------------------------------- */
  const handleStatusChange = async (task, newStatus) => {
    if (!task) return;
    const projectId = Number(task.project_id);
    const taskId = Number(task.task_id);
    const isProject = !!task.isProject;

    try {
      if (isProject) {
        await updateProject(projectId, { status: newStatus });
        updateProjectLocal(projectId, { status: newStatus });
      } else {
        await updateTaskStatus(projectId, taskId, newStatus);
        updateTaskLocal(taskId, { status: newStatus });
      }
      toast.success(isProject ? "프로젝트 상태 변경 완료" : "업무 상태 변경 완료");
    } catch (err) {
      console.error("❌ 상태 변경 실패:", err);
      toast.error("상태 변경 실패");
    }
  };

  /* ----------------------------------------
   * 🗑️ 삭제 (수정됨)
   * ---------------------------------------- */
  const handleDelete = async (effectiveId, projectId) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    const pid = Number(projectId);
    const isProject = String(effectiveId).startsWith("proj");

    try {
      if (isProject) {
        // 프로젝트 삭제
        await deleteProject(pid);
        toast.success("프로젝트 삭제 완료");
        await fetchAllProjects();
      } else {
        // 업무 삭제 (문자열에서 숫자만 추출)
        const tid = parseInt(String(effectiveId).replace("task-", ""), 10);
        if (isNaN(tid)) throw new Error(`잘못된 taskId: ${effectiveId}`);
        await deleteTask(pid, tid);
        toast.success("업무 삭제 완료");
        await fetchTasksByProject(pid);
      }

      await fetchTasksByProject(pid);
    } catch (err) {
      console.error("❌ 삭제 실패:", err);
      toast.error("삭제 실패");
    }
  };

  /* ----------------------------------------
   * ✏️ 수정 (현재 사용 X, 단순 API 예시)
   * ---------------------------------------- */
  const handleSaveEdit = async (taskId, projectId, data) => {
    const pid = Number(projectId);
    const isProject = String(taskId).startsWith("proj");
    const tid = parseInt(String(taskId).replace("task-", ""), 10);

    try {
      if (isProject) {
        await updateProject(pid, data);
        updateProjectLocal(pid, data);
      } else {
        const updated = await updateTask(pid, tid, data);
        updateTaskLocal(tid, updated);
      }
      toast.success(isProject ? "프로젝트 수정 완료" : "업무 수정 완료");
    } catch (err) {
      console.error("❌ 수정 실패:", err);
      toast.error("수정 실패");
    }
  };

  return {
    handleStatusChange,
    handleDelete,
    handleSaveEdit,
  };
}
