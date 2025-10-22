import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import { deleteProject, updateProject } from "../../../services/api/project";
import { deleteTask, updateTask, updateTaskStatus } from "../../../services/api/task";

/* ----------------------------------------
 * 🔁 상태 변환 매핑
 * ---------------------------------------- */
const normalizeProjectStatus = status => {
  switch (status) {
    case "DONE":
    case "REVIEW":
      return "COMPLETED";
    case "TODO":
    case "PLANNED":
      return "PLANNED";
    case "IN_PROGRESS":
      return "IN_PROGRESS";
    case "ON_HOLD":
      return "ON_HOLD";
    default:
      return "PLANNED";
  }
};

/* ----------------------------------------
 * 🔁 정렬 헬퍼
 * ---------------------------------------- */
function sortCompare(a, b, key, order) {
  if (key === "assignee_name") {
    const nameA = a.assignees?.map(x => x.name).join(", ") || "";
    const nameB = b.assignees?.map(x => x.name).join(", ") || "";
    return order === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
  }

  const valA = a[key] ?? "";
  const valB = b[key] ?? "";

  if (key.includes("date")) {
    const dateA = valA ? new Date(valA) : new Date(0);
    const dateB = valB ? new Date(valB) : new Date(0);
    return order === "asc" ? dateA - dateB : dateB - dateA;
  }

  return order === "asc"
    ? String(valA).localeCompare(String(valB))
    : String(valB).localeCompare(String(valA));
}

/* ----------------------------------------
 * 📦 메인 훅
 * ---------------------------------------- */
