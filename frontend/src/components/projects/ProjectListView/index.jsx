// src/components/projects/ProjectListView/index.jsx
import { useMemo } from "react";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import { Loader } from "../../common/Loader";
import { STATUS_LABELS } from "../constants/statusMaps";
import ViewHeaderSection from "../ViewHeaderSection";
import TaskListTable from "./TaskListTable";
import { useTaskList } from "./useTaskList";

/**
 * ✅ ProjectListView (전역 프로젝트 기반)
 * - 모든 프로젝트를 루트 노드로 포함하는 트리 리스트 뷰
 * - ProjectGlobalContext + useTaskList 조합
 */
export default function ProjectListView() {
  const { projects, tasksByProject, loading, setUiState } = useProjectGlobal();

  /* ----------------------------------------
   * 🧩 프로젝트 + 업무 트리 구조로 변환
   * ---------------------------------------- */
  const projectNodes = useMemo(() => {
    if (!projects?.length) return [];
    return projects.map(project => ({
      project_id: project.project_id,
      task_id: null, // ✅ 프로젝트는 task_id 없음
      title: project.project_name,
      isProject: true,
      status: project.status ?? "PLANNED", // ✅ 상태 키 통일
      statusLabel: STATUS_LABELS[project.status] ?? "계획",
      assignees: project.manager_name
        ? [{ emp_id: project.owner_emp_id ?? 0, name: project.manager_name }]
        : [],
      start_date: project.start_date ?? null,
      due_date: project.due_date ?? null,
      subtasks: tasksByProject?.[project.project_id] ?? [],
    }));
  }, [projects, tasksByProject]);

  /* ----------------------------------------
   * 🔁 필터/검색/정렬/수정 등 관리 훅
   * ---------------------------------------- */
  const hook = useTaskList({ allTasks: projectNodes });

  /* ----------------------------------------
   * ⚙️ 상세 보기 클릭 시 Drawer 자동 닫기
   * ---------------------------------------- */
  const handleTaskClick = task => {
    setUiState(prev => ({
      ...prev,
      drawer: { ...prev.drawer, project: false, task: false },
      panel: { selectedTask: task },
    }));
  };

  /* ----------------------------------------
   * ⏳ 로딩 / 예외 처리
   * ---------------------------------------- */
  if (loading) return <Loader text="📂 프로젝트 및 업무를 불러오는 중..." />;

  if (!projects?.length)
    return <div className="p-6 text-gray-600">❌ 등록된 프로젝트가 없습니다.</div>;

  /* ----------------------------------------
   * ✅ 메인 렌더링
   * ---------------------------------------- */
  return (
    <>
      <div className="p-4">
        {/* 🔍 공통 필터/요약 섹션 */}
        <ViewHeaderSection
          stats={hook.stats}
          assigneeOptions={hook.assigneeOptions}
          filterStatus={hook.filterStatus}
          filterAssignee={hook.filterAssignee}
          searchKeyword={hook.searchKeyword}
          setSearchKeyword={hook.setSearchKeyword}
          setFilterAssignee={hook.setFilterAssignee}
          handleStatusFilter={hook.handleStatusFilter}
          resetFilters={hook.resetFilters}
        />

        {/* 📋 리스트 테이블 본문 */}
        <TaskListTable {...hook} onTaskClick={handleTaskClick} />
      </div>
    </>
  );
}
