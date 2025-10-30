// src/components/projects/ProjectCalendarView/useCalendarSettings.js
// ✅ 로컬 설정 통합 Hook (colorMode, activeProjectIds)
import { useEffect, useState } from "react";

export function useCalendarSettings() {
  const [colorMode, setColorMode] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("calendar_settings"))?.colorMode || "project";
    } catch {
      return "project";
    }
  });

  const [activeProjectIds, setActiveProjectIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("calendar_settings"))?.activeProjectIds || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("calendar_settings", JSON.stringify({ colorMode, activeProjectIds }));
  }, [colorMode, activeProjectIds]);

  return { colorMode, setColorMode, activeProjectIds, setActiveProjectIds };
}
