// src/components/tasks/TaskDetailPanel/TaskAttachments.jsx
import { useRef } from "react";
import { Button } from "../../common/ButtonProject";

export default function TaskAttachments({ attachments, onUpload, onDelete }) {
  const fileInputRef = useRef(null);

  const handleFileChange = e => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      e.target.value = "";
    }
  };

  return (
    <div style={{ marginTop: 24 }}>
      <h3>📎 첨부파일</h3>

      <div style={{ marginBottom: 12 }}>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
          파일 업로드
        </Button>
      </div>

      {attachments.length === 0 ? (
        <p style={{ color: "#888" }}>첨부된 파일이 없습니다.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {attachments.map(file => (
            <li
              key={file.attachment_id}
              style={{
                borderBottom: "1px solid #eee",
                padding: "6px 0",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#007bff", textDecoration: "none" }}
              >
                {file.filename}
              </a>
              <Button size="sm" variant="danger" onClick={() => onDelete(file.attachment_id)}>
                삭제
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
