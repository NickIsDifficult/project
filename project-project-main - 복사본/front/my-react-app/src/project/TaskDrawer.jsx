import React, { useState } from "react";
import "./components/TaskDrawer.css"; // 같은 폴더에 TaskDrawer.css 있어야 함

export default function TaskDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {/* 버튼 */}
      <button className="btn" onClick={() => setOpen(true)}>
        업무 등록
      </button>

      {/* 오버레이 (검은 배경) */}
      {open && <div className="overlay" onClick={() => setOpen(false)} />}

      {/* Drawer */}
      <aside className={`drawer ${open ? "open" : ""}`}>
        <div className="drawer__header">
          <h2>업무 등록</h2>
          <button className="close" onClick={() => setOpen(false)}>
            ✕
          </button>
        </div>

        <form
          className="drawer__body"
          onSubmit={(e) => {
            e.preventDefault();
            alert("업무가 저장되었습니다!");
            setOpen(false);
          }}
        >
          <label>업무 제목</label>
          <input type="text" placeholder="업무 제목 입력" />

          <label>업무 내용</label>
          <textarea placeholder="업무 내용 입력" rows={5} />

          <div className="drawer__footer">
            <button type="button" className="btn secondary" onClick={() => setOpen(false)}>
              취소
            </button>
            <button type="submit" className="btn primary">
              저장
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
