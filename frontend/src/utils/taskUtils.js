// src/utils/taskUtils.js
export const mergeTasksAcrossProjects = (projects, tasksByProject) =>
  projects.flatMap(project =>
    (tasksByProject[project.project_id] || []).map(task => ({
      ...task,
      project_id: project.project_id,
      project_name: project.project_name,
    })),
  );
