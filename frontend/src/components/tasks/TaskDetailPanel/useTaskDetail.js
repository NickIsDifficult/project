// src/components/tasks/TaskDetailPanel/useTaskDetail.js
import { debounce } from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import { getEmployees } from "../../../services/api/employee";
import { getProject } from "../../../services/api/project";
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
 * - 업무(taskId) + 프로젝트(projectId) 통합 지원
 * - TaskDetailPanel, Drawer에서 사용
 */
export function useTaskDetail(projectId, taskId) {
  const { fetchTasksByProject, updateTaskLocal } = useProjectGlobal();

  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ 직원 캐싱 방지용 ref
  const employeeCache = useRef(null);

  /* ------------------------------------
   * ✅ 상세 데이터 불러오기 (업무 or 프로젝트)
   * ------------------------------------ */
  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      let result;

      if (taskId) {
        // 🟢 업무 상세
        result = await getTask(projectId, taskId);
        const [c, a] = await Promise.all([
          getComments(projectId, taskId),
          getAttachments(projectId, taskId),
        ]);
        setComments(c);
        setAttachments(a);
      } else {
        // 🟡 프로젝트 상세
        result = await getProject(projectId);
        setComments([]);
        setAttachments([]);
        result.isProject = true;
      }

      // ✅ 직원 목록 (캐시 사용)
      if (!employeeCache.current) {
        employeeCache.current = await getEmployees();
      }
      setEmployees(employeeCache.current);

      setTask(result);
    } catch (err) {
      console.error("❌ 상세 불러오기 실패:", err);
      toast.error("상세 정보를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [projectId, taskId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ------------------------------------
   * 💬 댓글 관리
   * ------------------------------------ */
  const handleAddComment = async content => {
    if (!taskId || !content.trim()) return;
    try {
      const newComment = await createComment(projectId, taskId, { content });
      setComments(prev => [...prev, newComment]);
      toast.success("댓글이 추가되었습니다.");
    } catch {
      toast.error("댓글 추가 실패");
    }
  };

  const handleUpdateComment = async (commentId, content) => {
    if (!taskId) return;
    try {
      const updated = await updateComment(projectId, taskId, commentId, { content });
      setComments(prev => prev.map(c => (c.comment_id === commentId ? updated : c)));
      toast.success("댓글 수정 완료");
    } catch {
      toast.error("댓글 수정 실패");
    }
  };

  const handleDeleteComment = async commentId => {
    if (!taskId) return;
    try {
      await deleteComment(projectId, taskId, commentId);
      setComments(prev => prev.filter(c => c.comment_id !== commentId));
      toast.success("댓글 삭제 완료");
    } catch {
      toast.error("댓글 삭제 실패");
    }
  };

  /* ------------------------------------
   * 📎 첨부파일 관리
   * ------------------------------------ */
  const handleUploadFile = async file => {
    if (!taskId) return;
    try {
      await uploadAttachment(projectId, taskId, file);
      toast.success("파일 업로드 완료");
      const data = await getAttachments(projectId, taskId);
      setAttachments(data);
    } catch {
      toast.error("파일 업로드 실패");
    }
  };

  const handleDeleteFile = async attachmentId => {
    if (!taskId) return;
    try {
      await deleteAttachment(projectId, taskId, attachmentId);
      toast.success("파일 삭제 완료");
      const data = await getAttachments(projectId, taskId);
      setAttachments(data);
    } catch {
      toast.error("파일 삭제 실패");
    }
  };

  /* ------------------------------------
   * ⚙️ 상태 / 진행률 변경
   * ------------------------------------ */
  const handleStatusChange = async newStatus => {
    if (!taskId || !task) return;
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

  // ✅ 진행률 변경 (1초 디바운스)
  const debouncedUpdate = useCallback(
    debounce(async progress => {
      if (!taskId) return;
      try {
        await updateTask(projectId, taskId, { progress });
        toast.success("진행률 저장 완료", { id: "progress" });
        await fetchTasksByProject(projectId);
      } catch (err) {
        console.error("❌ 진행률 업데이트 실패:", err);
        toast.error("진행률 저장 실패", { id: "progress" });
      }
    }, 1000),
    [projectId, taskId, fetchTasksByProject],
  );

  const handleProgressChange = progress => {
    if (!taskId) return;
    setTask(prev => ({ ...prev, progress }));
    updateTaskLocal(taskId, prev => ({ ...prev, progress }));
    debouncedUpdate(progress);
  };

  /* ------------------------------------
   * ✏️ 업무 수정
   * ------------------------------------ */
  const handleSaveEdit = async payload => {
    if (!taskId) return;
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

  /* ------------------------------------
   * 📤 반환
   * ------------------------------------ */
  return {
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
  };
}
