// src/components/tasks/TaskDetailPanel/useTaskDetail.js
import { debounce } from "lodash";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import { getEmployees } from "../../../services/api/employee";
import {
  createComment,
  deleteAttachment,
  deleteComment,
  getAttachments,
  getComments,
  getTask,
  updateComment,
  updateTask,
  updateTaskStatus,
  uploadAttachment,
} from "../../../services/api/task";

/**
 * ✅ useTaskDetail (전역형)
 * - ProjectGlobalContext 기반
 * - taskId + projectId 로 동작
 * - 댓글 / 첨부 / 상태 / 진행률 / 수정 관리
 */
export function useTaskDetail(projectId, taskId) {
  const { fetchTasksByProject, updateTaskLocal } = useProjectGlobal();

  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  /* -------------------------------
   * ✅ 데이터 불러오기
   * ------------------------------- */
  const fetchTask = useCallback(async () => {
    try {
      const data = await getTask(projectId, taskId);
      setTask(data);
      return data;
    } catch (err) {
      console.error("❌ 업무 상세 불러오기 실패:", err);
      toast.error("업무 정보를 불러올 수 없습니다.");
    }
  }, [projectId, taskId]);

  const fetchComments = useCallback(async () => {
    try {
      const data = await getComments(projectId, taskId);
      setComments(data);
      return data;
    } catch {
      toast.error("댓글을 불러올 수 없습니다.");
    }
  }, [projectId, taskId]);

  const fetchAttachments = useCallback(async () => {
    try {
      const data = await getAttachments(projectId, taskId);
      setAttachments(data);
      return data;
    } catch {
      toast.error("첨부파일을 불러올 수 없습니다.");
    }
  }, [projectId, taskId]);

  const fetchEmployees = useCallback(async () => {
    try {
      const data = await getEmployees();
      setEmployees(data);
      return data;
    } catch {
      console.warn("⚠️ 직원 목록 불러오기 실패 (선택적 데이터)");
    }
  }, []);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([fetchTask(), fetchComments(), fetchAttachments(), fetchEmployees()]);
    } catch (err) {
      console.error("❌ 업무 상세 초기화 실패:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchTask, fetchComments, fetchAttachments, fetchEmployees]);

  useEffect(() => {
    if (projectId && taskId) reload();
  }, [reload, projectId, taskId]);

  /* -------------------------------
   * 💬 댓글 관리
   * ------------------------------- */
  const handleAddComment = async content => {
    if (!content.trim()) return;
    try {
      const newComment = await createComment(projectId, taskId, { content });
      setComments(prev => [...prev, newComment]);
      toast.success("댓글이 추가되었습니다.");
    } catch {
      toast.error("댓글 추가 실패");
    }
  };

  const handleUpdateComment = async (commentId, content) => {
    try {
      const updated = await updateComment(projectId, taskId, commentId, { content });
      setComments(prev => prev.map(c => (c.comment_id === commentId ? updated : c)));
      toast.success("댓글 수정 완료");
    } catch {
      toast.error("댓글 수정 실패");
    }
  };

  const handleDeleteComment = async commentId => {
    try {
      await deleteComment(projectId, taskId, commentId);
      setComments(prev => prev.filter(c => c.comment_id !== commentId));
      toast.success("댓글 삭제 완료");
    } catch {
      toast.error("댓글 삭제 실패");
    }
  };

  /* -------------------------------
   * 📎 첨부파일 관리
   * ------------------------------- */
  const handleUploadFile = async file => {
    try {
      await uploadAttachment(projectId, taskId, file);
      toast.success("파일 업로드 완료");
      await fetchAttachments();
    } catch {
      toast.error("파일 업로드 실패");
    }
  };

  const handleDeleteFile = async attachmentId => {
    try {
      await deleteAttachment(projectId, taskId, attachmentId);
      toast.success("파일 삭제 완료");
      await fetchAttachments();
    } catch {
      toast.error("파일 삭제 실패");
    }
  };

  /* -------------------------------
   * ⚙️ 상태 / 진행률 변경
   * ------------------------------- */
  const handleStatusChange = async newStatus => {
    if (!task) return;
    const prevStatus = task.status;
    setTask(prev => ({ ...prev, status: newStatus }));
    updateTaskLocal(taskId, { ...task, status: newStatus });

    try {
      await updateTaskStatus(projectId, taskId, newStatus);
      toast.success("상태 변경 완료");
      await fetchTasksByProject(projectId);
    } catch (err) {
      toast.error("상태 변경 실패");
      setTask(prev => ({ ...prev, status: prevStatus }));
      updateTaskLocal(taskId, { ...task, status: prevStatus });
    }
  };

  // ✅ 진행률 변경 - 1초 디바운스
  const debouncedUpdate = useCallback(
    debounce(async progress => {
      try {
        await updateTask(projectId, taskId, { progress });
        toast.success("진행률 저장 완료", { id: "progress-toast" });
        await fetchTasksByProject(projectId);
      } catch (err) {
        console.error("❌ 진행률 업데이트 실패:", err);
        toast.error("진행률 저장 실패", { id: "progress-toast" });
      }
    }, 1000),
    [projectId, taskId, fetchTasksByProject],
  );

  const handleProgressChange = progress => {
    setTask(prev => ({ ...prev, progress }));
    updateTaskLocal(taskId, { ...task, progress });
    debouncedUpdate(progress);
  };

  /* -------------------------------
   * ✏️ 업무 수정 (편집 저장)
   * ------------------------------- */
  const handleSaveEdit = async payload => {
    try {
      const updated = await updateTask(projectId, taskId, payload);
      setTask(updated);
      updateTaskLocal(taskId, updated);
      toast.success("업무 수정 완료");
      await fetchTasksByProject(projectId);
      return updated;
    } catch (err) {
      console.error("❌ 업무 수정 실패:", err);
      toast.error("업무 수정 실패");
      return null;
    }
  };

  /* -------------------------------
   * 📤 반환 (TaskDetailPanel에서 사용)
   * ------------------------------- */
  return {
    task,
    comments,
    attachments,
    employees,
    loading,
    reload,
    handleAddComment,
    handleUpdateComment,
    handleDeleteComment,
    handleUploadFile,
    handleDeleteFile,
    handleStatusChange,
    handleProgressChange,
    handleSaveEdit,
  };
}
