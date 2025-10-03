import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  getTask,
  getComments,
  getAttachments,
  createComment,
  updateComment,
  deleteComment,
  updateTaskStatus,
} from "../../services/api/task";

import { Button } from "../common/Button";
import { Loader } from "../common/Loader";

export default function TaskDetailPanel({
  projectId,
  taskId,
  onClose,
  onAddSubtask,
  currentUser, // ✅ 로그인 사용자 정보 전달받기
}) {
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editCommentId, setEditCommentId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // ---------------------------
  // 데이터 불러오기
  // ---------------------------
  const fetchData = async () => {
    try {
      setLoading(true);
      const [taskRes, commentRes, attachRes] = await Promise.all([
        getTask(projectId, taskId),
        getComments(projectId, taskId),
        getAttachments(projectId, taskId),
      ]);
      setTask(taskRes);
      setComments(commentRes);
      setAttachments(attachRes);
    } catch (err) {
      console.error("업무 상세 불러오기 실패:", err);
      toast.error("업무 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) fetchData();
  }, [taskId]);

  // ---------------------------
  // 상태 변경
  // ---------------------------
  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    try {
      setUpdatingStatus(true);
      await updateTaskStatus(projectId, taskId, newStatus);
      toast.success(`상태가 '${newStatus}'로 변경되었습니다.`);
      fetchData();
    } catch (err) {
      console.error("상태 변경 실패:", err);
      toast.error("상태 변경에 실패했습니다.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ---------------------------
  // 댓글 등록
  // ---------------------------
  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error("댓글을 입력하세요.");
      return;
    }
    try {
      await createComment(projectId, taskId, { content: newComment });
      setNewComment("");
      toast.success("댓글이 등록되었습니다.");
      fetchData();
    } catch (err) {
      console.error("댓글 등록 실패:", err);
      toast.error("댓글 등록 실패");
    }
  };

  // ---------------------------
  // 댓글 수정
  // ---------------------------
  const startEditComment = (comment) => {
    setEditCommentId(comment.comment_id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async (commentId) => {
    if (!editContent.trim()) {
      toast.error("내용을 입력하세요.");
      return;
    }
    try {
      await updateComment(projectId, taskId, commentId, { content: editContent });
      toast.success("댓글이 수정되었습니다.");
      setEditCommentId(null);
      fetchData();
    } catch (err) {
      console.error("댓글 수정 실패:", err);
      toast.error("댓글 수정 실패");
    }
  };

  // ---------------------------
  // 댓글 삭제
  // ---------------------------
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
    try {
      await deleteComment(projectId, taskId, commentId);
      toast.success("댓글이 삭제되었습니다.");
      setComments((prev) => prev.filter((c) => c.comment_id !== commentId));
    } catch (err) {
      console.error("댓글 삭제 실패:", err);
      toast.error("댓글 삭제 실패");
    }
  };

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

  return (
    <>
      {/* 반투명 배경 */}
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
        onClick={onClose}
      />

      {/* 상세 패널 */}
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
              fontSize: "18px",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* 본문 */}
        <div style={{ padding: "16px", flex: 1 }}>
          <p style={{ marginBottom: 8, color: "#666" }}>{task.description}</p>

          <div style={{ marginBottom: 12 }}>
            <strong>상태: </strong>
            <select
              value={task.status}
              onChange={handleStatusChange}
              disabled={updatingStatus}
              style={{
                marginLeft: 8,
                padding: "4px 6px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            >
              <option value="TODO">할 일</option>
              <option value="IN_PROGRESS">진행 중</option>
              <option value="REVIEW">검토 중</option>
              <option value="DONE">완료</option>
            </select>
          </div>

          <Button
            variant="success"
            onClick={() => onAddSubtask(task.task_id)}
            style={{
              marginLeft: 13,
              padding: "4px 8px",
              whiteSpace: "nowrap",
            }}
          >
            ➕ 하위 업무 추가
          </Button>

          <p>
            <strong>담당자:</strong> {task.assignee_name || "미지정"}
            <br />
            <strong>기간:</strong> {task.start_date} ~ {task.due_date}
          </p>

          {/* 첨부 파일 섹션션 */}
          <div style={{ marginTop: 16 }}>
            <h4>📎 첨부 파일</h4>
            {attachments.length === 0 ? (
              <p style={{ color: "#888" }}>첨부 파일 없음</p>
            ) : (
              <ul style={{ marginTop: 6 }}>
                {attachments.map((file) => (
                  <li key={file.attachment_id}>
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#007bff" }}
                    >
                      {file.file_name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 댓글 섹션 */}
          <div style={{ marginTop: 24 }}>
            <h4>💬 댓글</h4>
            {comments.length === 0 ? (
              <p style={{ color: "#888" }}>댓글이 없습니다.</p>
            ) : (
              <ul
                style={{
                  marginTop: 6,
                  maxHeight: "250px",
                  overflowY: "auto",
                  border: "1px solid #eee",
                  borderRadius: 6,
                  padding: 8,
                }}
              >
                {comments.map((c) => (
                  <li
                    key={c.comment_id}
                    style={{
                      borderBottom: "1px solid #eee",
                      padding: "8px 0",
                      fontSize: 14,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    {editCommentId === c.comment_id ? (
                      <div style={{ flex: 1 }}>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={2}
                          style={{
                            width: "100%",
                            border: "1px solid #ccc",
                            borderRadius: 6,
                            padding: 6,
                          }}
                        />
                        <div style={{ marginTop: 4 }}>
                          <Button
                            variant="primary"
                            onClick={() => handleSaveEdit(c.comment_id)}
                            style={{ marginRight: 6, fontSize: 12 }}
                          >
                            저장
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => setEditCommentId(null)}
                            style={{ fontSize: 12 }}
                          >
                            취소
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <strong>{c.author_name}</strong>: {c.content}
                          <br />
                          <span style={{ color: "#aaa", fontSize: 12 }}>
                            {new Date(c.created_at).toLocaleString()}
                          </span>
                        </div>

                        {/* ✅ 본인 댓글만 수정/삭제 가능 */}
                        {currentUser?.emp_id === c.emp_id && (
                          <div style={{ display: "flex", gap: 4 }}>
                            <Button
                              variant="outline"
                              onClick={() => startEditComment(c)}
                              style={{ padding: "2px 6px", fontSize: 12 }}
                            >
                              수정
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => handleDeleteComment(c.comment_id)}
                              style={{ padding: "2px 6px", fontSize: 12 }}
                            >
                              삭제
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* 댓글 입력창 */}
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <input
                type="text"
                placeholder="댓글을 입력하세요"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                style={{
                  flex: 1,
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  padding: "6px 8px",
                  fontSize: 14,
                }}
              />
              <Button variant="primary" onClick={handleAddComment}>
                등록
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
