// src/components/tasks/TaskDetailPanel/useTaskDetail.js
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useProjectDetailContext } from "../../../context/ProjectDetailContext";
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

export function useTaskDetail(taskId) {
  const { project, fetchTasks, updateTaskLocal } = useProjectDetailContext();

  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---------------------------
   * 데이터 로딩
   * --------------------------- */
  const fetchTask = useCallback(async () => {
    const data = await getTask(project.project_id, taskId);
    setTask(data);
  }, [project, taskId]);

  const fetchComments = useCallback(async () => {
    const data = await getComments(project.project_id, taskId);
    setComments(data);
  }, [project, taskId]);

  const fetchAttachments = useCallback(async () => {
    const data = await getAttachments(project.project_id, taskId);
    setAttachments(data);
  }, [project, taskId]);

  const fetchEmployees = useCallback(async () => {
    const data = await getEmployees();
    setEmployees(data);
  }, []);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([fetchTask(), fetchComments(), fetchAttachments(), fetchEmployees()]);
    } catch (err) {
      console.error("❌ 업무 상세 불러오기 실패:", err);
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
    if (!content.trim()) return toast.error("내용을 입력하세요.");
    await createComment(project.project_id, taskId, { content });
    toast.success("댓글이 등록되었습니다.");
    fetchComments();
  };

  const handleUpdateComment = async (commentId, content) => {
    if (!content.trim()) return toast.error("내용을 입력하세요.");
    await updateComment(project.project_id, taskId, commentId, { content });
    toast.success("댓글이 수정되었습니다.");
    fetchComments();
  };

  const handleDeleteComment = async commentId => {
    await deleteComment(project.project_id, taskId, commentId);
    setComments(prev => prev.filter(c => c.comment_id !== commentId));
    toast.success("댓글이 삭제되었습니다.");
  };

  /* ---------------------------
   * 첨부파일 관련
   * --------------------------- */
  const handleUploadFile = async file => {
    if (!file) return toast.error("파일을 선택하세요.");
    await uploadAttachment(project.project_id, taskId, file);
    toast.success("파일이 업로드되었습니다.");
    fetchAttachments();
  };

  const handleDeleteFile = async attachmentId => {
    await deleteAttachment(project.project_id, taskId, attachmentId);
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
    updateTaskLocal(taskId, { status: newStatus }); // ✅ 즉시 반영

    try {
      await updateTaskStatus(project.project_id, taskId, newStatus);
      toast.success("상태가 변경되었습니다.");
      await fetchTasks(); // 서버 동기화
    } catch (err) {
      console.error(err);
      toast.error("상태 변경 실패");
      setTask(prev => ({ ...prev, status: prevStatus }));
      updateTaskLocal(taskId, { status: prevStatus });
    }
  };

  const handleProgressChange = async progress => {
    if (isNaN(progress)) return;
    await updateTask(project.project_id, taskId, { progress });
    setTask(prev => ({ ...prev, progress }));
    updateTaskLocal(taskId, { progress });
    await fetchTasks();
  };

  /* ---------------------------
   * 수정 저장
   * --------------------------- */
  const handleSaveEdit = async payload => {
    try {
      const updated = await updateTask(project.project_id, taskId, payload);
      setTask(updated);
      updateTaskLocal(taskId, updated);
      toast.success("업무가 수정되었습니다.");
      await fetchTasks();
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
