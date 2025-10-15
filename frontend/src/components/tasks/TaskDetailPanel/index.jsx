// src/components/tasks/TaskDetailPanel/index.jsx
import { useEffect, useState } from "react";
import { useProjectDetailContext } from "../../../context/ProjectDetailContext";
import Button from "../../common/Button";
import { Loader } from "../../common/Loader";
import TaskAttachments from "./TaskAttachments";
import TaskComments from "./TaskComments";
import TaskEditForm from "./TaskEditForm";
import TaskInfoView from "./TaskInfoView";
import { useTaskDetail } from "./useTaskDetail";

// ✅ JWT 디코더 (base64url → JSON)
function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function TaskDetailPanel({ taskId, onClose, onAddSubtask }) {
  /* ----------------------------------------
   * ✅ ProjectDetailContext 연결
   * ---------------------------------------- */
  const { fetchTasks, updateTaskLocal } = useProjectDetailContext();

  /* ----------------------------------------
   * ✅ 업무 상세 데이터 로드 (커스텀 훅)
   * ---------------------------------------- */
  const {
    task,
    comments,
    attachments,
    employees,
    loading,
    handleAddComment,
    handleUpdateComment,
    handleDeleteComment,
    handleUploadFile,
    handleDeleteFile,
    handleStatusChange,
    handleProgressChange,
    handleSaveEdit,
  } = useTaskDetail(taskId);

  const [isEditing, setIsEditing] = useState(false);

  /* ----------------------------------------
   * ✅ 로그인 사용자 로드
   * ---------------------------------------- */
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // 1) localStorage: user, profile 등 흔한 키 순회
        const keys = ["user", "profile", "currentUser"];
        for (const k of keys) {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.emp_id) {
              if (mounted) setCurrentUser(parsed);
              console.log("✅ currentUser(from localStorage):", parsed);
              return;
            }
          }
        }

        // 2) access_token 디코드 → emp_id 또는 login_id 추출
        const token = localStorage.getItem("access_token");
        if (token) {
          const claims = decodeJwt(token);
          // 백엔드에 따라 sub/login_id/user_id/emp_id 등 다양할 수 있음
          const probableEmpId =
            claims?.emp_id ?? claims?.user_id ?? claims?.member_id ?? claims?.uid ?? null;

          if (probableEmpId && mounted) {
            setCurrentUser({ emp_id: Number(probableEmpId) });
            console.log("✅ currentUser(from token claims):", { emp_id: Number(probableEmpId) });
            return;
          }

          // 3) 마지막 수단: /auth/me 호출 (있으면 사용, 없으면 무시)
          try {
            const { data } = await API.get("/auth/me");
            // 기대되는 형태: { emp_id, name, ... }
            if (data?.emp_id && mounted) {
              setCurrentUser(data);
              console.log("✅ currentUser(from /auth/me):", data);
              return;
            }
          } catch (e) {
            // /auth/me가 없거나 401/404여도 조용히 넘어감
            console.warn("⚠️ /auth/me 조회 실패(무시 가능):", e?.message);
          }
        }

        console.warn("⚠️ currentUser를 찾지 못했습니다. 버튼 표시가 제한될 수 있습니다.");
      } catch (e) {
        console.error("❌ currentUser 로딩 오류:", e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  /* ----------------------------------------
   * 로딩 / 예외 처리
   * ---------------------------------------- */
  if (loading) return <Loader text="업무 상세 불러오는 중..." />;

  if (!task)
    return (
      <div style={{ padding: 24 }}>
        ❌ 해당 업무를 찾을 수 없습니다.
        <Button variant="secondary" onClick={onClose} style={{ marginTop: 16 }}>
          닫기
        </Button>
      </div>
    );

  /* ----------------------------------------
   * ✅ 수정 저장 핸들러 통합
   * ---------------------------------------- */
  const handleSaveAndSync = async payload => {
    const updated = await handleSaveEdit(payload);
    if (updated) {
      updateTaskLocal(updated); // Context의 로컬 task 리스트 갱신
      fetchTasks(); // 전체 새로고침 (서버 반영)
    }
    setIsEditing(false);
  };

  /* ----------------------------------------
   * UI 렌더링
   * ---------------------------------------- */
  return (
    <>
      {/* 🔲 배경 오버레이 */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.3)",
          zIndex: 999,
        }}
        onClick={e => e.target === e.currentTarget && onClose()}
      />

      {/* ⚙️ 오른쪽 패널 */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "45vw",
          height: "100%",
          background: "#fff",
          boxShadow: "-2px 0 8px rgba(0,0,0,0.1)",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            borderBottom: "1px solid #ddd",
            padding: "12px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0 }}>{task.title}</h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* 본문 */}
        <div style={{ padding: 16, flex: 1 }}>
          {/* ✏️ 수정 모드 */}
          {isEditing ? (
            <TaskEditForm
              task={task}
              employees={employees}
              onSave={handleSaveAndSync}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            /* 🔍 읽기 모드 */
            <TaskInfoView
              task={task}
              onStatusChange={async status => {
                await handleStatusChange(status);
                fetchTasks();
              }}
              onProgressChange={async progress => {
                await handleProgressChange(progress);
                fetchTasks();
              }}
              onEdit={() => setIsEditing(true)}
              onAddSubtask={onAddSubtask}
            />
          )}

          {/* 📎 첨부파일 섹션 */}
          <TaskAttachments
            attachments={attachments}
            onUpload={async file => {
              await handleUploadFile(file);
              fetchTasks();
            }}
            onDelete={async id => {
              await handleDeleteFile(id);
              fetchTasks();
            }}
          />

          {/* 💬 댓글 섹션 */}
          <TaskComments
            comments={comments}
            currentUser={currentUser}
            onAdd={handleAddComment}
            onEdit={handleUpdateComment}
            onDelete={handleDeleteComment}
          />
        </div>
      </aside>
    </>
  );
}
