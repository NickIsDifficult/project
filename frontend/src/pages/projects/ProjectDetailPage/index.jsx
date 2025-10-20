// src/pages/projects/ProjectDetailPage/index.jsx
import { useMemo } from "react";
import { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/common/Button";
import { Loader } from "../../../components/common/Loader";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext";
import AppShell from "../../../layout/AppShell";

import ProjectKanbanView from "../../../components/projects/ProjectKanbanView";
import TaskCalendarView from "../../../components/tasks/TaskCalendarView";
import TaskDetailPanel from "../../../components/tasks/TaskDetailPanel";
import TaskListView from "../../../components/tasks/TaskListView";
import ProjectDrawerSection from "./ProjectDrawerSection";
import ViewSwitcherSection from "./ViewSwitcherSection";

export default function ProjectDetailPage() {
  const {
    projects,
    tasksByProject,
    fetchAllProjects,
    loading,
    selectedTask,
    setSelectedTask,
    viewType,
    openDrawer,
    setOpenDrawer,
    parentTaskId,
    setParentTaskId,
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

        {/* ✅ 상단 네비게이션 */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h1 style={{ fontSize: 26, fontWeight: "bold", margin: 0 }}>
            📊 프로젝트 & 업무 통합 관리
          </h1>
          <Button variant="secondary" onClick={() => navigate("/main")}>
            ← 메인 페이지
          </Button>
        </div>

        {/* ✅ 뷰 전환 / 새 등록 버튼 */}
        <ViewSwitcherSection onAddTask={() => setOpenDrawer(true)} />

        {/* ✅ 뷰 전환 */}
        {viewType === "kanban" && (
          <ProjectKanbanView
            onProjectClick={proj =>
              setSelectedTask({
                ...proj,
                isProject: true, // ✅ 프로젝트 상세 구분용
              })
            }
          />
        )}
        {viewType === "list" && <TaskListView tasks={allTasks} />}
        {viewType === "calendar" && <TaskCalendarView tasks={allTasks} />}

        {/* ✅ Drawer (새 프로젝트 등록) */}
        {openDrawer && (
          <ProjectDrawerSection
            openDrawer={openDrawer}
            setOpenDrawer={setOpenDrawer}
            onSuccess={() => fetchAllProjects()}
          />
        )}

        {/* ✅ 우측 상세 패널 */}
        {selectedTask && (
          <TaskDetailPanel
            projectId={selectedTask.project_id}
            taskId={selectedTask.isProject ? undefined : selectedTask.task_id}
            isProject={selectedTask.isProject}
            onClose={() => setSelectedTask(null)}
            onAddSubtask={taskId => {
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
