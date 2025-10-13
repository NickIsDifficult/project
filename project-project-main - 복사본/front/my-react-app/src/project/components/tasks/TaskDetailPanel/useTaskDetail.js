// src/components/tasks/TaskDetailPanel/useTaskDetail.js
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
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

export function useTaskDetail(projectId, taskId, onTasksChange) {
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---------------------------
   * 데이터 로딩
   * --------------------------- */
  const fetchTask = useCallback(async () => {
    const data = await getTask(projectId, taskId);
    setTask(data);
  }, [projectId, taskId]);

  const fetchComments = useCallback(async () => {
    const data = await getComments(projectId, taskId);
    setComments(data);
  }, [projectId, taskId]);

  const fetchAttachments = useCallback(async () => {
    const data = await getAttachments(projectId, taskId);
    setAttachments(data);
  }, [projectId, taskId]);

  const fetchEmployees = useCallback(async () => {
    const data = await getEmployees();
    setEmployees(data);
  }, []);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([fetchTask(), fetchComments(), fetchAttachments(), fetchEmployees()]);
    } catch (err) {
      console.error("업무 상세 불러오기 실패:", err);
      toast.error("업무 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [fetchTask, fetchComments, fetchAttachments, fetchEmployees]);

  useEffect(() => {
    if (taskId) reload();
  }, [reload, taskId]);

  /* ---------------------------
   * 댓글 관련
   * --------------------------- */
  const handleAddComment = async content => {
    await createComment(projectId, taskId, { content });
    toast.success("댓글이 등록되었습니다.");
    fetchComments();
  };

  const handleUpdateComment = async (commentId, content) => {
    await updateComment(projectId, taskId, commentId, { content });
    toast.success("댓글이 수정되었습니다.");
    fetchComments();
  };

  const handleDeleteComment = async commentId => {
    await deleteComment(projectId, taskId, commentId);
    setComments(prev => prev.filter(c => c.comment_id !== commentId));
    toast.success("댓글이 삭제되었습니다.");
  };

  /* ---------------------------
   * 첨부파일 관련
   * --------------------------- */
  const handleUploadFile = async file => {
    await uploadAttachment(projectId, taskId, file);
    toast.success("파일이 업로드되었습니다.");
    fetchAttachments();
  };

  const handleDeleteFile = async attachmentId => {
    await deleteAttachment(projectId, taskId, attachmentId);
    toast.success("파일이 삭제되었습니다.");
    fetchAttachments();
  };

  /* ---------------------------
   * 상태 / 진행률 변경
   * --------------------------- */
  const handleStatusChange = async newStatus => {
    if (!task) return;

    const prevStatus = task.status;
    setTask(prev => ({ ...prev, status: newStatus }));

    try {
      await updateTaskStatus(projectId, taskId, newStatus);
      toast.success("상태가 변경되었습니다.");
      await onTasksChange?.(); // ✅ 상위 tasks 리로드
    } catch (err) {
      console.error(err);
      toast.error("상태 변경 실패");
      setTask(prev => ({ ...prev, status: prevStatus }));
    }
  };

  const handleProgressChange = async progress => {
    await updateTask(projectId, taskId, { progress });
    setTask(prev => ({ ...prev, progress }));
    await onTasksChange?.(); // ✅ 진행률 변경 후 상위 갱신
  };

  /* ---------------------------
   * 수정 저장
   * --------------------------- */
  const handleSaveEdit = async payload => {
    try {
      const updated = await updateTask(projectId, taskId, payload);
      setTask(updated);
      toast.success("업무가 수정되었습니다.");

      // ✅ 모든 뷰에 반영
      await onTasksChange?.();
    } catch (err) {
      console.error(err);
      toast.error("업무 수정 실패");
    }
  };

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
