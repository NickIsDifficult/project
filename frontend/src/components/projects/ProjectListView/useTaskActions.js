// src/components/projects/ProjectListView/useTaskActions.js
import toast from "react-hot-toast";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import { deleteProject, updateProject } from "../../../services/api/project";
import { deleteTask, updateTask, updateTaskStatus } from "../../../services/api/task";

/**
 * ✅ useTaskActions
 * - 프로젝트 / 업무의 CRUD 및 상태 변경 로직을 담당
 */
export function useTaskActions() {
  const { fetchTasksByProject, updateTaskLocal, updateProjectLocal } = useProjectGlobal();

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
   * 🗑️ 삭제
   * ---------------------------------------- */
  const handleDelete = async (taskId, projectId) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    const pid = Number(projectId);
    const tid = Number(taskId);
    const isProject = String(taskId).startsWith("proj");

    try {
      if (isProject) await deleteProject(pid);
      else await deleteTask(pid, tid);
      toast.success(isProject ? "프로젝트 삭제 완료" : "업무 삭제 완료");
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
    const tid = Number(taskId);
    const isProject = String(taskId).startsWith("proj");

    try {
      if (isProject) {
        await updateProject(pid, data);
        updateProjectLocal(pid, data); // ✅ 즉시 반영
      } else {
        const updated = await updateTask(pid, tid, data);
        updateTaskLocal(tid, updated); // ✅ 즉시 반영
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
