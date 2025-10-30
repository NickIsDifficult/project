// src/components/project/ProjectDetailPanel/TaskComments.jsx
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import TextareaAutosize from "react-textarea-autosize";
import Button from "../../common/Button";

/**
 * ✅ TaskComments
 * - 댓글 목록 / 작성 / 수정 / 삭제
 * - useTaskDetail의 댓글 핸들러(onAdd/onEdit/onDelete)와 연동
 */
export default function TaskComments({ comments = [], currentUser, onAdd, onEdit, onDelete }) {
  const [localComments, setLocalComments] = useState(comments);
  const [newComment, setNewComment] = useState("");
  const [editId, setEditId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const textareaRef = useRef(null);

  // ✅ props 변경 시 로컬 상태 동기화
  useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  /* --------------------------------
   * 💬 댓글 추가
   * -------------------------------- */
  const handleAdd = async () => {
    const content = newComment.trim();
    if (!content) return toast.error("댓글 내용을 입력하세요.");
    try {
      const added = await onAdd(content);
      if (added) {
        setLocalComments(prev => [...prev, added]);
      }
      setNewComment("");
      textareaRef.current?.focus();
      toast.success("댓글이 등록되었습니다.");
    } catch (err) {
      console.error("❌ 댓글 등록 실패:", err);
      toast.error("댓글 등록 실패");
    }
  };

  /* --------------------------------
   * ✏️ 댓글 수정
   * -------------------------------- */
  const handleSaveEdit = async commentId => {
    const content = editContent.trim();
    if (!content) return toast.error("수정할 내용을 입력하세요.");
    try {
      const updated = await onEdit(commentId, content);
      if (updated) {
        setLocalComments(prev => prev.map(c => (c.comment_id === commentId ? updated : c)));
        toast.success("댓글이 수정되었습니다.");
      }
      setEditId(null);
      setEditContent("");
    } catch (err) {
      console.error("❌ 댓글 수정 실패:", err);
      toast.error("댓글 수정 실패");
    }
  };

  /* --------------------------------
   * 🗑️ 댓글 삭제
   * -------------------------------- */
  const handleDelete = async commentId => {
    try {
      const success = await onDelete(commentId);
      if (success !== false) {
        setLocalComments(prev => prev.filter(c => c.comment_id !== commentId));
        toast.success("댓글이 삭제되었습니다.");
      }
    } catch (err) {
      console.error("❌ 댓글 삭제 실패:", err);
      toast.error("댓글 삭제 실패");
    }
  };

  /* --------------------------------
   * 🧱 UI 렌더링
   * -------------------------------- */
  return (
    <section className="mt-6">
      <h4 className="text-base font-semibold text-gray-800 mb-3">💬 댓글</h4>

      {/* 댓글 목록 */}
      {localComments.length === 0 ? (
        <p className="text-gray-500 text-sm">댓글이 없습니다.</p>
      ) : (
        <ul className="max-h-64 overflow-y-auto border border-gray-200 rounded-md p-2 divide-y divide-gray-100">
          {localComments.map(c => (
            <li key={c.comment_id} className="py-2 flex justify-between items-start text-sm">
              {editId === c.comment_id ? (
                // ✏️ 수정 모드
                <div className="flex-1">
                  <TextareaAutosize
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    minRows={2}
                    className="w-full border border-gray-300 rounded-md px-2 py-1 focus:ring-1 focus:ring-blue-400"
                  />
                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSaveEdit(c.comment_id)}
                    >
                      저장
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setEditId(null)}>
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="text-gray-800 break-words">
                      <strong>{c.author_name || "알 수 없음"}</strong>: {c.content}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      {new Date(c.created_at).toLocaleString("ko-KR", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </p>
                  </div>

                  {/* 본인 댓글만 수정/삭제 */}
                  {currentUser?.emp_id && Number(currentUser.emp_id) === Number(c.emp_id) && (
                    <div className="flex gap-2 ml-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditId(c.comment_id);
                          setEditContent(c.content);
                        }}
                      >
                        수정
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          if (window.confirm("이 댓글을 삭제하시겠습니까?")) {
                            handleDelete(c.comment_id);
                          }
                        }}
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

      {/* 댓글 작성 입력란 */}
      <div className="mt-3 flex gap-2">
        <TextareaAutosize
          ref={textareaRef}
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
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-400 resize-none"
        />
        <Button variant="primary" onClick={handleAdd} disabled={!newComment.trim()}>
          등록
        </Button>
      </div>
    </section>
  );
}
