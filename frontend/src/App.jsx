// src/App.jsx
import React, { Suspense } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { Loader } from "./components/common/Loader";
import AppRoutes from "./routes/AppRoutes";
import DeptRoles from "./pages/admin/DeptRoles";

// ------------------------------
// ErrorBoundary (공용 예외처리)
// ------------------------------
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("🧨 ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, textAlign: "center", color: "#b00020" }}>
          <h2>🔴 화면 렌더링 중 오류가 발생했습니다</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>{String(this.state.error)}</pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 16,
              padding: "8px 16px",
              background: "#6200ee",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            🔄 새로고침
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Loader message="⏳ 모듈 불러오는 중..." />}>
        <Router>
          <AppRoutes />
        </Router>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
