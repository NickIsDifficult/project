// src/pages/projects/ProjectDetailPage/index.jsx
import { useEffect, useMemo, useState } from "react";
import { Toaster } from "react-hot-toast";
import { Loader } from "../../../components/common/Loader";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import AppShell from "../../../layout/AppShell";

import TaskCalendarView from "../../../components/tasks/TaskCalendarView";
import TaskDetailPanel from "../../../components/tasks/TaskDetailPanel";
import TaskKanbanView from "../../../components/tasks/TaskKanbanView";
import TaskListView from "../../../components/tasks/TaskListView";
import TaskDrawerSection from "./TaskDrawerSection";
import ViewSwitcherSection from "./ViewSwitcherSection";

export default function ProjectDetailPage() {
  const { projects, tasksByProject, fetchTasksByProject, loading, selectedTask, setSelectedTask } =
    useProjectGlobal();

  const [viewType, setViewType] = useState(() => localStorage.getItem("viewType_global") || "list");
  const [openDrawer, setOpenDrawer] = useState(false);
  const [parentTaskId, setParentTaskId] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  useEffect(() => {
    localStorage.setItem("viewType_global", viewType);
  }, [viewType]);

  useEffect(() => {
    if (projects?.length) {
      projects.forEach(p => {
        if (!tasksByProject[p.project_id]) fetchTasksByProject(p.project_id);
      });
    }
  }, [projects]);

  // ✅ 전체 프로젝트의 업무를 하나의 배열로 통합
  const allTasks = useMemo(() => {
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
        <h1 style={{ fontSize: 26, fontWeight: "bold", marginBottom: 20 }}>
          📊 전체 프로젝트 업무 관리
        </h1>

        <ViewSwitcherSection
          viewType={viewType}
          setViewType={setViewType}
          onAddTask={() => setOpenDrawer(true)}
        />

        {viewType === "list" && <TaskListView tasks={allTasks} />}
        {viewType === "kanban" && <TaskKanbanView tasks={allTasks} />}
        {viewType === "calendar" && <TaskCalendarView tasks={allTasks} />}

        {selectedProjectId && (
          <TaskDrawerSection
            openDrawer={openDrawer}
            setOpenDrawer={setOpenDrawer}
            parentTaskId={parentTaskId}
            setParentTaskId={setParentTaskId}
            projectId={selectedProjectId}
          />
        )}

        {/* ✅ 오른쪽 슬라이드 상세 패널 */}
        {selectedTask && (
          <TaskDetailPanel
            projectId={selectedTask.project_id}
            taskId={selectedTask.task_id}
            onClose={() => setSelectedTask(null)} // 닫기
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
