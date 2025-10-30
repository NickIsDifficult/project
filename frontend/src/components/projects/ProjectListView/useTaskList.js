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

  // ✅ 담당자 이름 추출
  const extractAssigneeNames = useCallback(t => {
    if (!t) return [];
    if (t.isProject) {
      if (t.owner_name) return [t.owner_name];
      if (Array.isArray(t.members))
        return t.members.map(m => m?.employee?.name ?? m?.name ?? "").filter(Boolean);
      return [];
    }
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
    if (t.assignee_name && !names.includes(t.assignee_name)) names.push(t.assignee_name);
    return names.filter(Boolean);
  }, []);

  // ✅ 프로젝트/업무 리스트 갱신 시 담당자 이름 추가
  useEffect(() => {
    const enriched = allTasks.map(t => ({
      ...t,
      assigneeNames: extractAssigneeNames(t),
    }));
    setTasks(enriched);
  }, [allTasks, extractAssigneeNames]);

  // ✅ 트리 평탄화
  const flattenTasks = useCallback((nodes = []) => {
    const result = [];
    for (const n of nodes) {
      result.push(n);
      if (Array.isArray(n.subtasks) && n.subtasks.length) result.push(...flattenTasks(n.subtasks));
    }
    return result;
  }, []);

  const flatTasks = useMemo(() => flattenTasks(tasks), [tasks, flattenTasks]);

  // ✅ 담당자 목록 (필터용)
  const assigneeOptions = useMemo(() => {
    const names = new Set(["ALL"]);
    flatTasks.forEach(t => {
      if (t.assigneeNames?.length) t.assigneeNames.forEach(n => names.add(n));
      else names.add("미지정");
    });
    return Array.from(names);
  }, [flatTasks]);

  // ✅ 정렬 비교
  const sortCompare = useCallback(
    (a, b) => {
      let valA = a[sortBy] ?? "";
      let valB = b[sortBy] ?? "";

      if (sortBy === "assignee_name" || sortBy === "assigneeNames") {
        valA = a.assigneeNames?.[0] ?? "";
        valB = b.assigneeNames?.[0] ?? "";
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

  // ✅ 하위 subtasks 중 특정 상태를 재귀적으로 검사
  const hasMatchingSubtask = useCallback((task, targetStatus) => {
    if (!Array.isArray(task.subtasks) || task.subtasks.length === 0) return false;
    return task.subtasks.some(
      sub => sub.status === targetStatus || hasMatchingSubtask(sub, targetStatus),
    );
  }, []);

  // ✅ 재귀 필터링 (중복 없는 형태 유지)
  const deepFilter = useCallback(
    (nodes = []) => {
      return nodes
        .map(node => {
          const filteredSubs = deepFilter(node.subtasks || []);

          let statusOk = true;
          if (status !== "ALL") {
            if (node.isProject) {
              statusOk = node.status === status || hasMatchingSubtask(node, status);
            } else {
              statusOk = node.status === status;
            }
          }

          const assigneeOk =
            assignee === "ALL" ||
            (Array.isArray(node.assigneeNames) && node.assigneeNames.includes(assignee));

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

  // ✅ 필터 + 정렬 + 중복 제거
  const filteredTasks = useMemo(() => {
    const filteredTree = deepFilter(tasks);

    const sortNodes = nodes =>
      [...nodes].sort(sortCompare).map(n => ({
        ...n,
        subtasks: n.subtasks?.length ? sortNodes(n.subtasks) : [],
      }));

    return sortNodes(filteredTree);
  }, [tasks, keyword, status, assignee, sortCompare, deepFilter]);

  // ✅ 정렬 핸들러
  const handleSort = useCallback(
    key => {
      setSortOrder(prev => {
        if (sortBy === key) {
          const next = prev === "asc" ? "desc" : "asc";
          return next;
        } else {
          setSortBy(key);
          return "asc";
        }
      });
    },
    [sortBy],
  );

  // ✅ 접기 / 펼치기 관련
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

  // ✅ 필터링 유틸
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
