// src/components/projects/constants/statusMaps.js
export const STATUS_COLUMNS = [
  { key: "PLANNED", label: "계획 🗂" },
  { key: "IN_PROGRESS", label: "진행 중 🚧" },
  { key: "REVIEW", label: "검토 중 🔍" },
  { key: "ON_HOLD", label: "보류 ⏸" },
  { key: "DONE", label: "완료 ✅" },
];

export const STATUS_LABELS = {
  PLANNED: "계획",
  IN_PROGRESS: "진행 중",
  REVIEW: "검토 중",
  ON_HOLD: "보류",
  DONE: "완료",
};

export const STATUS_COLORS = {
  PLANNED: "#E5E7EB",
  IN_PROGRESS: "#BFDBFE",
  REVIEW: "#C7D2FE",
  ON_HOLD: "#FDE68A",
  DONE: "#BBF7D0",
};
