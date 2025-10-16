// src/pages/projects/ProjectDetailPage/index.jsx
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

import { Loader } from "../../../components/common/Loader";
import { useProjectGlobal } from "../../../context/ProjectGlobalContext"; // ✅ 전역 Context
import AppShell from "../../../layout/AppShell";

import TaskCalendarView from "../../../components/tasks/TaskCalendarView";
import TaskKanbanView from "../../../components/tasks/TaskKanbanView";
import TaskListView from "../../../components/tasks/TaskListView";
import TaskDrawerSection from "./TaskDrawerSection";
import ViewSwitcherSection from "./ViewSwitcherSection";

/* ---------------------------
 * ✅ 전체 프로젝트 통합 관리 페이지
 * --------------------------- */
export default function ProjectDetailPage() {
  const { projects, tasksByProject, fetchTasksByProject, loading } = useProjectGlobal();

  const [viewType, setViewType] = useState(() => localStorage.getItem("viewType_global") || "list");
  const [openDrawer, setOpenDrawer] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [parentTaskId, setParentTaskId] = useState(null);

  // ✅ 뷰 타입 저장
  useEffect(() => {
    localStorage.setItem("viewType_global", viewType);
  }, [viewType]);

  // ✅ 프로젝트별 업무 로딩
  useEffect(() => {
    if (projects.length > 0) {
      projects.forEach(p => {
        if (!tasksByProject[p.project_id]) {
          fetchTasksByProject(p.project_id);
        }
      });
    }
  }, [projects]);

  // ✅ 로딩 상태
  if (loading) return <Loader text="프로젝트 불러오는 중..." />;
  if (!projects.length) return <div className="p-6">❌ 등록된 프로젝트가 없습니다.</div>;

  return (
    <AppShell>
      <div className="p-6">
        <Toaster position="top-right" />
        <h1 style={{ fontSize: 26, fontWeight: "bold", marginBottom: 20 }}>
          📊 전체 프로젝트 관리
        </h1>

        {/* ---------- 전역 뷰 전환 ---------- */}
        <ViewSwitcherSection
          viewType={viewType}
          setViewType={setViewType}
          onAddTask={() => setOpenDrawer(true)}
        />

        {/* ---------- 전체 프로젝트 목록 ---------- */}
        {projects.map(project => (
          <div key={project.project_id} className="border rounded-xl p-4 mb-6 bg-white shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 600 }}>{project.project_name}</h2>
                <p style={{ color: "#777", marginTop: 4 }}>{project.description || "설명 없음"}</p>
                <p style={{ color: "#aaa", fontSize: 13 }}>
                  📅 {project.start_date} ~ {project.end_date || "미정"}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedProjectId(project.project_id);
                  setOpenDrawer(true);
                }}
                className="text-blue-600 underline"
              >
                ➕ 새 업무
              </button>
            </div>

            {/* ---------- 각 프로젝트별 뷰 ---------- */}
            {viewType === "list" && (
              <TaskListView
                tasks={tasksByProject[project.project_id] || []}
                onTaskClick={() => {}}
              />
            )}
            {viewType === "kanban" && (
              <TaskKanbanView
                tasks={tasksByProject[project.project_id] || []}
                onTaskClick={() => {}}
              />
            )}
            {viewType === "calendar" && (
              <TaskCalendarView
                tasks={tasksByProject[project.project_id] || []}
                onTaskClick={() => {}}
              />
            )}
          </div>
        ))}

        {/* ---------- 업무 등록 Drawer ---------- */}
        {selectedProjectId && (
          <TaskDrawerSection
            openDrawer={openDrawer}
            setOpenDrawer={setOpenDrawer}
            parentTaskId={parentTaskId}
            setParentTaskId={setParentTaskId}
            projectId={selectedProjectId}
          />
        )}
      </div>
    </AppShell>
  );
}
