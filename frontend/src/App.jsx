// src/App.jsx
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

import ProjectDetailPage from "./pages/projects/ProjectDetailPage";
import ProjectsPage from "./pages/projects/ProjectsPage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<ProjectsPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />

        <Route path="*" element={<h2>페이지를 찾을 수 없습니다.</h2>} />
      </Routes>
    </Router>
  );
}

export default App;
