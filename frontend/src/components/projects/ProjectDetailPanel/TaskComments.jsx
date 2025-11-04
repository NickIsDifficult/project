// src/components/project/ProjectDetailPanel/TaskComments.jsx
import { useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { useProjectDetailContext } from "../../../context/ProjectDetailContext";
import Button from "../../common/Button";

export default function TaskComments() {
  const { comments, handleAddComment, handleEditComment, handleDeleteComment } =
    useProjectDetailContext();

  const [editId, setEditId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [newComment, setNewComment] = useState("");

  return (
    <section className="mt-5">
      <h4 className="text-base font-semibold mb-3">💬 댓글</h4>

      {comments.length === 0 ? (
        <p className="text-gray-500 text-sm">댓글이 없습니다.</p>
      ) : (
        <ul className="divide-y border rounded-md p-2 max-h-64 overflow-y-auto">
          {comments.map(c => (
            <li key={c.comment_id} className="py-2 text-sm flex justify-between">
              {editId === c.comment_id ? (
                <div className="flex-1">
                  <TextareaAutosize
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    minRows={2}
                    className="w-full border rounded-md px-2 py-1"
                  />
                  <div className="flex gap-2 mt-1">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        handleEditComment(c.comment_id, editContent);
                        setEditId(null);
                        setEditContent("");
                      }}
                    >
                      저장
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditId(null)}>
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="text-gray-800 break-words">
                      <strong>{c.author_name || "익명"}</strong>: {c.content}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {new Date(c.created_at).toLocaleString("ko-KR")}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditId(c.comment_id);
                        setEditContent(c.content);
                      }}
                    >
                      수정
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteComment(c.comment_id)}
                    >
                      삭제
                    </Button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* 새 댓글 입력 */}
      <div className="mt-3 flex gap-2">
        <TextareaAutosize
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="댓글을 입력하세요"
          minRows={2}
          className="flex-1 border rounded-md px-3 py-2 resize-none"
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAddComment(newComment);
              setNewComment("");
            }
          }}
        />
        <Button
          variant="primary"
          onClick={() => {
            handleAddComment(newComment);
            setNewComment("");
          }}
        >
          등록
        </Button>
      </div>
    </section>
  );
}
