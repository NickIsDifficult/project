import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import TextareaAutosize from "react-textarea-autosize";
import Button from "../../common/Button";

export default function TaskComments({ comments, currentUser, onAdd, onEdit, onDelete }) {
  const [localComments, setLocalComments] = useState(comments || []);
  const [newComment, setNewComment] = useState("");
  const [editId, setEditId] = useState(null);
  const [editContent, setEditContent] = useState("");

  // ✅ props로 받은 comments가 변경될 때마다 로컬 상태 동기화
  useEffect(() => {
    if (comments && JSON.stringify(comments) !== JSON.stringify(localComments)) {
      setLocalComments(comments);
    }
  }, [comments]);

  /* ---------------------------
   * 💬 댓글 추가
   * --------------------------- */
  const handleAdd = async () => {
    const content = newComment.trim();
    if (!content) return toast.error("댓글 내용을 입력하세요.");
    try {
      const added = await onAdd(content);
      if (added) setLocalComments(prev => [...prev, added]); // ✅ 즉시 반영
      setNewComment("");
      toast.success("댓글이 등록되었습니다.");
    } catch (err) {
      console.error("❌ 댓글 등록 실패:", err);
      toast.error("댓글 등록에 실패했습니다.");
    }
  };

  /* ---------------------------
   * ✏️ 댓글 수정
   * --------------------------- */
  const handleSaveEdit = async commentId => {
    const content = editContent.trim();
    if (!content) return toast.error("수정할 내용을 입력하세요.");
    try {
      const updated = await onEdit(commentId, content);
      if (updated) {
        setLocalComments(prev => prev.map(c => (c.comment_id === commentId ? updated : c)));
      }
      setEditId(null);
      toast.success("댓글이 수정되었습니다.");
    } catch (err) {
      console.error("❌ 댓글 수정 실패:", err);
      toast.error("댓글 수정에 실패했습니다.");
    }
  };

  /* ---------------------------
   * 🗑️ 댓글 삭제
   * --------------------------- */
  const handleDelete = async commentId => {
    try {
      const success = await onDelete(commentId);
      if (success !== false) {
        setLocalComments(prev => prev.filter(c => c.comment_id !== commentId));
        toast.success("댓글이 삭제되었습니다."); // ✅ 내부에서만 띄움
      }
    } catch (err) {
      console.error("❌ 댓글 삭제 실패:", err);
      toast.error("댓글 삭제에 실패했습니다.");
    }
  };

  /* ---------------------------
   * UI 렌더링
   * --------------------------- */
  return (
    <div style={{ marginTop: 24 }}>
      <h4 style={{ marginBottom: 8 }}>💬 댓글</h4>

      {localComments.length === 0 ? (
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
          {localComments.map(c => (
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
                    <strong>{c.author_name || "알 수 없음"}</strong>: {c.content}
                    <br />
                    <span style={{ color: "#aaa", fontSize: 12 }}>
                      {new Date(c.created_at).toLocaleString("ko-KR", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </span>
                  </div>

                  {currentUser?.emp_id != null &&
                    Number(currentUser.emp_id) === Number(c.emp_id) && (
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
                          onClick={() => handleDelete(c.comment_id)}
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
