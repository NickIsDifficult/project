// src/App.jsx
import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./Login";
import ProtectedRoute from "./src/ProtectedRoute";

// 📢 공지사항 관련
import NoticeList from "./notices/NoticeList";
import NoticeBoard from "./notices/NoticeBoard";
import NoticeSearch from "./notices/NoticeSearch";
import NoticeDetail from "./notices/NoticeDetail";

// 📅 캘린더/상태 관련
import CalendarView from "./calendar/CalendarView";
import StatusBoard from "./calendar/StatusBoard";

// 🔐 관리자
import AdminPage from "./admin/AdminPage";

function App() {
  const [logged, setLogged] = useState(!!localStorage.getItem("token"));

  return (
    <BrowserRouter>
      <Routes>
        {/* 🔐 로그인 화면 */}
        <Route
          path="/"
          element={
            <Login
              onLogin={() => {
                setLogged(true);
                window.location.href = "/notices"; // 로그인 성공 후 이동
              }}
            />
          }
        />

        {/* 📢 공지사항 목록 */}
        <Route
          path="/notices"
          element={
            <ProtectedRoute>
              <NoticeList token={localStorage.getItem("token")} />
            </ProtectedRoute>
          }
        />

        {/* 📢 전체 게시판 */}
        <Route
          path="/notice-board"
          element={
            <ProtectedRoute>
              <NoticeBoard token={localStorage.getItem("token")} />
            </ProtectedRoute>
          }
        />

        {/* 🔍 공지사항 검색 */}
        <Route
          path="/notice-search"
          element={
            <ProtectedRoute>
              <NoticeSearch token={localStorage.getItem("token")} />
            </ProtectedRoute>
          }
        />

        {/* 📄 공지사항 상세 */}
        <Route
          path="/notices/:id"
          element={
            <ProtectedRoute>
              <NoticeDetail token={localStorage.getItem("token")} />
            </ProtectedRoute>
          }
        />

        {/* 📅 캘린더 */}
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <CalendarView
                token={localStorage.getItem("token")}
                projectId={1}
              />
            </ProtectedRoute>
          }
        />

        {/* 📊 상태 보드 */}
        <Route
          path="/status-board"
          element={
            <ProtectedRoute>
              <StatusBoard token={localStorage.getItem("token")} />
            </ProtectedRoute>
          }
        />

        {/* 🔐 관리자 페이지 */}
        <Route
          path="/admin-test"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
