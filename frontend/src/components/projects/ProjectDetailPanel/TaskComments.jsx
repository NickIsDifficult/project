import { useState } from "react";
import { useProjectDetailContext } from "../../../context/ProjectDetailContext";

export default function TaskComments() {
  const { comments, handleAddComment, handleEditComment, handleDeleteComment } =
    useProjectDetailContext();

  const [editId, setEditId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [newComment, setNewComment] = useState("");

  return (
    <section style={{ marginTop: 20 }}>
      <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>💬 댓글</h4>

      {comments.length === 0 ? (
        <p style={{ color: "#777", fontSize: 14 }}>댓글이 없습니다.</p>
      ) : (
        <ul
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 8,
            maxHeight: 260,
            overflowY: "auto",
            background: "#fff",
          }}
        >
          {comments.map(c => (
            <li
              key={c.comment_id}
              style={{
                padding: "8px 6px",
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              {editId === c.comment_id ? (
                <div style={{ flex: 1 }}>
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    rows={2}
                    style={{
                      width: "100%",
                      border: "1px solid #ccc",
                      borderRadius: 6,
                      padding: "6px 8px",
                      resize: "vertical",
                      fontSize: 14,
                    }}
                  />
                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    <button
                      onClick={() => {
                        handleEditComment(c.comment_id, editContent);
                        setEditId(null);
                        setEditContent("");
                      }}
                      style={{
                        background: "#1976d2",
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        padding: "4px 10px",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      저장
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      style={{
                        background: "#f1f1f1",
                        border: "1px solid #ccc",
                        borderRadius: 6,
                        padding: "4px 10px",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: "#333", marginBottom: 2, wordBreak: "break-word" }}>
                      <strong>{c.author_name || "익명"}</strong>: {c.content}
                    </p>
                    <p style={{ color: "#999", fontSize: 12 }}>
                      {new Date(c.created_at).toLocaleString("ko-KR")}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      onClick={() => {
                        setEditId(c.comment_id);
                        setEditContent(c.content);
                      }}
                      style={{
                        background: "#fff",
                        border: "1px solid #ccc",
                        borderRadius: 6,
                        padding: "4px 8px",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteComment(c.comment_id)}
                      style={{
                        background: "#e53935",
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        padding: "4px 8px",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* 새 댓글 입력 */}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <textarea
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="댓글을 입력하세요"
          rows={2}
          style={{
            flex: 1,
            border: "1px solid #ccc",
            borderRadius: 6,
            padding: "8px 10px",
            fontSize: 14,
            resize: "vertical",
          }}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAddComment(newComment);
              setNewComment("");
            }
          }}
        />
        <button
          onClick={() => {
            handleAddComment(newComment);
            setNewComment("");
          }}
          style={{
            background: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: 6,
            padding: "8px 14px",
            cursor: "pointer",
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          등록
        </button>
      </div>
    </section>
  );
}
