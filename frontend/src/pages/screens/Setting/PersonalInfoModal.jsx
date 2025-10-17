// src/screens/Setting/PersonalInfoModal.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./personal-modal.css";
import vector from "./vector.svg";

export default function PersonalInfoModal({ open, onClose, onSave, initial = {} }) {
  const STATUS_OPTIONS = useMemo(
    () => [
      { value: "WORKING", label: "업무중" },
      { value: "FIELD", label: "외근" },
      { value: "AWAY", label: "자리비움" },
      { value: "OFF", label: "퇴근" },
    ],
    []
  );

  const [status, setStatus] = useState(initial.status || "WORKING");
  const [name, setName] = useState(initial.name || "");
  const [email, setEmail] = useState(initial.email || "");
  const [curPw, setCurPw] = useState("");
  const [nextPw, setNextPw] = useState("");
  const [nextPw2, setNextPw2] = useState("");
  const [errors, setErrors] = useState({});

  // === 드래그 관련 ===
  const cardRef = useRef(null);
  const [pos, setPos] = useState({ x: null, y: null }); // 처음엔 null로 두고 open 시 중앙 배치
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, startLeft: 0, startTop: 0 });

  useEffect(() => {
    if (open) {
      setStatus(initial.status || "WORKING");
      setName(initial.name || "");
      setEmail(initial.email || "");
      setCurPw("");
      setNextPw("");
      setNextPw2("");
      setErrors({});

      // 팝업 중앙 정렬 초기 위치 계산
      requestAnimationFrame(() => {
        const width = 420; // 카드 폭 (CSS와 일치)
        const left = Math.max(12, (window.innerWidth - width) / 2);
        const top = Math.max(24, window.innerHeight * 0.18);
        setPos({ x: left, y: top });
      });
    }
  }, [open, initial]);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragState.current.dragging) return;
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      let nextLeft = dragState.current.startLeft + dx;
      let nextTop = dragState.current.startTop + dy;

      // 화면 경계 내로 제한
      const cardEl = cardRef.current;
      const cardW = cardEl?.offsetWidth ?? 420;
      const cardH = cardEl?.offsetHeight ?? 300;
      nextLeft = Math.min(Math.max(8, nextLeft), window.innerWidth - cardW - 8);
      nextTop = Math.min(Math.max(8, nextTop), window.innerHeight - cardH - 8);

      setPos({ x: nextLeft, y: nextTop });
    };
    const onMouseUp = () => (dragState.current.dragging = false);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const beginDrag = (e) => {
    // 헤더 부분에서만 드래그 시작
    const cardEl = cardRef.current;
    if (!cardEl) return;
    dragState.current.dragging = true;
    dragState.current.startX = e.clientX;
    dragState.current.startY = e.clientY;
    dragState.current.startLeft = pos.x ?? 0;
    dragState.current.startTop = pos.y ?? 0;
  };

  if (!open) return null;

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "이름을 입력하세요.";
    if (!email.trim()) e.email = "이메일을 입력하세요.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "이메일 형식이 올바르지 않습니다.";

    if (curPw || nextPw || nextPw2) {
      if (!curPw) e.curPw = "현재 비밀번호를 입력하세요.";
      if (!nextPw) e.nextPw = "새 비밀번호를 입력하세요.";
      else if (nextPw.length < 8) e.nextPw = "새 비밀번호는 8자 이상이어야 합니다.";
      if (nextPw !== nextPw2) e.nextPw2 = "새 비밀번호가 일치하지 않습니다.";
      if (curPw && nextPw && curPw === nextPw) e.nextPw = "현재 비밀번호와 다르게 설정하세요.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = { status, name: name.trim(), email: email.trim() };
    if (curPw || nextPw || nextPw2) payload.password = { current: curPw, next: nextPw };
    onSave?.(payload);
  };

  return (
    <div className="pmodal-overlay" role="dialog" aria-modal="true" aria-labelledby="pmodal-title">
      {/* pos.x/pos.y를 고정 좌표로 사용 */}
      <div
        ref={cardRef}
        className="pmodal-card"
        style={{ left: pos.x ?? 0, top: pos.y ?? 0 }}
      >
        <button className="pmodal-close" aria-label="닫기" onClick={onClose}>✕</button>

        {/* 드래그 핸들: 헤더 */}
        <header className="pmodal-header" onMouseDown={beginDrag}>
          <div className="pmodal-avatar-frame">
            <img src={vector} alt="profile" className="pmodal-avatar" />
          </div>
          <h2 id="pmodal-title" className="pmodal-title">개인정보 수정</h2>
        </header>

        <form className="pmodal-form" onSubmit={handleSave}>
          {/* 개인 상태 */}
          <label className="pmodal-label">
            개인 상태
            <select
              className="pmodal-input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>

          {/* 이름 */}
          <label className="pmodal-label">
            이름
            <input
              className={`pmodal-input ${errors.name ? "pmodal-input--error" : ""}`}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={50}
            />
            {errors.name && <span className="pmodal-error">{errors.name}</span>}
          </label>

          {/* 이메일 */}
          <label className="pmodal-label">
            이메일
            <input
              className={`pmodal-input ${errors.email ? "pmodal-input--error" : ""}`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
            />
            {errors.email && <span className="pmodal-error">{errors.email}</span>}
          </label>

          {/* 비밀번호 변경(선택) */}
          <fieldset className="pmodal-fieldset">
            <legend className="pmodal-legend">로그인 비밀번호 변경 (선택)</legend>

            <label className="pmodal-label">
              현재 비밀번호
              <input
                className={`pmodal-input ${errors.curPw ? "pmodal-input--error" : ""}`}
                type="password"
                value={curPw}
                onChange={(e) => setCurPw(e.target.value)}
              />
              {errors.curPw && <span className="pmodal-error">{errors.curPw}</span>}
            </label>

            <label className="pmodal-label">
              새 비밀번호
              <input
                className={`pmodal-input ${errors.nextPw ? "pmodal-input--error" : ""}`}
                type="password"
                value={nextPw}
                onChange={(e) => setNextPw(e.target.value)}
              />
              {errors.nextPw && <span className="pmodal-error">{errors.nextPw}</span>}
            </label>

            <label className="pmodal-label">
              새 비밀번호 확인
              <input
                className={`pmodal-input ${errors.nextPw2 ? "pmodal-input--error" : ""}`}
                type="password"
                value={nextPw2}
                onChange={(e) => setNextPw2(e.target.value)}
              />
              {errors.nextPw2 && <span className="pmodal-error">{errors.nextPw2}</span>}
            </label>
          </fieldset>

          <div className="pmodal-actions">
            <button type="button" className="pmodal-btn pmodal-btn--ghost" onClick={onClose}>취소</button>
            <button type="submit" className="pmodal-btn pmodal-btn--primary">저장</button>
          </div>
        </form>
      </div>
    </div>
  );
}
