import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import TextareaAutosize from "react-textarea-autosize";
import { getEmployees } from "../../services/api/employee";
import {
  createComment,
  deleteComment,
  getAttachments,
  getComments,
  getTask,
  updateComment,
  updateTask,
  updateTaskStatus,
} from "../../services/api/task";

import { Button } from "../common/Button";
import { Loader } from "../common/Loader";

export default function TaskDetailPanel({ projectId, taskId, onClose, onAddSubtask, currentUser }) {
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editCommentId, setEditCommentId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    assignee_emp_id: "",
    start_date: "",
    due_date: "",
    progress: 0,
  });

  // ---------------------------
  // 데이터 불러오기
  // ---------------------------
  const fetchData = async () => {
    try {
      setLoading(true);
      const [taskRes, commentRes, attachRes, empRes] = await Promise.all([
        getTask(projectId, taskId),
        getComments(projectId, taskId),
        getAttachments(projectId, taskId),
        getEmployees(),
      ]);
      setTask(taskRes);
      setComments(commentRes);
      setAttachments(attachRes);
      setEmployees(empRes);
      setEditForm({
        title: taskRes.title || "",
        description: taskRes.description || "",
        assignee_emp_id: taskRes.assignee_emp_id || "",
        start_date: taskRes.start_date || "",
        due_date: taskRes.due_date || "",
        progress: taskRes.progress ?? 0,
      });
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
  // ESC 키로 닫기
  // ---------------------------
  useEffect(() => {
    const handleEsc = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // ---------------------------
  // 상태 변경
  // ---------------------------
  const handleStatusChange = async e => {
    const newStatus = e.target.value;
    try {
      setUpdatingStatus(true);
      await updateTaskStatus(projectId, taskId, newStatus);
      setTask(prev => ({ ...prev, status: newStatus }));
      toast.success(`상태가 '${newStatus}'로 변경되었습니다.`);
    } catch (err) {
      console.error("상태 변경 실패:", err);
      toast.error("상태 변경에 실패했습니다.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ---------------------------
  // ✅ 업무 수정 관련
  // ---------------------------
  const handleEditChange = e => {
    const { name, value } = e.target;
    const parsedValue =
      ["assignee_emp_id", "progress"].includes(name) && value !== "" ? parseInt(value, 10) : value;
    setEditForm(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleSaveEditTask = async () => {
    try {
      setSaving(true);
      const payload = {
        ...editForm,
        assignee_emp_id: editForm.assignee_emp_id === "" ? null : Number(editForm.assignee_emp_id),
        start_date: editForm.start_date || null,
        due_date: editForm.due_date || null,
      };

      const updated = await updateTask(projectId, taskId, payload);

      // 즉시 반영
      setTask(updated);
      setIsEditing(false);
      toast.success("업무가 수정되었습니다.");
    } catch (err) {
      console.error("업무 수정 실패:", err);
      toast.error("업무 수정 실패");
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------
  // 댓글 등록
  // ---------------------------
  const handleAddComment = async () => {
    if (!newComment.trim()) return toast.error("댓글을 입력하세요.");
    try {
      await createComment(projectId, taskId, { content: newComment });
      setNewComment("");
      toast.success("댓글이 등록되었습니다.");
      fetchData();
    } catch {
      toast.error("댓글 등록 실패");
    }
  };

  const handleCommentKeyDown = e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  // ---------------------------
  // 댓글 수정/삭제 (전버전 스타일)
  // ---------------------------
  const startEditComment = comment => {
    setEditCommentId(comment.comment_id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async commentId => {
    if (!editContent.trim()) return toast.error("내용을 입력하세요.");
    try {
      await updateComment(projectId, taskId, commentId, { content: editContent });
      toast.success("댓글이 수정되었습니다.");
      setEditCommentId(null);
      fetchData();
    } catch {
      toast.error("댓글 수정 실패");
    }
  };

  const handleDeleteComment = async commentId => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
    try {
      await deleteComment(projectId, taskId, commentId);
      setComments(prev => prev.filter(c => c.comment_id !== commentId));
      toast.success("댓글이 삭제되었습니다.");
    } catch {
      toast.error("댓글 삭제 실패");
    }
  };

  // ---------------------------
  // 안전한 닫기
  // ---------------------------
  const handleSafeClose = () => {
    if (isEditing && !window.confirm("저장하지 않은 변경사항이 있습니다. 닫으시겠습니까?")) return;
    onClose();
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
        onClick={e => e.target === e.currentTarget && handleSafeClose()}
      />

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
            position: "sticky",
            top: 0,
            background: "#fff",
            zIndex: 10,
          }}
        >
          {isEditing ? (
            <input
              type="text"
              name="title"
              value={editForm.title}
              onChange={handleEditChange}
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                border: "1px solid #ccc",
                borderRadius: 6,
                padding: "4px 6px",
                width: "80%",
              }}
            />
          ) : (
            <h2 style={{ margin: 0 }}>{task.title}</h2>
          )}

          <button
            onClick={handleSafeClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* 본문 */}
        <div style={{ padding: "16px", flex: 1 }}>
          {/* 수정 모드 */}
          {isEditing ? (
            <>
              <TextareaAutosize
                name="description"
                value={editForm.description}
                onChange={handleEditChange}
                minRows={3}
                style={{
                  width: "100%",
                  border: "1px solid #ccc",
                  borderRadius: 6,
                  padding: 8,
                  marginBottom: 10,
                  fontSize: 14,
                }}
              />

              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <div>
                  <label>시작일</label>
                  <input
                    type="date"
                    name="start_date"
                    value={editForm.start_date}
                    onChange={handleEditChange}
                  />
                </div>
                <div>
                  <label>마감일</label>
                  <input
                    type="date"
                    name="due_date"
                    value={editForm.due_date}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              <div>
                <label>담당자: </label>
                <select
                  name="assignee_emp_id"
                  value={editForm.assignee_emp_id}
                  onChange={handleEditChange}
                >
                  <option value="">미지정</option>
                  {employees.map(emp => (
                    <option key={emp.emp_id} value={emp.emp_id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: 12 }}>
                <label>진행률: </label>
                <input
                  type="range"
                  name="progress"
                  min="0"
                  max="100"
                  value={editForm.progress}
                  onChange={handleEditChange}
                  style={{ width: "70%", marginLeft: 8 }}
                />
                <span style={{ marginLeft: 6 }}>{editForm.progress}%</span>
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <Button variant="primary" onClick={handleSaveEditTask} disabled={saving}>
                  {saving ? "저장 중..." : "저장"}
                </Button>
                <Button variant="secondary" onClick={() => setIsEditing(false)}>
                  취소
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* 보기 모드 */}
              <p style={{ marginBottom: 8, color: "#666" }}>{task.description}</p>

              <div style={{ marginBottom: 8 }}>
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

              <div style={{ margin: "12px 0" }}>
                <label style={{ fontWeight: "bold" }}>진행률: {task.progress ?? 0}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={task.progress ?? 0}
                  onChange={e => {
                    const val = parseInt(e.target.value, 10);
                    setTask(prev => ({ ...prev, progress: val })); // UI만 즉시 반영
                  }}
                  onMouseUp={async e => {
                    const val = parseInt(e.target.value, 10);
                    try {
                      await updateTask(projectId, taskId, { progress: val }); // ✅ 한 번만 호출
                    } catch {
                      toast.error("진행률 변경 실패");
                    }
                  }}
                  style={{ width: "100%" }}
                />
              </div>

              <p>
                <strong>담당자:</strong> {task.assignee_name || "미지정"}
                <br />
                <strong>기간:</strong> {task.start_date} ~ {task.due_date}
              </p>

              <Button variant="outline" onClick={() => setIsEditing(true)}>
                ✏️ 수정
              </Button>
              <Button
                variant="success"
                onClick={() => onAddSubtask(task.task_id)}
                style={{ marginLeft: 10 }}
              >
                ➕ 하위 업무 추가
              </Button>
            </>
          )}

          {/* 첨부 파일 */}
          <div style={{ marginTop: 24 }}>
            <h4>📎 첨부 파일</h4>
            {attachments.length === 0 ? (
              <p style={{ color: "#888" }}>첨부 파일 없음</p>
            ) : (
              <ul>
                {attachments.map(f => (
                  <li key={f.attachment_id}>
                    <a href={f.file_url} target="_blank" rel="noreferrer">
                      {f.file_name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 💬 댓글 (전버전 스타일) */}
          <div style={{ marginTop: 24 }}>
            <h4>💬 댓글</h4>
            {comments.length === 0 ? (
              <p style={{ color: "#888" }}>댓글이 없습니다.</p>
            ) : (
              <ul
                style={{
                  maxHeight: "250px",
                  overflowY: "auto",
                  border: "1px solid #eee",
                  borderRadius: 6,
                  padding: 8,
                }}
              >
                {comments.map(c => (
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
                        <TextareaAutosize
                          value={editContent}
                          onChange={e => setEditContent(e.target.value)}
                          minRows={2}
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

                        {/* 오른쪽 수정/삭제 버튼 */}
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

            {/* 댓글 입력 */}
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <TextareaAutosize
                placeholder="댓글을 입력하세요 (Enter=등록 / Shift+Enter=줄바꿈)"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={handleCommentKeyDown}
                minRows={2}
                style={{
                  flex: 1,
                  border: "1px solid #ccc",
                  borderRadius: 6,
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
