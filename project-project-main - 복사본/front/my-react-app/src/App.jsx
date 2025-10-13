// src/App.jsx
import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

const Screen = lazy(() => import("./screens/Screen.jsx"));      // 메인
const Projects = lazy(() => import("./project/pages/projects/ProjectsPage.jsx")); // 태스크
const Calendar = lazy(() => import("./calendar/CalendarView.jsx"))
const NoticeBoard = lazy(() => import("./notices/NoticeBoard.jsx"))
const TrashBin = lazy(() => import("./components/TrashBin.jsx"))

class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { hasError:false, error:null } }
  static getDerivedStateFromError(error){ return { hasError:true, error } }
  componentDidCatch(error, info){ console.error("ErrorBoundary", error, info) }
  render(){
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16, color: "#b00020", whiteSpace: "pre-wrap" }}>
          <h2>🔴 화면 렌더링 중 에러</h2>
          {String(this.state.error)}
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div style={{ padding: 16 }}>⏳ 모듈 불러오는 중…</div>}>
        <Routes>
          {/* 기본 진입 → /Main으로 */}
          <Route path="/" element={<Navigate to="/Main" replace />} />

          {/* 메인 화면 */}
          <Route path="/Main" element={<Screen />} />

          {/* 태스크 매니저 */}
          <Route path="/Projects" element={<Projects />} />

          {/* 캘린더 */}
          <Route path="/Calendar" element={<Calendar />} />

          {/* 공지사항 */}
          <Route path="/NoticeBoard" element={<NoticeBoard />} /> 
          
          {/* 휴지통 */}
          <Route path="/TrashBin" element={<TrashBin />} /> 

          {/* 그 외 → /Main */}
          <Route path="*" element={<Navigate to="/Main" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
