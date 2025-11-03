// src/components/projects/ProjectListView/useTaskList.js
import { useCallback, useEffect, useMemo, useState } from "react";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import { useTaskActions } from "./useTaskActions";

export function useTaskList({ allTasks = [] }) {
  const { uiState, setUiState, setSelectedTask } = useProjectGlobal();
  const { handleStatusChange, handleDelete } = useTaskActions();

  const [tasks, setTasks] = useState(allTasks);
  const [collapsedTasks, setCollapsedTasks] = useState(() => new Set());
  const [sortBy, setSortBy] = useState("start_date");
  const [sortOrder, setSortOrder] = useState("asc");

  const { keyword, status, assignee } = uiState.filter;

  // ✅ 담당자 이름 추출 (우선순위 고정)
  const extractAssigneeNames = useCallback(t => {
    if (!t) return [];

    // 1) 이미 가공된 필드가 있으면 그대로 사용
    if (Array.isArray(t.assigneeNames) && t.assigneeNames.length) return t.assigneeNames;

    if (typeof t.assignee_name === "string" && t.assignee_name.trim()) {
      return t.assignee_name.split(",").map(s => s.trim()).filter(Boolean);
    }

    // 2) 원시 데이터에서 생성
    const names = [];

    if (Array.isArray(t.assignees)) {
      t.assignees.forEach(a => {
        if (a?.name) names.push(a.name);
        else if (a?.employee?.name) names.push(a.employee.name);
      });
    }

    if (Array.isArray(t.members)) {
      t.members.forEach(m => {
        if (m?.employee?.name) names.push(m.employee.name);
        else if (m?.name) names.push(m.name);
      });
    }

    if (t.owner_name) names.push(t.owner_name);

    // 중복 제거
    return Array.from(new Set(names.filter(Boolean)));
  }, []);

  // ✅ 리스트 갱신 시, 기존 값을 덮어쓰지 않고 부족한 것만 보완
  useEffect(() => {
    const enriched = allTasks.map(t => {
      const arr = extractAssigneeNames(t);
      const str = arr.join(", ");
      return {
        ...t,
        assigneeNames: Array.isArray(t.assigneeNames) && t.assigneeNames.length ? t.assigneeNames : arr,
        assignee_name: typeof t.assignee_name === "string" && t.assignee_name.trim() ? t.assignee_name : str,
      };
    });
    setTasks(enriched);
  }, [allTasks, extractAssigneeNames]);

  const flattenTasks = useCallback((nodes = []) => {
    const result = [];
    for (const n of nodes) {
      result.push(n);
      if (Array.isArray(n.subtasks) && n.subtasks.length) result.push(...flattenTasks(n.subtasks));
    }
    return result;
  }, []);

  const flatTasks = useMemo(() => flattenTasks(tasks), [tasks, flattenTasks]);

  const assigneeOptions = useMemo(() => {
    const names = new Set(["ALL"]);
    flatTasks.forEach(t => {
      const list = Array.isArray(t.assigneeNames)
        ? t.assigneeNames
        : typeof t.assignee_name === "string"
        ? t.assignee_name.split(",").map(s => s.trim()).filter(Boolean)
        : [];
      if (list.length > 0) list.forEach(n => names.add(n));
      else names.add("미지정");
    });
    return Array.from(names);
  }, [flatTasks]);

  const sortCompare = useCallback(
    (a, b) => {
      let valA = a[sortBy] ?? "";
      let valB = b[sortBy] ?? "";

      if (sortBy === "assignee_name" || sortBy === "assigneeNames") {
        valA = (Array.isArray(a.assigneeNames) ? a.assigneeNames[0] : a.assignee_name) ?? "";
        valB = (Array.isArray(b.assigneeNames) ? b.assigneeNames[0] : b.assignee_name) ?? "";
      }

      if (["start_date", "due_date", "end_date"].includes(sortBy)) {
        return sortOrder === "asc"
          ? new Date(valA || 0) - new Date(valB || 0)
          : new Date(valB || 0) - new Date(valA || 0);
      }

      return sortOrder === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    },
    [sortBy, sortOrder],
  );

  const hasMatchingSubtask = useCallback((task, targetStatus) => {
    if (!Array.isArray(task.subtasks) || task.subtasks.length === 0) return false;
    return task.subtasks.some(
      sub => sub.status === targetStatus || hasMatchingSubtask(sub, targetStatus),
    );
  }, []);

  const deepFilter = useCallback(
    (nodes = []) => {
      return nodes
        .map(node => {
          const filteredSubs = deepFilter(node.subtasks || []);

          let statusOk = true;
          if (status !== "ALL") {
            statusOk = node.isProject
              ? node.status === status || hasMatchingSubtask(node, status)
              : node.status === status;
          }

          const list =
            Array.isArray(node.assigneeNames)
              ? node.assigneeNames
              : typeof node.assignee_name === "string"
              ? node.assignee_name.split(",").map(s => s.trim()).filter(Boolean)
              : [];

          const assigneeOk = assignee === "ALL" || list.includes(assignee);

          const keywordOk =
            !keyword ||
            node.title?.toLowerCase().includes(keyword.toLowerCase()) ||
            node.project_name?.toLowerCase().includes(keyword.toLowerCase()) ||
            node.description?.toLowerCase().includes(keyword.toLowerCase());

          const selfMatch = statusOk && assigneeOk && keywordOk;
          const keep = selfMatch || filteredSubs.length > 0;
          return keep ? { ...node, subtasks: filteredSubs } : null;
        })
        .filter(Boolean);
    },
    [status, assignee, keyword, hasMatchingSubtask],
  );

  const filteredTasks = useMemo(() => {
    const filteredTree = deepFilter(tasks);
    const sortNodes = nodes =>
      [...nodes].sort(sortCompare).map(n => ({
        ...n,
        subtasks: n.subtasks?.length ? sortNodes(n.subtasks) : [],
      }));
    return sortNodes(filteredTree);
  }, [tasks, deepFilter, sortCompare]);

  const handleSort = useCallback(
    key => {
      setSortOrder(prev => {
        if (sortBy === key) return prev === "asc" ? "desc" : "asc";
        setSortBy(key);
        return "asc";
      });
    },
    [sortBy],
  );

  const toggleCollapse = useCallback(id => {
    setCollapsedTasks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleExpandAll = useCallback(
    expandAll => {
      setCollapsedTasks(() => {
        if (expandAll) return new Set();
        const ids = new Set();
        tasks.forEach(t => {
          const id = t.isProject ? `proj-${t.project_id}` : `task-${t.task_id}`;
          if (t.subtasks?.length) ids.add(id);
        });
        return ids;
      });
    },
    [tasks],
  );

  const setSearchKeyword = useCallback(
    newKeyword => {
      setUiState(prev => ({
        ...prev,
        filter: { ...prev.filter, keyword: newKeyword },
        expand: { ...prev.expand, list: !!newKeyword.trim() },
      }));
    },
    [setUiState],
  );

  const setFilterAssignee = useCallback(
    newAssignee => {
      setUiState(prev => ({
        ...prev,
        filter: { ...prev.filter, assignee: newAssignee },
      }));
    },
    [setUiState],
  );

  const handleStatusFilter = useCallback(
    newStatus => {
      setUiState(prev => ({
        ...prev,
        filter: {
          ...prev.filter,
          status: prev.filter.status === newStatus ? "ALL" : newStatus,
        },
      }));
    },
    [setUiState],
  );

  const resetFilters = useCallback(() => {
    setUiState(prev => ({
      ...prev,
      filter: { keyword: "", status: "ALL", assignee: "ALL" },
      expand: { ...prev.expand, list: true },
    }));
    setSortBy("start_date");
    setSortOrder("asc");
    setCollapsedTasks(new Set());
  }, [setUiState]);

  const onTaskClick = useCallback(task => setSelectedTask(task), [setSelectedTask]);

  return {
    filteredTasks,
    assigneeOptions,
    keyword,
    status,
    assignee,
    sortBy,
    sortOrder,
    handleSort,
    setSearchKeyword,
    setFilterAssignee,
    handleStatusFilter,
    resetFilters,
    handleStatusChange,
    handleDelete,
    toggleCollapse,
    toggleExpandAll,
    collapsedTasks,
    onTaskClick,
  };
}