export function useTaskList({ allTasks = [] }) {
  const { fetchTasksByProject, updateTaskLocal, setSelectedTask } = useProjectGlobal();

  const [tasks, setTasks] = useState(allTasks);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", description: "" });
  const [collapsedTasks, setCollapsedTasks] = useState(new Set());

  // 필터/정렬 상태
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterAssignee, setFilterAssignee] = useState("ALL");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [sortBy, setSortBy] = useState("start_date");
  const [sortOrder, setSortOrder] = useState("asc");

  /* ----------------------------------------
   * 🧩 데이터 동기화
   * ---------------------------------------- */
  useEffect(() => {
    setTasks([...allTasks]);
  }, [allTasks]);

  /* ----------------------------------------
   * 🧩 트리 평탄화 유틸
   * ---------------------------------------- */
  function flattenTasks(nodes = []) {
    const result = [];
    for (const n of nodes) {
      result.push(n);
      if (Array.isArray(n.subtasks) && n.subtasks.length) {
        result.push(...flattenTasks(n.subtasks));
      }
    }
    return result;
  }

  /* ----------------------------------------
   * 🧩 Subtask 안전 보정 유틸
   * ---------------------------------------- */
  function normalizeSubtasks(s) {
    if (Array.isArray(s)) return s;
    if (s && typeof s === "object") return Object.values(s); // 객체형도 처리
    return [];
  }

  /* ----------------------------------------
   * 🔍 담당자 목록
   * ---------------------------------------- */
  const assigneeOptions = useMemo(() => {
    const set = new Set();
    flattenTasks(tasks).forEach(t => {
      if (t.assignees?.length) {
        t.assignees.forEach(a => set.add(a.name));
      } else {
        set.add("미지정");
      }
    });
    return ["ALL", ...Array.from(set)];
  }, [tasks]);

  /* ----------------------------------------
   * 🔍 필터 + 정렬 + 검색 (트리 구조 유지)
   * ---------------------------------------- */
  const filteredTasks = useMemo(() => {
    const filterNode = node => {
      const status = node.status?.trim()?.toUpperCase?.() || "TODO";
      const statusOk = filterStatus === "ALL" || status === filterStatus;
      const assigneeOk =
        filterAssignee === "ALL" || (node.assignees?.some(a => a.name === filterAssignee) ?? false);
      const keywordOk =
        !searchKeyword || node.title?.toLowerCase().includes(searchKeyword.toLowerCase());

      const matchSelf = statusOk && assigneeOk && keywordOk;

      const children = normalizeSubtasks(node.subtasks)
        .map(sub => filterNode(sub))
        .filter(Boolean)
        .sort((a, b) => sortCompare(a, b, sortBy, sortOrder));

      if (matchSelf || children.length > 0) {
        return { ...node, subtasks: children };
      }
      return null;
    };

    return (Array.isArray(tasks) ? tasks : [])
      .map(task => filterNode(task))
      .filter(Boolean)
      .sort((a, b) => sortCompare(a, b, sortBy, sortOrder));
  }, [tasks, filterStatus, filterAssignee, searchKeyword, sortBy, sortOrder]);

  /* ----------------------------------------
   * 📊 통계 계산
   * ---------------------------------------- */
  const stats = useMemo(() => {
    const flat = flattenTasks(filteredTasks ?? []);
    const total = flat.length;
    const counts = { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, DONE: 0 };

    flat.forEach(t => {
      const key = t.status || "TODO";
      counts[key] = (counts[key] || 0) + 1;
    });

    const doneRatio = total ? ((counts.DONE / total) * 100).toFixed(1) : 0;
    return { total, ...counts, doneRatio };
  }, [filteredTasks]);

  /* ----------------------------------------
   * ⚙️ 필터 / 정렬 제어
   * ---------------------------------------- */
  const handleSort = key => {
    if (sortBy === key) setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };

  const handleStatusFilter = key => setFilterStatus(prev => (prev === key ? "ALL" : key));

  const resetFilters = () => {
    setFilterStatus("ALL");
    setFilterAssignee("ALL");
    setSearchKeyword("");
    setSortBy("start_date");
    setSortOrder("asc");
  };

  /* ----------------------------------------
   * 📋 상태 변경 / 수정 / 삭제 / 클릭
   * ---------------------------------------- */
  const handleStatusChange = async (task, newStatus) => {
    if (!task) return;
    const projectId = Number(task.project_id);
    const taskId = Number(task.task_id);
    const isProject = !!task.isProject;

    try {
      setLoading(true);
      if (isProject) {
        await updateProject(projectId, { status: normalizeProjectStatus(newStatus) });
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
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (taskId, projectId) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    const pid = Number(projectId);
    const tid = Number(taskId);
    const isProject = !tid || String(taskId).startsWith("proj");

    try {
      setLoading(true);
      if (isProject) await deleteProject(pid);
      else await deleteTask(pid, tid);
      toast.success(isProject ? "프로젝트 삭제 완료" : "업무 삭제 완료");
      await fetchTasksByProject(pid);
    } catch (err) {
      console.error("❌ 삭제 실패:", err);
      toast.error("삭제 실패");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = task => {
    setEditingId(task.task_id || task.project_id);
    setEditForm({
      title: task.title || "",
      description: task.description || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: "", description: "" });
  };

  const saveEdit = async (taskId, projectId) => {
    if (!editForm.title.trim()) return toast.error("제목을 입력하세요.");
    const isProject = !taskId || String(taskId).startsWith("proj");
    const pid = Number(projectId);
    const tid = Number(taskId);

    try {
      setLoading(true);
      if (isProject) {
        await updateProject(pid, editForm);
      } else {
        const updated = await updateTask(pid, tid, editForm);
        updateTaskLocal(tid, updated);
      }
      toast.success(isProject ? "프로젝트 수정 완료" : "업무 수정 완료");
      setEditingId(null);
      setEditForm({ title: "", description: "" });
      await fetchTasksByProject(pid);
    } catch (err) {
      console.error("❌ 수정 실패:", err);
      toast.error("수정 실패");
    } finally {
      setLoading(false);
    }
  };

  const toggleCollapse = id => {
    setCollapsedTasks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const onTaskClick = task => setSelectedTask(task);

  /* ----------------------------------------
   * 📤 반환
   * ---------------------------------------- */
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
