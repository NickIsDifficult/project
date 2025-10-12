// src/pages/projects/ProjectDetailPage/TaskDrawerSection.jsx
import React from "react";
import { Drawer } from "../../../components/common/Drawer";
import TaskRegistration from "../../../components/tasks/TaskRegistration";

export default function TaskDrawerSection({
  openDrawer,
  setOpenDrawer,
  parentTaskId,
  setParentTaskId,
  projectId,
  fetchTasks,
}) {
  return (
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
        parentTaskId={parentTaskId}
        onClose={() => {
          setOpenDrawer(false);
          setParentTaskId(null);
          fetchTasks();
        }}
      />
    </Drawer>
  );
}
