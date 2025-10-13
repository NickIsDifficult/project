// src/App.jsx
import React from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

import PrivateRoute from "./routes/PrivateRoute";

import LoginPage from "./pages/Login/Login";
import MainPage from "./pages/Main/Main";
import ProjectDetailPage from "./pages/projects/ProjectDetailPage";
import ProjectsPage from "./pages/projects/ProjectsPage";
import SignupPage from "./pages/Signup/Signup";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/main"
          element={
            <PrivateRoute>
              <MainPage />
            </PrivateRoute>
          }
        />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />

        <Route path="*" element={<h2>페이지를 찾을 수 없습니다.</h2>} />
      </Routes>
    </Router>
  );
}

export default App;
