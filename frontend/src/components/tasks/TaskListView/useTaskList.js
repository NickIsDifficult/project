import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import { deleteProject, updateProject } from "../../../services/api/project";
import { deleteTask, updateTask, updateTaskStatus } from "../../../services/api/task";

/**
 * ✅ useTaskList (프로젝트/업무 통합형)
 * - 프로젝트와 업무 모두 동일 인터페이스로 관리
 * - 필터, 정렬, 상태변경, 수정, 삭제, 상세보기 등 포함
 */
export function useTaskList({ allTasks = [] }) {
  const { fetchTasksByProject, updateTaskLocal, setSelectedTask } = useProjectGlobal();

  const [tasks, setTasks] = useState([...allTasks]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", description: "" });
  const [collapsedTasks, setCollapsedTasks] = useState(new Set());

  /* -------------------------------------------
   * 🧩 데이터 동기화
   * ------------------------------------------- */
  useEffect(() => {
    setTasks([...allTasks]);
  }, [allTasks]);

  /* -------------------------------------------
   * 🔍 필터 / 정렬 / 검색
   * ------------------------------------------- */
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterAssignee, setFilterAssignee] = useState("ALL");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [sortBy, setSortBy] = useState("start_date");
  const [sortOrder, setSortOrder] = useState("asc");

  const assigneeOptions = useMemo(() => {
    const set = new Set();
    tasks.forEach(t => t.assignee_name && set.add(t.assignee_name));
    return ["ALL", ...Array.from(set)];
  }, [tasks]);

  const handleSort = key => {
    if (sortBy === key) setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
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

  /* -------------------------------------------
   * 📊 상태 요약
   * ------------------------------------------- */
  const stats = useMemo(() => {
    const total = tasks.length;
    const counts = { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, DONE: 0 };
    tasks.forEach(t => {
      const key = t.status || "TODO";
      counts[key] = (counts[key] || 0) + 1;
    });
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

  /* -------------------------------------------
   * 🧭 상태 변경 / 수정 / 삭제
   * ------------------------------------------- */

  // ✅ 상태 변경
  const handleStatusChange = async (task, newStatus) => {
    if (!task) return;

    const projectId = Number(task.project_id);
    const taskId = Number(task.task_id);
    const isProject = !!task.isProject;

    try {
      if (isProject) {
        await updateProject(projectId, { status: newStatus });
        toast.success("프로젝트 상태가 변경되었습니다.");
      } else {
        await updateTaskStatus(projectId, taskId, newStatus);
        updateTaskLocal(taskId, { ...task, status: newStatus });
        toast.success("업무 상태가 변경되었습니다.");
      }
      await fetchTasksByProject(projectId);
    } catch (err) {
      console.error("❌ 상태 변경 실패:", err);
      toast.error("상태 변경 실패");
    }
  };

  // ✅ 삭제
  const handleDelete = async (taskId, projectId) => {
    if (!projectId && !taskId) return;
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    const numericPid = Number(projectId);
    const numericTid = Number(taskId);

    try {
      // 프로젝트
      if (!numericTid || String(taskId).startsWith("proj")) {
        await deleteProject(numericPid);
        toast.success("프로젝트가 삭제되었습니다.");
      } else {
        await deleteTask(numericPid, numericTid);
        toast.success("업무가 삭제되었습니다.");
      }
      await fetchTasksByProject(numericPid);
    } catch (err) {
      console.error("❌ 삭제 실패:", err);
      toast.error("삭제 실패");
    }
  };

  // ✅ 수정 시작
  const startEdit = task => {
    setEditingId(task.task_id || task.project_id);
    setEditForm({
      title: task.title || "",
      description: task.description || "",
    });
  };

  const cancelEdit = () => setEditingId(null);

  // ✅ 수정 저장
  const saveEdit = async (taskId, projectId) => {
    if (!editForm.title.trim()) return toast.error("제목을 입력하세요.");
    const isProject = !taskId || String(taskId).startsWith("proj");

    try {
      if (isProject) {
        await updateProject(Number(projectId), editForm);
        toast.success("프로젝트가 수정되었습니다.");
      } else {
        const updated = await updateTask(Number(projectId), Number(taskId), editForm);
        updateTaskLocal(taskId, updated);
        toast.success("업무가 수정되었습니다.");
      }

      setEditingId(null);
      await fetchTasksByProject(Number(projectId));
    } catch (err) {
      console.error("❌ 수정 실패:", err);
      toast.error("수정 실패");
    }
  };

  // ✅ 트리 접기/펼치기
  const toggleCollapse = id => {
    setCollapsedTasks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /* -------------------------------------------
   * 📋 상세 보기 (프로젝트/업무)
   * ------------------------------------------- */
  const onTaskClick = task => {
    if (!task) return;
    setSelectedTask(task);
  };

  /* -------------------------------------------
   * 📤 반환
   * ------------------------------------------- */
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
