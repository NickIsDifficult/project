// src/components/tasks/TaskListView/useTaskList.js
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { deleteTask, updateTask, updateTaskStatus } from "../../../services/api/task";

// 기존 ListView의 로직(필터/정렬/검색/통계/편집/접기/상태변경/삭제)을 훅으로 이전했습니다:contentReference[oaicite:1]{index=1}.
const STATUS_LABELS = {
  TODO: "할 일",
  IN_PROGRESS: "진행 중",
  REVIEW: "검토 중",
  DONE: "완료",
};

export function useTaskList({ projectId, initialTasks, onTasksChange, onTaskClick }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", description: "" });
  const [collapsedTasks, setCollapsedTasks] = useState(new Set());

  // 필터/정렬/검색
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterAssignee, setFilterAssignee] = useState("ALL");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [sortBy, setSortBy] = useState("start_date");
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => setTasks(initialTasks), [initialTasks]);

  // 담당자 옵션 계산:contentReference[oaicite:2]{index=2}
  const assigneeOptions = useMemo(() => {
    const set = new Set();
    const walk = list => {
      list.forEach(t => {
        if (t.assignee_name) set.add(t.assignee_name);
        if (t.subtasks?.length) walk(t.subtasks);
      });
    };
    walk(initialTasks);
    return ["ALL", ...Array.from(set)];
  }, [initialTasks]);

  // 정렬 핸들러:contentReference[oaicite:3]{index=3}
  const handleSort = key => {
    if (sortBy === key) setSortOrder(p => (p === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };

  // 필터 + 정렬:contentReference[oaicite:4]{index=4}
  const filteredTasks = useMemo(() => {
    const match = t => {
      const status = t.status?.trim()?.toUpperCase?.() || "TODO";
      const statusOk = filterStatus === "ALL" || status === filterStatus;
      const assigneeOk = filterAssignee === "ALL" || t.assignee_name === filterAssignee;
      const keywordOk =
        !searchKeyword || t.title.toLowerCase().includes(searchKeyword.toLowerCase());
      return statusOk && assigneeOk && keywordOk;
    };

    const walk = list =>
      list
        .map(t => ({ ...t, subtasks: t.subtasks ? walk(t.subtasks) : [] }))
        .filter(t => match(t) || t.subtasks?.length > 0);

    const filtered = walk(tasks);

    const sorted = filtered.sort((a, b) => {
      const valA = a[sortBy] ?? "";
      const valB = b[sortBy] ?? "";
      if (sortBy === "status") {
        const order = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
        return (order.indexOf(valA) - order.indexOf(valB)) * (sortOrder === "asc" ? 1 : -1);
      } else if (sortBy.includes("date")) {
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

  // 상태 요약(완료율/카운트):contentReference[oaicite:5]{index=5}
  const stats = useMemo(() => {
    const flat = [];
    const flatten = list => {
      list.forEach(t => {
        flat.push(t);
        if (t.subtasks?.length) flatten(t.subtasks);
      });
    };
    flatten(tasks);
    const total = flat.length;
    const counts = { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, DONE: 0 };
    flat.forEach(t => (counts[t.status] = (counts[t.status] || 0) + 1));
    const doneRatio = total ? ((counts.DONE / total) * 100).toFixed(1) : 0;
    return { total, ...counts, doneRatio };
  }, [tasks]);

  // 필터 바 초기화:contentReference[oaicite:6]{index=6}
  const resetFilters = () => {
    setFilterStatus("ALL");
    setFilterAssignee("ALL");
    setSearchKeyword("");
    setSortBy("start_date");
    setSortOrder("asc");
  };

  // 상태 필터 토글:contentReference[oaicite:7]{index=7}
  const handleStatusFilter = key => setFilterStatus(prev => (prev === key ? "ALL" : key));

  // 상태 변경:contentReference[oaicite:8]{index=8}
  const handleStatusChange = async (taskId, newStatus) => {
    // ✅ 1) UI 먼저 즉시 갱신
    setTasks(prev => prev.map(t => (t.task_id === taskId ? { ...t, status: newStatus } : t)));

    try {
      await updateTaskStatus(projectId, taskId, newStatus);
      toast.success(`상태가 '${STATUS_LABELS[newStatus]}'로 변경되었습니다.`);
      await onTasksChange?.();
    } catch (err) {
      console.error(err);
      toast.error("상태 변경 실패");

      // ❌ 2) 실패 시 롤백
      setTasks(prev =>
        prev.map(t =>
          t.task_id === taskId
            ? { ...t, status: prev.find(x => x.task_id === taskId)?.status || "TODO" }
            : t,
        ),
      );
    }
  };

  // 삭제:contentReference[oaicite:9]{index=9}
  const handleDelete = async taskId => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await deleteTask(projectId, taskId);
      toast.success("업무가 삭제되었습니다.");
      await onTasksChange?.();
    } catch {
      toast.error("삭제 실패");
    }
  };

  // 인라인 수정 진입/취소/저장:contentReference[oaicite:10]{index=10}
  const startEdit = task => {
    setEditingId(task.task_id);
    setEditForm({ title: task.title, description: task.description || "" });
  };
  const cancelEdit = () => setEditingId(null);
  const saveEdit = async taskId => {
    if (!editForm.title.trim()) return toast.error("제목을 입력하세요.");
    try {
      setLoading(true);
      await updateTask(projectId, taskId, editForm);
      toast.success("업무가 수정되었습니다.");
      setEditingId(null);
      await onTasksChange?.();
    } catch {
      toast.error("수정 실패");
    } finally {
      setLoading(false);
    }
  };

  // 접기/펼치기:contentReference[oaicite:11]{index=11}
  const toggleCollapse = taskId => {
    setCollapsedTasks(prev => {
      const next = new Set(prev);
      next.has(taskId) ? next.delete(taskId) : next.add(taskId);
      return next;
    });
  };

  return {
    // 데이터
    loading,
    filteredTasks,
    stats,
    assigneeOptions,

    // 편집/토글 상태
    editingId,
    editForm,
    collapsedTasks,

    // 상위에서 내려온 콜백
    onTaskClick,

    // 입력 값
    filterStatus,
    filterAssignee,
    searchKeyword,
    sortBy,
    sortOrder,

    // 액션
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
  };
}
