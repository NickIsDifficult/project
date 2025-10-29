// // src/route/router.jsx
// import { Route, Routes } from "react-router-dom";
// import ProjectDetailPage from "../components/projects/ProjectDetailPanel"; // ✅ index 자동 인식
// import TaskDetailPanel from "../components/tasks/TaskDetailPanel"; // ✅ index 자동 인식

// export default function AppRoutes() {
//   return (
//     <Routes>
//       <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
//       <Route
//         path="/projects/:projectId/tasks/:taskId"
//         element={<TaskDetailPanel />}
//       />
//       <Route
//         path="*"
//         element={<div style={{ padding: 40 }}>❌ 잘못된 경로입니다.</div>}
//       />
//     </Routes>
//   );
// }
