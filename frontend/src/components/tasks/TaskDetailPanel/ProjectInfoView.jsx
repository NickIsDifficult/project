import { format } from "date-fns";
import { ko } from "date-fns/locale";

const STATUS_LABELS = {
  PLANNING: "🗓️ 계획중",
  IN_PROGRESS: "🚧 진행중",
  DONE: "✅ 완료",
  ON_HOLD: "⏸️ 보류",
};

/**
 * ✅ ProjectInfoView
 * - 프로젝트 상세 보기 (읽기 전용)
 * - ListView / Kanban / Calendar / Panel 공통 사용
 */
export default function ProjectInfoView({ project }) {
  if (!project)
    return (
      <p className="text-gray-500 text-sm text-center mt-6">
        프로젝트 데이터를 불러올 수 없습니다.
      </p>
    );

  const formatDate = date => {
    if (!date) return "미정";
    try {
      return format(new Date(date), "yyyy.MM.dd", { locale: ko });
    } catch {
      return "미정";
    }
  };

  const title = project.title || project.project_name || "제목 없음";
  const desc = project.description || "설명 없음";
  const statusLabel = STATUS_LABELS[project.status] || "미정";

  return (
    <div className="space-y-4">
      {/* 기본 정보 */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-600 whitespace-pre-wrap">{desc}</p>
      </div>

      {/* 주요 속성 */}
      <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-700">
        <p>
          <span className="font-medium text-gray-600">👤 담당자(소유자):</span>{" "}
          {project.owner_name || "미지정"}
        </p>
        <p>
          <span className="font-medium text-gray-600">📅 기간:</span>{" "}
          {`${formatDate(project.start_date)} ~ ${formatDate(project.end_date)}`}
        </p>
        <p>
          <span className="font-medium text-gray-600">📊 상태:</span> {statusLabel}
        </p>
        <p>
          <span className="font-medium text-gray-600">📁 진행률:</span>{" "}
          {project.progress != null ? `${project.progress}%` : "미정"}
        </p>
      </div>

      {/* 참여 인원 */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-1">👥 참여 멤버</h4>
        {project.members?.length ? (
          <ul className="list-disc list-inside text-sm text-gray-600">
            {project.members.map(m => (
              <li key={m.emp_id}>
                {m.name} ({m.role_name})
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">참여 인원이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
