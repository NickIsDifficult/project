// src/components/projects/utils/renderTooltip.js
import { PRIORITY_META, STATUS_META } from "../constants/taskDisplay";

/**
 * Tooltip 렌더링 (프로젝트 / 업무 공용)
 */
export function renderTooltip(event, isProject = false) {
  const data = event.extendedProps || {};
  const title = event.title || data.title || data.task_name || data.project_name || "제목 없음";

  // 상태 / 우선순위
  const status = data.status || "PLANNED";
  const s = STATUS_META[status] || STATUS_META.PLANNED;
  const p = PRIORITY_META[data.priority] || PRIORITY_META.MEDIUM;

  // 기간
  const start = data.start_date || event.startStr || "?";
  const end = data.due_date || data.end_date || event.endStr || "?";

  const progress = data.progress_percent ?? data.progress ?? null;

  // ✅ 담당자 정보
  let assigneeText = "";
  if (Array.isArray(data.assignees) && data.assignees.length > 0) {
    assigneeText = data.assignees.map(a => a.name).join(", ");
  } else if (data.assignee_name) {
    assigneeText = data.assignee_name;
  }

  return `
    <div class="tippy-tooltip-content">
      <div class="tooltip-header" style="background:${s.color};">
        <span class="tooltip-icon">${isProject ? "📁" : s.icon}</span>
        <strong>${title}</strong>
      </div>
      <div class="tooltip-body">
        <p><b>유형:</b> ${isProject ? "프로젝트" : "업무"}</p>
        <p><b>상태:</b> ${s.label}</p>
        ${assigneeText ? `<p><b>담당자:</b> ${assigneeText}</p>` : ""}
        ${data.project_name && !isProject ? `<p><b>프로젝트:</b> ${data.project_name}</p>` : ""}
        ${data.priority ? `<p><b>우선순위:</b> ${p.icon} ${p.label}</p>` : ""}
        ${progress !== null ? `<p><b>진행률:</b> ${progress}%</p>` : ""}
        <p><b>기간:</b> ${start} ~ ${end}</p>
      </div>
    </div>
  `;
}
