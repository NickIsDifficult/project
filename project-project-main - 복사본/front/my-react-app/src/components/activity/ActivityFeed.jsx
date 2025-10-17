// src/components/activity/ActivityFeed.jsx
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getProjectActivity } from "../../services/api/activity";

export default function ActivityFeed({ projectId, taskId = null }) {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  // ---------------------------
  // 활동 로그 불러오기
  // ---------------------------
  const fetchFeed = async () => {
    try {
      setLoading(true);
      const res = taskId
        ? await getProjectActivity(projectId, taskId) // 단일 업무용
        : await getProjectActivity(projectId); // 전체 프로젝트용
      setFeed(res || []);
    } catch (err) {
      console.error(err);
      toast.error("활동 로그를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [projectId, taskId]);

  // ---------------------------
  // 로딩 상태
  // ---------------------------
  if (loading)
    return <p style={{ color: "#999", fontSize: 13, marginTop: 10 }}>활동 로그 불러오는 중...</p>;

  // ---------------------------
  // 렌더링
  // ---------------------------
  return (
    <div style={{ marginTop: 16 }}>
      <h4 style={{ fontWeight: "bold", marginBottom: 8 }}>🕓 활동 로그</h4>

      <div
        style={{
          maxHeight: 240,
          overflowY: "auto",
          background: "#fafafa",
          borderRadius: 8,
          padding: 8,
          border: "1px solid #eee",
        }}
      >
        {feed.length === 0 ? (
          <p style={{ color: "#aaa", fontSize: 13, textAlign: "center", padding: "16px 0" }}>
            아직 활동 기록이 없습니다.
          </p>
        ) : (
          feed.map((log, idx) => (
            <div
              key={log.log_id ?? `${log.emp_id}-${idx}`} // ✅ 고유 key 보장
              style={{
                marginBottom: 8,
                paddingBottom: 6,
                borderBottom: "1px solid #eee",
              }}
            >
              <div style={{ fontSize: 14, lineHeight: "1.4em" }}>
                <b>{log.emp_name || "시스템"}</b> {renderAction(log.action, log.detail)}
              </div>
              <div style={{ color: "#999", fontSize: 12, marginTop: 2 }}>
                {new Date(log.created_at).toLocaleString("ko-KR", {
                  hour12: false,
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ---------------------------
// 액션 타입별 메시지 변환기
// ---------------------------
function renderAction(action, detail) {
  switch (action) {
    case "commented":
      return <>💬 댓글 작성: {detail}</>;
    case "comment_updated":
      return <>✏️ 댓글 수정: {detail}</>;
    case "comment_deleted":
      return <>🗑️ 댓글 삭제</>;
    case "mentioned":
      return <>🏷️ {detail} 언급했습니다</>;
    case "status_changed":
      return <>🔄 상태 변경 → {detail}</>;
    case "assignee_changed":
      return <>👤 담당자 변경: {detail}</>;
    case "due_date_changed":
      return <>📅 마감일 변경: {detail}</>;
    case "attachment_added":
      return <>📎 첨부파일 추가: {detail}</>;
    case "attachment_removed":
      return <>🗑️ 첨부파일 삭제: {detail}</>;
    case "task_created":
      return <>🆕 업무 생성: {detail}</>;
    case "task_updated":
      return <>🛠️ 업무 수정: {detail}</>;
    case "task_deleted":
      return <>❌ 업무 삭제: {detail}</>;
    case "project_created":
      return <>🚀 프로젝트 생성</>;
    case "project_deleted":
      return <>🗑️ 프로젝트 삭제</>;
    default:
      return detail ? detail : "작업 수행";
  }
}
