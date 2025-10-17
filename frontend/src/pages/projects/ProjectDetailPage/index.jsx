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

  /** ✅ 모든 프로젝트의 업무를 하나의 배열로 병합 */
  const allTasks = useMemo(() => {
    if (!projects?.length) return [];
    const merged = [];
    projects.forEach(project => {
      const tasks = tasksByProject[project.project_id] || [];
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

  if (loading) return <Loader text="전체 프로젝트 불러오는 중..." />;
  if (!projects?.length) return <div className="p-6">❌ 등록된 프로젝트가 없습니다.</div>;

  return (
    <AppShell>
      <div className="p-6">
        <Toaster position="top-right" />

        {/* ✅ 상단 네비게이션 버튼 */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h1 style={{ fontSize: 26, fontWeight: "bold", margin: 0 }}>
            📊 전체 프로젝트 업무 관리
          </h1>
          <Button variant="secondary" onClick={() => navigate("/main")}>
            ← 메인 페이지
          </Button>
        </div>

        {/* ✅ 뷰 전환 및 새 업무 버튼 */}
        <ViewSwitcherSection onAddTask={() => setOpenDrawer(true)} />

        {/* ✅ 뷰 타입별 업무 표시 */}
        {viewType === "list" && <TaskListView tasks={allTasks} />}
        {viewType === "kanban" && <TaskKanbanView tasks={allTasks} />}
        {viewType === "calendar" && <TaskCalendarView tasks={allTasks} />}

        {/* ✅ 업무 등록 Drawer */}
        <ProjectDrawerSection
          openDrawer={openDrawer}
          setOpenDrawer={setOpenDrawer}
          parentTaskId={parentTaskId}
          setParentTaskId={setParentTaskId}
          projectId={selectedProjectId}
        />

        {/* ✅ 오른쪽 슬라이드 상세 패널 */}
        {selectedTask && (
          <TaskDetailPanel
            projectId={selectedTask.project_id}
            taskId={selectedTask.task_id}
            onClose={() => setSelectedTask(null)}
            onAddSubtask={taskId => {
              setParentTaskId(taskId);
              setOpenDrawer(true);
              setSelectedTask(null);
            }}
          />
        )}
      </div>
    </AppShell>
  );
}
