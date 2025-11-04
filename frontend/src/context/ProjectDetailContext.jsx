// src/context/ProjectDetailContext.jsx
import { createContext, useContext } from "react";
import { useProjectDetail } from "../hooks/useProjectDetail";
import { useProjectGlobal } from "./ProjectGlobalContext";

const ProjectDetailContext = createContext(null);

export function ProjectDetailProvider({ projectId, taskId = null, children }) {
  if (!projectId) return null;

  const { employees } = useProjectGlobal(); // ✅ 전역 employees 사용
  const projectState = useProjectDetail(projectId, taskId);

  // ✅ employees를 projectState에 병합
  const mergedState = {
    ...projectState,
    employees,
  };

  return (
    <ProjectDetailContext.Provider value={mergedState}>{children}</ProjectDetailContext.Provider>
  );
}

export function useProjectDetailContext() {
  const ctx = useContext(ProjectDetailContext);
  if (!ctx) throw new Error("useProjectDetailContext must be used within ProjectDetailProvider");
  return ctx;
}
