import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import { deleteTask, updateTask, updateTaskStatus } from "../../../services/api/task";

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
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(null, taskId, newStatus);
      updateTaskLocal(taskId, { status: newStatus });
      toast.success(`상태가 ${newStatus}로 변경되었습니다.`);
    } catch {
      toast.error("상태 변경 실패");
    }
  };

  const handleDelete = async taskId => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await deleteTask(null, taskId);
      toast.success("업무가 삭제되었습니다.");
      fetchTasksByProject(); // 전역 새로고침
    } catch {
      toast.error("삭제 실패");
    }
  };

  const startEdit = task => {
    setEditingId(task.task_id);
    setEditForm({ title: task.title, description: task.description || "" });
  };
  const cancelEdit = () => setEditingId(null);

  const saveEdit = async taskId => {
    if (!editForm.title.trim()) return toast.error("제목을 입력하세요.");
    try {
      const updated = await updateTask(null, taskId, editForm);
      updateTaskLocal(taskId, updated);
      toast.success("업무가 수정되었습니다.");
      setEditingId(null);
    } catch {
      toast.error("업무 수정 실패");
    }
  };

  const toggleCollapse = taskId => {
    setCollapsedTasks(prev => {
      const next = new Set(prev);
      next.has(taskId) ? next.delete(taskId) : next.add(taskId);
      return next;
    });
  };

  /* ------------------------------
   * ✅ 상세 보기 (디테일 패널)
   * ------------------------------ */
  const onTaskClick = task => {
    setSelectedTask(task); // 🔍 패널 열기
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
    onTaskClick, // ✅ 디테일 패널 오픈 콜백
  };
}
