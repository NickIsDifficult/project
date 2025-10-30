// src/components/projects/ProjectKanbanView/hooks/useKanbanStats.js
import { useMemo } from "react";

/**
 * 상태별 개수 + 완료율 계산
 */
export function useKanbanStats(columns) {
  return useMemo(() => {
    const result = { total: 0, DONE: 0 };
    columns.forEach(col => {
      col.items.forEach(p => {
        result.total += 1;
        if (p.status === "DONE") result.DONE += 1;
        (p.tasks || []).forEach(t => {
          result.total += 1;
          if (t.status === "DONE") result.DONE += 1;
        });
      });
    });
    result.doneRatio = result.total ? Math.round((result.DONE / result.total) * 100) : 0;
    return result;
  }, [columns]);
}
