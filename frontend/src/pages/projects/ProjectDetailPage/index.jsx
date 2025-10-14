import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

import { Loader } from "../../../components/common/Loader";
import {
  ProjectDetailProvider,
  useProjectDetailContext,
} from "../../../context/ProjectDetailContext";

import ProjectHeaderSection from "./ProjectHeaderSection";
import TaskDrawerSection from "./TaskDrawerSection";
import ViewSwitcherSection from "./ViewSwitcherSection";

import TaskCalendarView from "../../../components/tasks/TaskCalendarView";
import TaskDetailPanel from "../../../components/tasks/TaskDetailPanel";
import TaskKanbanView from "../../../components/tasks/TaskKanbanView";
import TaskListView from "../../../components/tasks/TaskListView";
import AppShell from "../../../layout/AppShell";

/* ---------------------------
 * ✅ 내부 콘텐츠 (Context 사용)
 * --------------------------- */
function ProjectDetailContent({ projectId }) {
  const navigate = useNavigate();
  const { project, loading } = useProjectDetailContext();

  const [viewType, setViewType] = useState(
    () => localStorage.getItem(`viewType_project_${projectId}`) || "list",
  );
  const [openDrawer, setOpenDrawer] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [parentTaskId, setParentTaskId] = useState(null);

  // viewType 저장
  useEffect(() => {
    localStorage.setItem(`viewType_project_${projectId}`, viewType);
  }, [viewType, projectId]);

  // 로딩 / 에러 처리
  if (loading) return <Loader text="데이터 불러오는 중..." />;
  if (!project) return <div className="p-6">❌ 프로젝트를 찾을 수 없습니다.</div>;

  return (
    <AppShell>
      <div className="p-6">
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
        {viewType === "list" && <TaskListView onTaskClick={setSelectedTask} />}
        {viewType === "kanban" && <TaskKanbanView onTaskClick={setSelectedTask} />}
        {viewType === "calendar" && <TaskCalendarView onTaskClick={setSelectedTask} />}

        {/* ---------- 업무 등록 Drawer ---------- */}
        <TaskDrawerSection
          openDrawer={openDrawer}
          setOpenDrawer={setOpenDrawer}
          parentTaskId={parentTaskId}
          setParentTaskId={setParentTaskId}
        />

        {/* ---------- 업무 상세 패널 ---------- */}
        {selectedTask && (
          <TaskDetailPanel
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

/* ---------------------------
 * ✅ 최상위 Provider 래퍼
 * --------------------------- */
export default function ProjectDetailPage() {
  const { projectId } = useParams();

  return (
    <ProjectDetailProvider projectId={projectId}>
      <ProjectDetailContent projectId={projectId} />
    </ProjectDetailProvider>
  );
}
