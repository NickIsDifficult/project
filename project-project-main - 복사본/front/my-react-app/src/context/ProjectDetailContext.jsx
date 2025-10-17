// src/context/ProjectDetailContext.jsx
import { createContext, useContext } from "react";
import { useProjectDetail } from "../hooks/useProjectDetail";

const ProjectDetailContext = createContext(null);

export function ProjectDetailProvider({ projectId, children }) {
  const projectState = useProjectDetail(projectId);
  return (
    <ProjectDetailContext.Provider value={projectState}>{children}</ProjectDetailContext.Provider>
  );
}

export function useProjectDetailContext() {
  const ctx = useContext(ProjectDetailContext);
  if (!ctx) throw new Error("useProjectDetailContext must be used within ProjectDetailProvider");
  return ctx;
}
