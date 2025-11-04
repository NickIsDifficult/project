import { useRef } from "react";
import { useProjectDetailContext } from "../../../context/ProjectDetailContext";

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
    <section style={{ marginTop: 20 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>📎 첨부파일</h3>

      <div style={{ marginBottom: 10 }}>
        <input type="file" ref={fileRef} style={{ display: "none" }} onChange={handleChange} />
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            background: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: 6,
            padding: "6px 10px",
            cursor: "pointer",
          }}
        >
          📤 파일 업로드
        </button>
      </div>

      {attachments.length === 0 ? (
        <p style={{ color: "#777", fontSize: 14 }}>첨부된 파일이 없습니다.</p>
      ) : (
        <ul
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            overflow: "hidden",
            listStyle: "none",
            margin: 0,
            padding: 0,
          }}
        >
          {attachments.map(file => (
            <li
              key={file.attachment_id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #eee",
                padding: "6px 10px",
              }}
            >
              <a
                href={file.url || file.file_path}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#1976d2",
                  textDecoration: "none",
                  wordBreak: "break-all",
                }}
              >
                {file.filename || file.file_name}
              </a>
              <button
                onClick={() => handleDeleteFile(file.attachment_id)}
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
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
