// src/pages/projects/ProjectsPage.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProjectList from "../../components/projects/ProjectList";
import ProjectRegistration from "../../components/projects/ProjectRegistration";
import AppShell from "../../layout/AppShell";
import { getProjects } from "../../services/api/project";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ Drawer 관련 ref
  const drawerRef = useRef(null);
  const openBtnRef = useRef(null);

  // ✅ 프로젝트 불러오기
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      console.error("프로젝트 불러오기 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // ✅ Drawer 제어 (배경 스크롤 잠금 + ESC 닫기 + 포커스 관리)
  useEffect(() => {
    if (!open) return;

    // 1️⃣ 스크롤 잠금
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // 2️⃣ Drawer 내부 첫 번째 focusable 요소로 포커스 이동
    requestAnimationFrame(() => {
      drawerRef.current?.querySelector("button, input, textarea, select, [tabindex]")?.focus?.();
    });

    // 3️⃣ ESC 키로 Drawer 닫기
    const onKeyDown = e => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKeyDown);

    // 4️⃣ Cleanup — 닫힐 때 원복
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
      openBtnRef.current?.focus?.(); // 등록 버튼에 포커스 복귀
    };
  }, [open]);

  if (loading) return <div>로딩 중...</div>;

  return (
    <AppShell>
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 16 }}>프로젝트 대시보드</h1>

        {/* ➕ 프로젝트 등록 버튼 */}
        <button
          ref={openBtnRef} // ✅ ref 연결 (닫힐 때 포커스 복귀용)
          onClick={() => setOpen(true)}
          style={{
            background: "#007bff",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            borderRadius: "6px",
            cursor: "pointer",
            marginBottom: "20px",
          }}
        >
          프로젝트 등록
        </button>

        {/* 📋 프로젝트 목록 */}
        <ProjectList
          projects={projects}
          onSelectProject={p => navigate(`/projects/${p.project_id}`)}
        />

        {/* ➕ Drawer (등록 폼) */}
        {open && (
          <>
            {/* 반투명 배경 */}
            <div
              onClick={() => setOpen(false)}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "rgba(0,0,0,0.3)",
                zIndex: 999,
              }}
            />
            {/* Drawer 본체 */}
            <aside
              ref={drawerRef} // ✅ ref 연결 (포커스 이동용)
              style={{
                position: "fixed",
                top: 0,
                right: open ? 0 : "-50vw",
                width: "50vw",
                height: "100%",
                background: "#fff",
                boxShadow: "-2px 0 8px rgba(0,0,0,0.1)",
                transition: "right 0.3s ease-in-out",
                zIndex: 1000,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  padding: "10px 16px",
                  borderBottom: "1px solid #ddd",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h2 style={{ margin: 0 }}>프로젝트 등록</h2>
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    fontSize: "18px",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
              <ProjectRegistration
                onClose={() => {
                  setOpen(false);
                  fetchProjects();
                }}
              />
            </aside>
          </>
        )}
      </div>
    </AppShell>
  );
}
