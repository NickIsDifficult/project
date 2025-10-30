// src/components/projects/constants/taskDisplay.jsx

/**
 * ✅ 공용 업무 표시 유틸 (리스트 / 칸반 / 캘린더 통합용)
 * - 상태별 색상, 아이콘, 레이블
 * - 담당자 이름 추출
 * - 우선순위 색상도 포함
 */

// -------------------- 상태 정의 --------------------
export const STATUS_META = {
  PLANNED: {
    label: "계획",
    icon: "🗂️",
    color: "#FFF9C4", // 연노랑
    textColor: "#555",
  },
  IN_PROGRESS: {
    label: "진행중",
    icon: "🚧",
    color: "#BBDEFB", // 연파랑
    textColor: "#0D47A1",
  },
  REVIEW: {
    label: "검토중",
    icon: "🔍",
    color: "#FFE082", // 주황
    textColor: "#6D4C41",
  },
  ON_HOLD: {
    label: "보류",
    icon: "⏸️",
    color: "#E0E0E0", // 회색
    textColor: "#555",
  },
  DONE: {
    label: "완료",
    icon: "✅",
    color: "#C8E6C9", // 연초록
    textColor: "#2E7D32",
  },
};

// -------------------- 우선순위 정의 --------------------
export const PRIORITY_META = {
  LOW: { label: "낮음", icon: "🌱", color: "#E3F2FD" },
  MEDIUM: { label: "보통", icon: "⚖️", color: "#FFF9C4" },
  HIGH: { label: "높음", icon: "🔥", color: "#FFE0B2" },
  URGENT: { label: "긴급", icon: "🚨", color: "#FFCDD2" },
};

// -------------------- 헬퍼 함수 --------------------
export function getStatusLabel(status) {
  return STATUS_META[status]?.label || "미정";
}

export function getStatusIcon(status) {
  return STATUS_META[status]?.icon || "❔";
}

export function getStatusColor(status) {
  return STATUS_META[status]?.color || "#eee";
}

export function getStatusTextColor(status) {
  return STATUS_META[status]?.textColor || "#333";
}

export function getPriorityLabel(priority) {
  return PRIORITY_META[priority]?.label || "보통";
}

export function getPriorityColor(priority) {
  return PRIORITY_META[priority]?.color || "#fafafa";
}

export function getAssigneeNames(task) {
  if (!task) return [];
  if (task.assignees?.length) return task.assignees.map(a => a.name);
  if (task.assignee_name) return [task.assignee_name];
  return [];
}

/**
 * 🎨 태스크 배지 렌더링 (공통 스타일)
 */
export function renderStatusBadge(status) {
  const meta = STATUS_META[status] || STATUS_META.PLANNED;
  return (
    <span
      style={{
        background: meta.color,
        color: meta.textColor,
        borderRadius: 6,
        padding: "1px 6px",
        fontSize: 12,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <span>{meta.icon}</span>
      <span>{meta.label}</span>
    </span>
  );
}
