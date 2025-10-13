// src/pages/projects/ProjectDetailPage/index.jsx
import React, { useState } from "react";
import { Toaster } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

import { Loader } from "../../../components/common/Loader";
import { useProjectDetail } from "../../../hooks/useProjectDetail";

import ProjectHeaderSection from "./ProjectHeaderSection";
import TaskDrawerSection from "./TaskDrawerSection";
import ViewSwitcherSection from "./ViewSwitcherSection";

import CalendarView from "../../../components/tasks/TaskCalendarView";
import TaskDetailPanel from "../../../components/tasks/TaskDetailPanel";
import TaskKanbanView from "../../../components/tasks/TaskKanbanView";
import TaskListView from "../../../components/tasks/TaskListView";
import AppShell from "../../../../layout/AppShell";

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const { project, tasks, loading, fetchTasks } = useProjectDetail(projectId);

  const [viewType, setViewType] = useState(() => {
    return localStorage.getItem(`viewType_project_${projectId}`) || "list";
  });
  const [openDrawer, setOpenDrawer] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [parentTaskId, setParentTaskId] = useState(null);

  // ---------------------------
  // 뷰 타입 저장
  // ---------------------------
  React.useEffect(() => {
    localStorage.setItem(`viewType_project_${projectId}`, viewType);
  }, [viewType, projectId]);

  // ---------------------------
  // 로딩 / 에러 처리
  // ---------------------------
  if (loading) return <Loader text="데이터 불러오는 중..." />;
  if (!project) return <div style={{ padding: 24 }}>❌ 프로젝트를 찾을 수 없습니다.</div>;

  return (
    <AppShell>
    <div style={{ padding: 24 }}>
      <Toaster position="top-right" />

      {/* ---------- 프로젝트 헤더 ---------- */}
      <ProjectHeaderSection project={project} onBack={() => navigate("/projects")} />

      {/* ---------- 뷰 전환 탭 ---------- */}
      <ViewSwitcherSection
        viewType={viewType}
        setViewType={setViewType}
        onAddTask={() => setOpenDrawer(true)}
      />

      {/* ---------- 메인 콘텐츠 ---------- */}
      {viewType === "list" && (
        <TaskListView
          projectId={projectId}
          tasks={tasks}
          onTaskClick={setSelectedTask}
          onTasksChange={fetchTasks}
        />
      )}
      {viewType === "kanban" && (
        <TaskKanbanView
          projectId={projectId}
          tasks={tasks}
          onTaskClick={setSelectedTask}
          onTaskMove={fetchTasks}
        />
      )}
      {viewType === "calendar" && (
        <CalendarView
          projectId={projectId}
          tasks={tasks}
          onTaskClick={setSelectedTask}
          onTaskMove={fetchTasks}
        />
      )}

      {/* ---------- 업무 등록 Drawer ---------- */}
      <TaskDrawerSection
        openDrawer={openDrawer}
        setOpenDrawer={setOpenDrawer}
        parentTaskId={parentTaskId}
        setParentTaskId={setParentTaskId}
        projectId={projectId}
        fetchTasks={fetchTasks}
      />

      {/* ---------- 업무 상세 패널 ---------- */}
      {selectedTask && (
        <TaskDetailPanel
          projectId={projectId}
          taskId={selectedTask.task_id}
          onTasksChange={fetchTasks}
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
