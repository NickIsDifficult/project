// src/pages/projects/ProjectDetailPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { getProject } from "../../services/api/project";
import { getTaskTree } from "../../services/api/task";

import ListView from "../../components/tasks/ListView";
import KanbanView from "../../components/tasks/KanbanView";
import TaskRegistration from "../../components/tasks/TaskRegistration";
import TaskDetailPanel from "../../components/tasks/TaskDetailPanel";
import { Button } from "../../components/common/Button";
import { Drawer } from "../../components/common/Drawer";
import { Loader } from "../../components/common/Loader";

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openDrawer, setOpenDrawer] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [viewType, setViewType] = useState(() => {
    return localStorage.getItem(`viewType_project_${projectId}`) || "list";
  });

  // ✅ 하위업무 추가용
  const [parentTaskId, setParentTaskId] = useState(null);

  // ---------------------------
  // 데이터 로드 함수
  // ---------------------------
  const fetchProject = useCallback(async () => {
    try {
      const data = await getProject(projectId);
      setProject(data);
    } catch (err) {
      console.error("프로젝트 불러오기 실패:", err);
      toast.error("프로젝트 정보를 불러오지 못했습니다.");
    }
  }, [projectId]);

  const fetchTasks = useCallback(async () => {
    try {
      const data = await getTaskTree(projectId);
      setTasks(data);
    } catch (err) {
      console.error("태스크 불러오기 실패:", err);
      toast.error("업무 목록을 불러오지 못했습니다.");
    }
  }, [projectId]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchProject(), fetchTasks()]);
      setLoading(false);
    };
    loadData();
  }, [fetchProject, fetchTasks]);

  // ---------------------------
  // 뷰 타입 로컬 저장
  // ---------------------------
  useEffect(() => {
    localStorage.setItem(`viewType_project_${projectId}`, viewType);
  }, [viewType, projectId]);

  // ---------------------------
  // 하위업무 추가 기능
  // ---------------------------
  const handleAddSubtask = (parentId) => {
    setParentTaskId(parentId);
    setOpenDrawer(true);
    toast.success(`하위 업무 추가 창을 엽니다 (부모 ID: ${parentId})`);
  };

  // ---------------------------
  // 상태별 렌더링
  // ---------------------------
  if (loading) return <Loader text="데이터 불러오는 중..." />;
  if (!project) return <div style={{ padding: 24 }}>❌ 프로젝트를 찾을 수 없습니다.</div>;

  return (
    <div style={{ padding: 24, position: "relative" }}>
      <Toaster position="top-right" />

      {/* ---------- 프로젝트 헤더 ---------- */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: "bold", margin: 0 }}>{project.project_name}</h1>
          <p style={{ color: "#666", marginTop: 4 }}>{project.description || "설명 없음"}</p>
          <p style={{ color: "#999", fontSize: 13, marginTop: 4 }}>
            📅 {project.start_date} ~ {project.end_date}
          </p>
        </div>

        <Button variant="secondary" onClick={() => navigate("/projects")}>
          ← 프로젝트 목록
        </Button>
      </div>

      {/* ---------- 뷰 전환 탭 ---------- */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <Button
          variant={viewType === "list" ? "primary" : "outline"}
          onClick={() => setViewType("list")}
        >
          📋 리스트 뷰
        </Button>
        <Button
          variant={viewType === "kanban" ? "primary" : "outline"}
          onClick={() => setViewType("kanban")}
        >
          🧩 칸반 뷰
        </Button>

        <Button
          variant="success"
          style={{ marginLeft: "auto" }}
          onClick={() => setOpenDrawer(true)}
        >
          ➕ 새 업무
        </Button>
      </div>

      {/* ---------- 메인 콘텐츠 ---------- */}
      <div>
        {viewType === "list" ? (
          <ListView
            projectId={projectId}
            tasks={tasks}
            onTaskClick={setSelectedTask}
            onTasksChange={fetchTasks}
          />
        ) : (
          <KanbanView
            projectId={projectId}
            tasks={tasks}
            onTaskMove={fetchTasks}
            onTaskClick={setSelectedTask}
          />
        )}
      </div>

      {/* ---------- 업무 등록 Drawer ---------- */}
      <Drawer
        open={openDrawer}
        title={parentTaskId ? "하위 업무 등록" : "업무 등록"}
        onClose={() => {
          setOpenDrawer(false);
          setParentTaskId(null);
        }}
      >
        <TaskRegistration
          projectId={projectId}
          parentTaskId={parentTaskId} // ✅ 하위 업무일 경우 전달
          onClose={() => {
            setOpenDrawer(false);
            setParentTaskId(null);
            fetchTasks();
          }}
        />
      </Drawer>

      {/* ---------- 업무 상세 패널 ---------- */}
      {selectedTask && (
        <TaskDetailPanel
          projectId={projectId}
          taskId={selectedTask.task_id}
          onClose={() => setSelectedTask(null)}
          // ✅ 하위 업무 추가 기능 전달
          onAddSubtask={(taskId) => {
            // ✅ 하위업무 등록창 열기
            setOpenDrawer(true);

            // ✅ 선택된 상위 업무 기억 (TaskRegistration에 전달)
            setParentTaskId(taskId);

            // ✅ TaskDetailPanel 닫기
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}
