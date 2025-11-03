// src/components/projects/ProjectListView/index.jsx
import { useMemo } from "react";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import { Loader } from "../../common/Loader";
import { STATUS_LABELS } from "../constants/statusMaps";
import ViewHeaderSection from "../ViewHeaderSection";
import TaskListTable from "./TaskListTable";
import { useTaskList } from "./useTaskList";

export default function ProjectListView() {
  const { projects, tasksByProject, loading, uiState, setUiState } = useProjectGlobal();

  const projectNodes = useMemo(() => {
    if (!projects?.length) return [];

    return projects.map(project => {
      // 1) 원본 데이터에서 가능한 모든 경로로 이름/ID를 확보
      const namesFromAssignees = Array.isArray(project.assignees) ? project.assignees : [];
      const idsFromAssignees = Array.isArray(project.assignee_ids) ? project.assignee_ids : [];

      const namesFromMembers = Array.isArray(project.projectmember)
  ? project.projectmember
      .map(m =>
        m?.employee?.name       // ✅ 일반 구조
        || m?.employee_name     // ✅ API에서 employee_name으로 바로 올 경우
        || m?.name              // ✅ 혹시 name만 올 경우
      )
      .filter(Boolean)
  : [];
      // 2) 우선순위: assignees -> projectmember -> owner
      const members = Array.isArray(project.projectmember) ? project.projectmember : [];

let assigneesObj = members
  .map(m => {
    const empId = Number(m?.emp_id ?? m?.employee?.emp_id ?? m?.id ?? NaN);
    const name =
      m?.employee?.name ??
      m?.employee_name ??
      m?.name ??
      (Number.isFinite(empId) ? `ID:${empId}` : null);
    return name ? { emp_id: empId, name } : null;
  })
  .filter(Boolean);

// fallback: projectmember가 비어있을 때만
if (assigneesObj.length === 0 && Array.isArray(project.assignee_ids)) {
  assigneesObj = project.assignee_ids.map((id, idx) => ({
    emp_id: Number(id),
    name: `ID:${Number(id) || idx}`,
  }));
}

      const assigneeNamesArr = assigneesObj.map(a => a.name);
      const assigneeNameStr = assigneeNamesArr.join(", ");

      return {
        project_id: project.project_id,
        task_id: null,
        isProject: true,

        title: project.project_name,
        description: project.description ?? "",

        status: project.status ?? "PLANNED",
        statusLabel: STATUS_LABELS[project.status] ?? "계획",

        // ✅ 리스트/훅/테이블이 어떤 걸 보든 대응되도록 모두 제공
        assignees: assigneesObj,          // [{emp_id, name}]
        assigneeNames: assigneeNamesArr,  // ["관리자","test"]
        assignee_name: assigneeNameStr,   // "관리자, test"
        members: project.projectmember ?? [],

        start_date: project.start_date ?? null,
        end_date: project.end_date ?? project.due_date ?? null,

        owner_emp_id: project.owner_emp_id,
        owner_name: project.owner_name,

        subtasks: tasksByProject?.[project.project_id]?.filter(t => !t.parent_task_id) ?? [],
      };
    });
  }, [projects, tasksByProject]);

  const hook = useTaskList({ allTasks: projectNodes });

  const isExpanded = uiState.expand.list;

  const visibleNodes = useMemo(() => {
    if (isExpanded) return hook.filteredTasks;
    return projectNodes.filter(node => node.isProject);
  }, [isExpanded, projectNodes, hook.filteredTasks]);

  const handleTaskClick = task => {
    setUiState(prev => ({
      ...prev,
      drawer: { ...prev.drawer, project: false, task: false },
      panel: { selectedTask: task },
    }));
  };

  if (loading) return <Loader text="📂 프로젝트 및 업무를 불러오는 중..." />;

  return (
    <div className="p-4 space-y-4">
      <ViewHeaderSection
        viewType="list"
        assigneeOptions={hook.assigneeOptions}
        setSearchKeyword={hook.setSearchKeyword}
        setFilterAssignee={hook.setFilterAssignee}
        handleStatusFilter={hook.handleStatusFilter}
        resetFilters={hook.resetFilters}
        onToggleExpandAll={hook.toggleExpandAll}
      />

      <TaskListTable
        filteredTasks={visibleNodes}
        collapsedTasks={hook.collapsedTasks}
        toggleCollapse={hook.toggleCollapse}
        handleSort={hook.handleSort}
        handleDelete={hook.handleDelete}
        handleStatusChange={hook.handleStatusChange}
        onTaskClick={handleTaskClick}
        sortBy={hook.sortBy}
        sortOrder={hook.sortOrder}
      />
    </div>
  );
}
