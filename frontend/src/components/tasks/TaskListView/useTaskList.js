import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import { deleteProject, updateProject } from "../../../services/api/project";
import { deleteTask, updateTask, updateTaskStatus } from "../../../services/api/task";

/**
 * ✅ useTaskList (프로젝트/업무 통합형)
 * - 프로젝트도 업무와 동일하게 상태 변경, 수정, 삭제, 상세 보기 가능
 */
export function useTaskList({ allTasks = [] }) {
  const { fetchTasksByProject, updateTaskLocal, setSelectedTask } = useProjectGlobal();

  const [tasks, setTasks] = useState(allTasks);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", description: "" });
  const [collapsedTasks, setCollapsedTasks] = useState(new Set());

  /* ------------------------------
   * ✅ 동기화
   * ------------------------------ */
  useEffect(() => setTasks(allTasks), [allTasks]);

  /* ------------------------------
   * ✅ 필터 / 정렬 / 검색
   * ------------------------------ */
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterAssignee, setFilterAssignee] = useState("ALL");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [sortBy, setSortBy] = useState("start_date");
  const [sortOrder, setSortOrder] = useState("asc");

  const assigneeOptions = useMemo(() => {
    const set = new Set();
    tasks.forEach(t => {
      if (t.assignee_name) set.add(t.assignee_name);
    });
    return ["ALL", ...Array.from(set)];
  }, [tasks]);

  const handleSort = key => {
    if (sortBy === key) setSortOrder(p => (p === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };

  const filteredTasks = useMemo(() => {
    const match = t => {
      const status = t.status?.trim()?.toUpperCase?.() || "TODO";
      const statusOk = filterStatus === "ALL" || status === filterStatus;
      const assigneeOk = filterAssignee === "ALL" || t.assignee_name === filterAssignee;
      const keywordOk =
        !searchKeyword || t.title.toLowerCase().includes(searchKeyword.toLowerCase());
      return statusOk && assigneeOk && keywordOk;
    };

    const filtered = tasks.filter(match);

    const sorted = filtered.sort((a, b) => {
      const valA = a[sortBy] ?? "";
      const valB = b[sortBy] ?? "";
      if (sortBy.includes("date")) {
        const dateA = valA ? new Date(valA) : new Date(0);
        const dateB = valB ? new Date(valB) : new Date(0);
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else {
        return sortOrder === "asc"
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      }
    });

    return sorted;
  }, [tasks, filterStatus, filterAssignee, searchKeyword, sortBy, sortOrder]);

  /* ------------------------------
   * ✅ 상태 요약
   * ------------------------------ */
  const stats = useMemo(() => {
    const total = tasks.length;
    const counts = { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, DONE: 0 };
    tasks.forEach(t => (counts[t.status] = (counts[t.status] || 0) + 1));
    const doneRatio = total ? ((counts.DONE / total) * 100).toFixed(1) : 0;
    return { total, ...counts, doneRatio };
  }, [tasks]);

  const resetFilters = () => {
    setFilterStatus("ALL");
    setFilterAssignee("ALL");
    setSearchKeyword("");
    setSortBy("start_date");
    setSortOrder("asc");
  };

  const handleStatusFilter = key => setFilterStatus(prev => (prev === key ? "ALL" : key));

  /* ------------------------------
   * ✅ 상태 변경 / 수정 / 삭제
   * ------------------------------ */

  // ✅ 상태 변경 (프로젝트도 허용)
  const handleStatusChange = async (task, newStatus) => {
    if (!task) return;
    const taskId = task.task_id;
    const projectId = task.project_id || task.projectId || taskId;

    try {
      // ✅ 프로젝트인 경우
      if (task.isProject) {
        await updateProject(Number(projectId), { status: newStatus });
        toast.success("프로젝트 상태가 변경되었습니다.");
      }
      // ✅ 일반 업무인 경우
      else {
        await updateTaskStatus(Number(projectId), Number(taskId), newStatus);
        updateTaskLocal(taskId, { ...task, status: newStatus });
        toast.success("업무 상태가 변경되었습니다.");
      }

      await fetchTasksByProject(Number(projectId));
    } catch (err) {
      console.error("❌ 상태 변경 실패:", err);
      toast.error("상태 변경 실패");
    }
  };

  // ✅ 삭제 (프로젝트/업무 모두 지원)
  const handleDelete = async (taskId, projectId) => {
    const id = taskId || projectId;
    if (!id) return;
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      if (String(taskId).startsWith("project-") || !taskId) {
        await deleteProject(projectId);
        toast.success("프로젝트가 삭제되었습니다.");
      } else {
        await deleteTask(projectId, taskId);
        toast.success("업무가 삭제되었습니다.");
      }
      await fetchTasksByProject(projectId);
    } catch (err) {
      console.error("❌ 삭제 실패:", err);
      toast.error("삭제 실패");
    }
  };

  // ✅ 수정
  const startEdit = task => {
    const id = task.task_id || task.project_id;
    setEditingId(id);
    setEditForm({
      title: task.title,
      description: task.description || "",
    });
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (taskId, projectId) => {
    const id = taskId || projectId;
    if (!editForm.title.trim()) return toast.error("제목을 입력하세요.");

    try {
      if (String(taskId).startsWith("project-") || !taskId) {
        await updateProject(projectId, editForm);
        toast.success("프로젝트가 수정되었습니다.");
      } else {
        const updated = await updateTask(projectId, taskId, editForm);
        updateTaskLocal(taskId, updated);
        toast.success("업무가 수정되었습니다.");
      }
      setEditingId(null);
      await fetchTasksByProject(projectId);
    } catch (err) {
      console.error("❌ 수정 실패:", err);
      toast.error("수정 실패");
    }
  };

  // ✅ 트리 접기 / 펼치기
  const toggleCollapse = taskId => {
    setCollapsedTasks(prev => {
      const next = new Set(prev);
      next.has(taskId) ? next.delete(taskId) : next.add(taskId);
      return next;
    });
  };

  /* ------------------------------
   * ✅ 상세 보기
   * ------------------------------ */
  const onTaskClick = task => {
    const id = task.task_id || task.project_id;
    if (!id) return;
    setSelectedTask(task);
  };

  /* ------------------------------
   * 📤 반환
   * ------------------------------ */
  return {
    loading,
    filteredTasks,
    stats,
    assigneeOptions,
    editingId,
    editForm,
    collapsedTasks,
    filterStatus,
    filterAssignee,
    searchKeyword,
    sortBy,
    sortOrder,
    setSearchKeyword,
    setFilterAssignee,
    handleSort,
    resetFilters,
    handleStatusFilter,
    handleStatusChange,
    handleDelete,
    startEdit,
    cancelEdit,
    saveEdit,
    toggleCollapse,
    setEditForm,
    onTaskClick,
  };
}
