// src/theme/useTheme.js
import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "theme";           // 'light' | 'dark'
const DARK_CLASS = "theme-dark";       // CSS에서 body.theme-dark ... 를 이미 사용 중

function getSystemPref() {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "dark" || saved === "light" ? saved : getSystemPref();
}

export default function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  // body 에 theme-dark 클래스를 동기화
  useEffect(() => {
    const body = document.body;
    if (!body) return;

    if (theme === "dark") {
      body.classList.add(DARK_CLASS);
    } else {
      body.classList.remove(DARK_CLASS);
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // 시스템 테마 변경도 반영(선택)
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => {
      const saved = localStorage.getItem(STORAGE_KEY);
      // 사용자가 강제로 저장해둔 값이 없을 때만 시스템 변경을 따름
      if (saved !== "dark" && saved !== "light") {
        setTheme(e.matches ? "dark" : "light");
      }
    };
    mql.addEventListener?.("change", handler);
    return () => mql.removeEventListener?.("change", handler);
  }, []);

  const toggleTheme = useMemo(
    () => () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    []
  );

  return { theme, toggleTheme };
}
