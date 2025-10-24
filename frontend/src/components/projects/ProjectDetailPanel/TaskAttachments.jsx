// src/components/project/ProjectDetailPanel/TaskAttachments.jsx
import { useRef } from "react";
import toast from "react-hot-toast";
import Button from "../../common/Button";

/**
 * ✅ TaskAttachments
 * - 첨부파일 업로드 / 삭제 섹션
 * - ProjectDetailPanel 및 useTaskDetail과 연동
 */
export default function TaskAttachments({ attachments = [], onUpload, onDelete }) {
  const fileInputRef = useRef(null);

  const handleFileChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("10MB 이하의 파일만 업로드 가능합니다.");
      e.target.value = "";
      return;
    }
    onUpload(file);
    e.target.value = ""; // 파일 선택 초기화
  };

  return (
    <section className="mt-6">
      <h3 className="text-base font-semibold text-gray-800 mb-3">📎 첨부파일</h3>

      {/* 업로드 버튼 */}
      <div className="mb-3">
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
        <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
          📤 파일 업로드
        </Button>
      </div>

      {/* 첨부 파일 목록 */}
      {attachments.length === 0 ? (
        <p className="text-gray-500 text-sm">첨부된 파일이 없습니다.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {attachments.map(file => (
            <li key={file.attachment_id} className="flex justify-between items-center py-2">
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all"
              >
                {file.filename}
              </a>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  if (window.confirm("이 파일을 삭제하시겠습니까?")) {
                    onDelete(file.attachment_id);
                  }
                }}
              >
                삭제
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
