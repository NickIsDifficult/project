// src/pages/screens/Setting/PersonalInfoModal.jsx
import { useEffect, useMemo, useState } from "react";
import "./personal-modal.css";

export default function PersonalInfoModal({ open, onClose, onSave, initial }) {
  const STATUS_OPTIONS = useMemo(
  () => [
    { value: "WORKING", label: "업무중" },
    { value: "FIELD", label: "외근" },
    { value: "AWAY", label: "자리비움" },
    { value: "OFF", label: "퇴근" },
  ],
  []
);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("업무중");

  useEffect(() => {
    if (initial) {
      setName(initial.name || "");
      setEmail(initial.email || "");
      setStatus(initial.status || "업무중");
    }
  }, [initial]);

  if (!open) return null;

  const handleSave = () => {
    onSave({ name, email, status }); // ✅ AppShell에서 current_state 변환 처리
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>개인정보 수정</h2>

        <label>이름</label>
        <input value={name} onChange={(e) => setName(e.target.value)} disabled />

        <label>이메일</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@company.com"
        />

        <label>현재 상태</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <div className="modal-actions">
          <button onClick={handleSave}>저장</button>
          <button onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}
