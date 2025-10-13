// src/components/tasks/TaskDetailPanel/TaskAttachments.jsx
import React from "react";

export default function TaskAttachments({ attachments, onUpload, onDelete }) {
  const handleFileChange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    await onUpload(file);
    e.target.value = null; // 같은 파일 다시 선택 가능하게
  };

  return (
    <div style={{ marginTop: 24 }}>
      <h4 style={{ fontWeight: "bold", marginBottom: 8 }}>📎 첨부 파일</h4>

      <div style={{ marginBottom: 10 }}>
        <input
          type="file"
          id="file-upload"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <label
          htmlFor="file-upload"
          style={{
            display: "inline-block",
            background: "#f3f4f6",
            border: "1px solid #ddd",
            borderRadius: 6,
            padding: "6px 12px",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          📤 파일 추가
        </label>
      </div>

      {attachments.length === 0 ? (
        <p style={{ color: "#888", fontSize: 13 }}>첨부 파일 없음</p>
      ) : (
        <ul style={{ paddingLeft: 0, listStyle: "none" }}>
          {attachments.map(file => (
            <li
              key={file.attachment_id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #eee",
                padding: "6px 0",
              }}
            >
              <a
                href={file.file_url}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: "none", color: "#007bff" }}
              >
                📄 {file.file_name}
              </a>
              <button
                onClick={() => onDelete(file.attachment_id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#e74c3c",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                ❌
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
