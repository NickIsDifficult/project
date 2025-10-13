// src/components/tasks/TaskDetailPanel/TaskComments.jsx
import { useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "../../common/Button";

export default function TaskComments({ comments, currentUser, onAdd, onEdit, onDelete }) {
  const [newComment, setNewComment] = useState("");
  const [editId, setEditId] = useState(null);
  const [editContent, setEditContent] = useState("");

  /* ---------------------------
   * 댓글 추가
   * --------------------------- */
  const handleAdd = async () => {
    if (!newComment.trim()) return;
    await onAdd(newComment);
    setNewComment("");
  };

  /* ---------------------------
   * 댓글 수정
   * --------------------------- */
  const handleSaveEdit = async commentId => {
    if (!editContent.trim()) return;
    await onEdit(commentId, editContent);
    setEditId(null);
  };

  return (
    <div style={{ marginTop: 24 }}>
      <h4 style={{ marginBottom: 8 }}>💬 댓글</h4>

      {/* ---------------------------
       * 댓글 목록
       * --------------------------- */}
      {comments.length === 0 ? (
        <p style={{ color: "#888" }}>댓글이 없습니다.</p>
      ) : (
        <ul
          style={{
            maxHeight: 250,
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
              {editId === c.comment_id ? (
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
                      style={{ marginRight: 6 }}
                    >
                      저장
                    </Button>
                    <Button variant="secondary" onClick={() => setEditId(null)}>
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ flex: 1 }}>
                    <strong>{c.author_name}</strong>: {c.content}
                    <br />
                    <span style={{ color: "#aaa", fontSize: 12 }}>
                      {new Date(c.created_at).toLocaleString()}
                    </span>
                  </div>

                  {currentUser?.emp_id === c.emp_id && (
                    <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditId(c.comment_id);
                          setEditContent(c.content);
                        }}
                        style={{ padding: "2px 6px", fontSize: 12 }}
                      >
                        수정
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => onDelete(c.comment_id)}
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

      {/* ---------------------------
       * 댓글 입력창
       * --------------------------- */}
      <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
        <TextareaAutosize
          placeholder="댓글을 입력하세요 (Enter=등록 / Shift+Enter=줄바꿈)"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAdd();
            }
          }}
          minRows={2}
          style={{
            flex: 1,
            border: "1px solid #ccc",
            borderRadius: 6,
            padding: "6px 8px",
            fontSize: 14,
          }}
        />
        <Button variant="primary" onClick={handleAdd}>
          등록
        </Button>
      </div>
    </div>
  );
}
