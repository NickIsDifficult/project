// src/hooks/useProjectDetail.js
import { debounce } from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useProjectGlobal } from "../context/ProjectGlobalContext";
import { getEmployees } from "../services/api/employee";
import { getProject } from "../services/api/project";
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
} from "../services/api/task";

/* =============================
 * 🧩 날짜 및 Task 정규화 유틸
 * ============================= */
const toDateInput = v => {
  if (!v) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "string") return v.slice(0, 10);
  return "";
};

const normalizeTask = t => ({
  ...t,
  start_date: toDateInput(t.start_date),
  end_date: toDateInput(t.end_date ?? t.due_date),
});

/**
 * ✅ useProjectDetail (프로젝트 + 업무 상세 통합 훅)
 */
export function useProjectDetail(projectId, taskId = null) {
  const { fetchTasksByProject, updateTaskLocal } = useProjectGlobal();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ 전역 캐시
  const employeeCache = useRef(null);
  const isFetchingRef = useRef(false);

  /* =============================
   * 📡 데이터 불러오기
   * ============================= */
  const fetchData = useCallback(async () => {
    if (!projectId) return;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);

    try {
      if (taskId) {
        // ✅ 업무 상세
        const taskData = await getTask(projectId, taskId);
        setTask(normalizeTask(taskData));

        // ✅ 댓글 & 첨부파일 병렬
        const [commentData, attachData] = await Promise.allSettled([
          getComments(projectId, taskId),
          getAttachments(projectId, taskId),
        ]);
        if (commentData.status === "fulfilled") setComments(commentData.value || []);
        if (attachData.status === "fulfilled") setAttachments(attachData.value || []);
      } else {
        // ✅ 프로젝트 전체 상세
        const projectData = await getProject(projectId);
        setProject(projectData);
        setTasks(Array.isArray(projectData.task) ? projectData.task.map(normalizeTask) : []);
        setComments([]);
        setAttachments([]);
      }

      // ✅ 직원 목록 (캐시)
      if (!employeeCache.current) {
        const list = await getEmployees();
        employeeCache.current = list;
        setEmployees(list);
      } else {
        setEmployees(employeeCache.current);
      }
    } catch (err) {
      if (err?.response?.status !== 404) toast.error("상세 정보를 불러올 수 없습니다.");
      console.error("❌ fetchData 실패:", err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [projectId, taskId]);

  /* =============================
   * 🔁 자동 갱신
   * ============================= */
  useEffect(() => {
    fetchData();
    return () => {
      setTask(null);
      setComments([]);
      setAttachments([]);
    };
  }, [fetchData, projectId, taskId]);

  /* =============================
   * 💬 댓글 관리
   * ============================= */
  const handleAddComment = async content => {
    if (!taskId || !content.trim()) return;
    try {
      const newC = await createComment(projectId, taskId, { content });
      setComments(prev => [...prev, newC]);
      toast.success("댓글이 추가되었습니다.");
    } catch (err) {
      console.error("❌ 댓글 추가 실패:", err);
      toast.error("댓글 추가 실패");
    }
  };

  const handleEditComment = async (commentId, content) => {
    if (!taskId || !content.trim()) return;
    try {
      const updated = await updateComment(projectId, taskId, commentId, { content });
      setComments(prev => prev.map(c => (c.comment_id === commentId ? updated : c)));
      toast.success("댓글이 수정되었습니다.");
    } catch (err) {
      console.error("❌ 댓글 수정 실패:", err);
      toast.error("댓글 수정 실패");
    }
  };

  const handleDeleteComment = async commentId => {
    if (!taskId) return;
    try {
      await deleteComment(projectId, taskId, commentId);
      setComments(prev => prev.filter(c => c.comment_id !== commentId));
      toast.success("댓글이 삭제되었습니다.");
    } catch (err) {
      console.error("❌ 댓글 삭제 실패:", err);
      toast.error("댓글 삭제 실패");
    }
  };

  /* =============================
   * 📎 첨부파일 관리
   * ============================= */
  const handleUploadFile = async file => {
    if (!projectId || !file) return;
    try {
      await uploadAttachment(projectId, taskId, file);
      const data = await getAttachments(projectId, taskId);
      setAttachments(data || []);
      toast.success("📎 파일 업로드 완료");
    } catch (err) {
      console.error("❌ 파일 업로드 실패:", err);
      toast.error("파일 업로드 실패");
    }
  };

  const handleDeleteFile = async attachmentId => {
    if (!projectId || !attachmentId) return;
    try {
      await deleteAttachment(projectId, taskId, attachmentId);
      const data = await getAttachments(projectId, taskId);
      setAttachments(data || []);
      toast.success("📎 파일 삭제 완료");
    } catch (err) {
      console.error("❌ 파일 삭제 실패:", err);
      toast.error("파일 삭제 실패");
    }
  };

  /* =============================
   * ⚙️ 상태 / 진행률 변경
   * ============================= */
  const handleStatusChange = async newStatus => {
    if (!taskId || !task) return;
    const prevStatus = task.status;
    setTask(prev => ({ ...prev, status: newStatus }));
    updateTaskLocal(taskId, { status: newStatus });

    try {
      await updateTaskStatus(projectId, taskId, newStatus);
      toast.success("상태가 변경되었습니다.");
    } catch (err) {
      console.error("❌ 상태 변경 실패:", err);
      setTask(prev => ({ ...prev, status: prevStatus }));
      updateTaskLocal(taskId, { status: prevStatus });
      toast.error("상태 변경 실패");
    }
  };

  const debouncedProgress = useCallback(
    debounce(async (progressValue, pid, tid) => {
      try {
        await updateTask(pid, tid, { progress: progressValue });
      } catch (err) {
        console.error("❌ 진행률 업데이트 실패:", err);
      }
    }, 600),
    [],
  );

  const handleProgressChange = progressValue => {
    if (!taskId) return;
    setTask(prev => ({ ...prev, progress: progressValue }));
    updateTaskLocal(taskId, { progress: progressValue });
    debouncedProgress(progressValue, projectId, taskId);
  };

  /* =============================
   * ✏️ 업무 저장 / 편집
   * ============================= */
  const handleSaveEdit = async payload => {
    if (!taskId) return null;
    try {
      // ✅ 저장 시 end_date → due_date 변환
      const normalizedOut = {
        ...payload,
        due_date: payload.due_date ?? payload.end_date ?? null,
      };
      delete normalizedOut.end_date;

      const updated = await updateTask(projectId, taskId, normalizedOut);

      // ✅ 다시 화면 표시용 end_date 세팅
      const normalizedIn = normalizeTask(updated);
      setTask(normalizedIn);
      updateTaskLocal(taskId, normalizedIn);

      toast.success("업무 수정 완료");
      return normalizedIn;
    } catch (err) {
      console.error("❌ 업무 저장 실패:", err);
      toast.error("저장 실패");
      throw err;
    }
  };

  /* =============================
   * 🔁 재로딩
   * ============================= */
  const reload = useCallback(fetchData, [fetchData]);

  /* =============================
   * 📤 반환
   * ============================= */
  return {
    project,
    tasks,
    task,
    comments,
    attachments,
    employees,
    loading,
    reload,
    handleAddComment,
    handleEditComment,
    handleDeleteComment,
    handleUploadFile,
    handleDeleteFile,
    handleStatusChange,
    handleProgressChange,
    handleSaveEdit,
  };
}
