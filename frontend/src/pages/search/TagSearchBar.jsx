import React, { useEffect, useMemo, useRef, useState } from "react";

export default function TagSearchBar({
  value,
  onChange,
  tags,
  onTagsChange,
  suggestions = [],             // 자동완성 후보 (문자열 배열)
  onSubmit,                      // Enter 시 검색 수행
  placeholder = "검색어를 입력하고, 쉼표(,) 또는 Enter로 태그 추가",
}) {
  const [input, setInput] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // 입력값 기반 자동완성 후보 필터
  const filtered = useMemo(() => {
    const q = input.trim().toLowerCase();
    const rest = suggestions.filter(s =>
      s.toLowerCase().includes(q) && !tags.includes(s)
    );
    return rest.slice(0, 8);
  }, [input, suggestions, tags]);

  useEffect(() => setInput(value || ""), [value]);

  const commitTag = (raw) => {
    const t = (raw || "").trim();
    if (!t) return;
    if (tags.includes(t)) return;
    onTagsChange?.([...tags, t]);
    setActiveIndex(-1);
  };

  const removeTag = (t) => {
    onTagsChange?.(tags.filter(x => x !== t));
    inputRef.current?.focus();
  };

  const onKeyDown = (e) => {
    // Backspace: 입력 공백이면 마지막 태그 제거
    if (e.key === "Backspace" && input === "" && tags.length) {
      e.preventDefault();
      removeTag(tags[tags.length - 1]);
      return;
    }
    // Enter: 태그 확정 또는 검색
    if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && filtered[activeIndex]) {
        commitTag(filtered[activeIndex]);
        setInput("");
        setOpen(false);
        return;
      }
      // 콤마/스페이스 없이도 Enter로 태그 확정
      if (input.trim()) {
        commitTag(input);
        setInput("");
        setOpen(false);
        return;
      }
      // 태그/입력이 없으면 검색 실행
      onSubmit?.();
      return;
    }
    // 콤마로 태그화
    if (e.key === "," || (e.key === " " && input.endsWith(","))) {
      e.preventDefault();
      const token = input.replace(/,+$/, "");
      if (token.trim()) commitTag(token);
      setInput("");
      setOpen(false);
      return;
    }
    // 화살표로 후보 이동
    if (open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      const dir = e.key === "ArrowDown" ? 1 : -1;
      const next = (activeIndex + dir + filtered.length) % Math.max(filtered.length, 1);
      setActiveIndex(filtered.length ? next : -1);
    }
    // Esc: 닫기
    if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  // 붙여넣기에서 콤마/개행으로 태그 여러 개 처리
  const onPaste = (e) => {
    const text = e.clipboardData.getData("text");
    if (text && /[,\n]/.test(text)) {
      e.preventDefault();
      const parts = text.split(/[,|\n]/).map(s => s.trim()).filter(Boolean);
      if (parts.length) onTagsChange?.([...new Set([...tags, ...parts])]);
    }
  };

  return (
    <div className="tsb-root" onKeyDown={onKeyDown}>
      {/* 태그 칩들 */}
      <div className="tsb-inputwrap" onClick={() => inputRef.current?.focus()}>
        {tags.map((t) => (
          <span key={t} className="tsb-chip" title={t}>
            <span className="tsb-chip-text">{t}</span>
            <button className="tsb-chip-x" onClick={() => removeTag(t)} aria-label={`${t} 제거`}>×</button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            onChange?.(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={(e) => {
            // 후보 클릭 허용 위해 약간 지연 후 닫기
            setTimeout(() => setOpen(false), 120);
          }}
          onPaste={onPaste}
          placeholder={placeholder}
          className="tsb-input"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls="tsb-listbox"
        />
      </div>

      {/* 자동완성 드롭다운 */}
      {open && filtered.length > 0 && (
        <ul
          id="tsb-listbox"
          role="listbox"
          className="tsb-pop"
          ref={listRef}
        >
          {filtered.map((s, i) => (
            <li
              key={s}
              role="option"
              aria-selected={activeIndex === i}
              className={`tsb-item ${activeIndex === i ? "is-active" : ""}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                commitTag(s);
                setInput("");
                setOpen(false);
              }}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
