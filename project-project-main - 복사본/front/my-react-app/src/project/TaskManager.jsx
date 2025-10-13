// src/project/TaskManager.jsx
import React, { useEffect, useRef, useState } from "react";
import TaskList from "./TaskList";
import TaskDetail from "./TaskDetail";
import TaskRegistration from "./TaskRegistration";
import AppShell from "../layout/AppShell";

export default function TaskManager() {
  const [selectedTask, setSelectedTask] = useState(null);
  const [open, setOpen] = useState(false); // ✅ 기본 닫힘
  const openBtnRef = useRef(null);
  const drawerRef = useRef(null);

  // ESC로 닫기 + 바디 스크롤 잠금 + 포커스 관리
  useEffect(() => {
    if (!open) return; // ✅ 열렸을 때만 작동
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
      drawerRef.current
        ?.querySelector("button, input, textarea, select, [tabindex]")
        ?.focus?.();
    });

    const onKeyDown = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
      openBtnRef.current?.focus?.();
    };
  }, [open]);

  return (
    <AppShell>
      {/* 헤더 + 등록 버튼 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
          프로젝트 대시보드
        </h1>
        <button
          ref={openBtnRef}
          onClick={() => setOpen(true)} // ✅ 클릭해야만 열림
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            padding: "10px 16px",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          업무 등록
        </button>
      </div>

      {/* 메인 내용 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: 16,
          minHeight: 480,
        }}
      >
        <div>
          <TaskList onSelectTask={setSelectedTask} />
        </div>
        <div>
          {selectedTask ? (
            <TaskDetail task={selectedTask} />
          ) : (
            <div
              style={{
                border: "1px dashed #cbd5e1",
                borderRadius: 10,
                padding: 24,
                background: "#fff",
                color: "#64748b",
              }}
            >
              오른쪽에 선택된 업무가 없습니다. 목록에서 항목을 선택하세요.
            </div>
          )}
        </div>
      </div>

      {/* 오버레이 (열렸을 때만) */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            zIndex: 999,
          }}
          aria-hidden="true"
        />
      )}

      {/* 오른쪽 드로어 (슬라이드) */}
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="업무 등록"
        style={{
          position: "fixed",
          top: 0,
          right: open ? 0 : "-50vw", // ✅ 애니메이션 닫힘
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
          <h2 style={{ margin: 0 }}>업무 등록</h2>
          <button
            onClick={() => setOpen(false)}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 18,
              cursor: "pointer",
            }}
            aria-label="업무 등록 닫기"
          >
            ✕
          </button>
        </div>

        {/* ✅ 드로어 안쪽 등록 폼 */}
        <TaskRegistration onClose={() => setOpen(false)} />
      </aside>
    </AppShell>
  );
}
