// src/components/project/ProjectDetailPanel/TaskAttachments.jsx
import { useRef } from "react";
import { useProjectDetailContext } from "../../../context/ProjectDetailContext";
import Button from "../../common/Button";

export default function TaskAttachments() {
  const { attachments, handleUploadFile, handleDeleteFile } = useProjectDetailContext();
  const fileRef = useRef(null);

  const handleChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleUploadFile(file);
    e.target.value = "";
  };

  return (
    <section className="mt-4">
      <h3 className="text-base font-semibold mb-2">📎 첨부파일</h3>

      <div className="mb-3">
        <input type="file" ref={fileRef} className="hidden" onChange={handleChange} />
        <Button variant="secondary" onClick={() => fileRef.current?.click()}>
          📤 파일 업로드
        </Button>
      </div>

      {attachments.length === 0 ? (
        <p className="text-sm text-gray-500">첨부된 파일이 없습니다.</p>
      ) : (
        <ul className="divide-y border rounded-md">
          {attachments.map(file => (
            <li key={file.attachment_id} className="flex justify-between items-center px-3 py-2">
              <a
                href={file.url || file.file_path}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all"
              >
                {file.filename || file.file_name}
              </a>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleDeleteFile(file.attachment_id)}
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
