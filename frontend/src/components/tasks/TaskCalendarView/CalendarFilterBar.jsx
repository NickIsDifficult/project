export default function CalendarFilterBar({
  projects,
  activeProjectIds,
  setActiveProjectIds,
  colorMode,
  setColorMode,
}) {
  return (
    <div className="flex gap-3 items-center mb-2">
      <select
        multiple
        value={activeProjectIds}
        onChange={e =>
          setActiveProjectIds(Array.from(e.target.selectedOptions, opt => Number(opt.value)))
        }
        className="border rounded px-2 py-1 text-sm"
      >
        {projects.map(p => (
          <option key={p.project_id} value={p.project_id}>
            {p.project_name}
          </option>
        ))}
      </select>

      <button
        className="border rounded px-2 py-1 text-sm"
        onClick={() => setColorMode(prev => (prev === "assignee" ? "status" : "assignee"))}
      >
        🎨 색상모드: {colorMode === "assignee" ? "담당자" : "상태"}
      </button>
    </div>
  );
}
