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

  /* 🧱 1️⃣ 프로젝트 + 하위 업무 트리 구조 생성 */
  const projectNodes = useMemo(() => {
    if (!projects?.length) return [];

    return projects.map(project => {
      // ✅ 모든 태스크 중 parent_task_id가 없는 것만 (루트)
      const allTasks = tasksByProject?.[project.project_id] ?? [];
      const topLevelTasks = allTasks.filter(t => !t.parent_task_id);

      return {
        project_id: project.project_id,
        task_id: null,
        title: project.project_name,
        description: project.description ?? "",
        isProject: true,
        status: project.status ?? "PLANNED",
        statusLabel: STATUS_LABELS[project.status] ?? "계획",
        assignees: project.owner_name
          ? [{ emp_id: project.owner_emp_id ?? 0, name: project.owner_name }]
          : [],
        start_date: project.start_date ?? null,
        end_date: project.end_date ?? project.due_date ?? null,
        owner_emp_id: project.owner_emp_id,
        owner_name: project.owner_name,
        subtasks: topLevelTasks,
      };
    });
  }, [projects, tasksByProject]);

  /* ⚙️ 2️⃣ 리스트뷰용 훅 (검색, 필터, 정렬 등) */
  const hook = useTaskList({ allTasks: projectNodes });

  /* 🧭 3️⃣ 전체 접기 / 펼치기 상태 */
  const isExpanded = uiState.expand.list;

  /* 📋 4️⃣ 현재 표시할 데이터 (프로젝트만 / 전체) */
  const visibleNodes = useMemo(() => {
    if (isExpanded) return hook.filteredTasks; // 전체 펼치기 시 모든 프로젝트 + 업무
    return projectNodes.filter(node => node.isProject); // 전체 접기 시 프로젝트만
  }, [isExpanded, projectNodes, hook.filteredTasks]);

  /* 🪟 5️⃣ 상세 패널 열기 */
  const handleTaskClick = task => {
    setUiState(prev => ({
      ...prev,
      drawer: { ...prev.drawer, project: false, task: false },
      panel: { selectedTask: task },
    }));
  };

  /* 🌀 6️⃣ 로딩 처리 */
  if (loading) return <Loader text="📂 프로젝트 및 업무를 불러오는 중..." />;

  /* 🎨 7️⃣ 렌더링 */
  return (
    <div className="p-4 space-y-4">
      {/* 🔹 상단 필터 & 전체 접기/펼치기 버튼 */}
      <ViewHeaderSection
        viewType="list" // ✅ 리스트뷰 전용 토글 제어
        assigneeOptions={hook.assigneeOptions}
        setSearchKeyword={hook.setSearchKeyword}
        setFilterAssignee={hook.setFilterAssignee}
        handleStatusFilter={hook.handleStatusFilter}
        resetFilters={hook.resetFilters}
        onToggleExpandAll={hook.toggleExpandAll}
      />

      {/* 🔹 리스트 테이블 영역 */}
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
