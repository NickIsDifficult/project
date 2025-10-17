// src/components/tasks/TaskDetailPanel/useTaskDetail.js
import { debounce } from "lodash";
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

/**
 * ✅ useTaskDetail
 * 개별 업무(Task)의 상세 데이터, 댓글, 첨부파일 관리 훅
 * - ProjectDetailContext와 완전히 연동됨
 * - 로컬/서버 양방향 동기화
 */
export function useTaskDetail(taskId) {
  const { project, fetchTasks, updateTaskLocal } = useProjectDetailContext();

  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ----------------------------------------
   * ✅ 데이터 로딩
   * ---------------------------------------- */
  const fetchTask = useCallback(async () => {
    const data = await getTask(project.project_id, taskId);
    setTask(data);
    return data;
  }, [project, taskId]);

  const fetchComments = useCallback(async () => {
    const data = await getComments(project.project_id, taskId);
    setComments(data);
    return data;
  }, [project, taskId]);

  const fetchAttachments = useCallback(async () => {
    const data = await getAttachments(project.project_id, taskId);
    setAttachments(data);
    return data;
  }, [project, taskId]);

  const fetchEmployees = useCallback(async () => {
    const data = await getEmployees();
    setEmployees(data);
    return data;
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

  /* ----------------------------------------
   * 💬 댓글 관련 핸들러
   * ---------------------------------------- */
  const handleAddComment = async content => {
    if (!content.trim()) return null;

    try {
      // 백엔드에서 author_name 포함된 댓글 반환
      const newComment = await createComment(project.project_id, taskId, { content });
      if (newComment) {
        setComments(prev => [...prev, newComment]); // 즉시 반영
        return newComment; // ✅ 댓글만 반환 (toast 없음)
      }
      return null;
    } catch (err) {
      console.error("❌ 댓글 등록 실패:", err);
      return null;
    }
  };

  const handleUpdateComment = async (commentId, content) => {
    if (!content.trim()) return null;

    try {
      const updated = await updateComment(project.project_id, taskId, commentId, { content });
      if (updated) {
        setComments(prev => prev.map(c => (c.comment_id === commentId ? updated : c)));
        return updated;
      }
      return null;
    } catch (err) {
      console.error("❌ 댓글 수정 실패:", err);
      return null;
    }
  };

  const handleDeleteComment = async commentId => {
    await deleteComment(project.project_id, taskId, commentId);
    setComments(prev => prev.filter(c => c.comment_id !== commentId));
  };

  /* ----------------------------------------
   * 📎 첨부파일 관련 핸들러
   * ---------------------------------------- */
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

  /* ----------------------------------------
   * ⚙️ 상태 / 진행률 변경
   * ---------------------------------------- */
  /* ✅ 디바운스된 fetchTasks 래퍼 생성 */
  const debouncedFetchTasks = useCallback(
    debounce(() => {
      fetchTasks(); // 여러 호출이 들어와도 0.8초에 한 번만 실행
    }, 800),
    [fetchTasks],
  );

  /* ✅ 상태 변경 */
  const handleStatusChange = async newStatus => {
    if (!task) return;
    const prevStatus = task.status;

    setTask(prev => ({ ...prev, status: newStatus }));
    updateTaskLocal(taskId, { status: newStatus });

    try {
      await updateTaskStatus(project.project_id, taskId, newStatus);
      toast.success("상태가 변경되었습니다.");
      await fetchTasks();
    } catch (err) {
      console.error(err);
      toast.error("상태 변경 실패");
      setTask(prev => ({ ...prev, status: prevStatus }));
      updateTaskLocal(taskId, { status: prevStatus });
    }
  };

  /* ✅ 진행률 변경용 디바운스 서버 호출 */
  const debouncedProgressUpdate = useCallback(
    debounce(async newProgress => {
      try {
        await updateTask(project.project_id, taskId, { progress: newProgress });
        toast.success("진행률이 저장되었습니다.");
        debouncedFetchTasks(); // ✅ 여기서도 디바운스된 fetch
      } catch (err) {
        console.error("❌ 진행률 변경 실패:", err);
        toast.error("진행률 저장 실패");
      }
    }, 800),
    [project.project_id, taskId, debouncedFetchTasks],
  );

  /* ✅ 진행률 변경 (로컬 즉시 반영 + 서버 디바운스) */
  const handleProgressChange = useCallback(
    progress => {
      if (isNaN(progress)) return;
      setTask(prev => ({ ...prev, progress }));
      updateTaskLocal(taskId, { progress });

      // ✅ 서버 반영을 디바운스로 제한
      debouncedProgressUpdate(progress);
    },
    [taskId, updateTaskLocal, debouncedProgressUpdate],
  );

  /* ✅ cleanup (컴포넌트 언마운트 시 디바운스 취소) */
  useEffect(() => {
    return () => {
      debouncedProgressUpdate.cancel();
      debouncedFetchTasks.cancel();
    };
  }, [debouncedProgressUpdate, debouncedFetchTasks]);

  /* ----------------------------------------
   * ✏️ 업무 수정 저장
   * ---------------------------------------- */
  const handleSaveEdit = async payload => {
    try {
      const updated = await updateTask(project.project_id, taskId, payload);
      setTask(updated);
      updateTaskLocal(taskId, updated); // ✅ Context에 즉시 반영
      toast.success("업무가 수정되었습니다.");
      await fetchTasks();
      return updated; // ✅ Panel에서 활용 가능
    } catch (err) {
      console.error(err);
      toast.error("업무 수정 실패");
      return null;
    }
  };

  /* ----------------------------------------
   * 📤 반환
   * ---------------------------------------- */
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
