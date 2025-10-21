// src/pages/projects/ProjectDetailPage/index.jsx
import { useMemo } from "react";
import { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/common/Button";
import { Loader } from "../../../components/common/Loader";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import AppShell from "../../../layout/AppShell";

import TaskCalendarView from "../../../components/tasks/TaskCalendarView";
import TaskDetailPanel from "../../../components/tasks/TaskDetailPanel";
import TaskKanbanView from "../../../components/tasks/TaskKanbanView";
import TaskListView from "../../../components/tasks/TaskListView";
import ProjectDrawerSection from "./ProjectDrawerSection";
import ViewSwitcherSection from "./ViewSwitcherSection";

/**
 * ✅ ProjectDetailPage (전체 프로젝트 관리)
 * - 모든 프로젝트 + 그 하위 업무를 병합하여 표시
 * - 리스트/칸반/캘린더 뷰 전환 지원
 */
export default function ProjectDetailPage() {
  const {
    projects,
    tasksByProject,
    fetchTasksByProject,
    loading,
    selectedTask,
    setSelectedTask,
    viewType,
    openDrawer,
    setOpenDrawer,
    parentTaskId,
    setParentTaskId,
    selectedProjectId,
    setSelectedProjectId,
  } = useProjectGlobal();

  const navigate = useNavigate();

  /* -------------------------------------------------
   * ✅ 모든 프로젝트의 업무를 하나의 배열로 병합
   * ------------------------------------------------- */
  const allTasks = useMemo(() => {
    if (!projects || !Array.isArray(projects)) return [];

    const merged = [];

    projects.forEach(project => {
      const rawTasks = tasksByProject?.[project.project_id];
      const tasks = Array.isArray(rawTasks) ? rawTasks : [];

      tasks.forEach(t => {
        merged.push({
          ...t,
          project_id: project.project_id,
          project_name: project.project_name,
        });
      });
    });

    return merged;
  }, [projects, tasksByProject]);

  /* -------------------------------------------------
   * ⏳ 로딩 / 데이터 없음 처리
   * ------------------------------------------------- */
  if (loading) return <Loader text="전체 프로젝트 불러오는 중..." />;

  if (!projects?.length)
    return <div className="p-6 text-gray-600">❌ 등록된 프로젝트가 없습니다.</div>;

  /* -------------------------------------------------
   * ✅ 메인 렌더링
   * ------------------------------------------------- */
  return (
    <AppShell>
      <div className="p-6">
        <Toaster position="top-right" />

        {/* ----------------------------- */}
        {/* ✅ 상단 헤더 */}
        {/* ----------------------------- */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <h1 style={{ fontSize: 26, fontWeight: "bold", margin: 0 }}>
            📊 전체 프로젝트 업무 관리
          </h1>
          <Button variant="secondary" onClick={() => navigate("/main")}>
            ← 메인 페이지
          </Button>
        </div>

        {/* ----------------------------- */}
        {/* ✅ 뷰 전환 (리스트/칸반/캘린더) */}
        {/* ----------------------------- */}
        <ViewSwitcherSection onAddTask={() => setOpenDrawer(true)} />

        {viewType === "list" && <TaskListView tasks={allTasks} />}
        {viewType === "kanban" && <TaskKanbanView tasks={allTasks} />}
        {viewType === "calendar" && <TaskCalendarView tasks={allTasks} />}

        {/* ----------------------------- */}
        {/* ✅ 업무 등록 Drawer */}
        {/* ----------------------------- */}
        {openDrawer && (
          <ProjectDrawerSection
            openDrawer={openDrawer}
            setOpenDrawer={setOpenDrawer}
            parentTaskId={parentTaskId}
            setParentTaskId={setParentTaskId}
            projectId={selectedProjectId}
          />
        )}

        {/* ----------------------------- */}
        {/* ✅ 업무 / 프로젝트 상세 Drawer */}
        {/* ----------------------------- */}
        {selectedTask && (
          <TaskDetailPanel
            projectId={selectedTask.project_id || selectedTask.task_id}
            taskId={selectedTask.isProject ? undefined : selectedTask.task_id}
            isProject={selectedTask.isProject}
            onClose={() => setSelectedTask(null)}
            onAddSubtask={taskId => {
              // 하위 업무 추가 시: 현재 상세 닫고 Drawer 열기
              setParentTaskId(taskId);
              setSelectedTask(null);
              setOpenDrawer(true);
            }}
          />
        )}
      </div>
    </AppShell>
  );
}
