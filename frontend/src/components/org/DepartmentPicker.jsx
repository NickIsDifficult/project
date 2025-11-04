// src/components/org/DepartmentPicker.jsx
import { useEffect, useState } from "react";
import { getDepartments } from "../../services/api/auth";

export default function DepartmentPicker({ value, onChange, disabled = false }) {
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const list = await getDepartments();
        if (alive) setDepts(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error("부서 목록 로딩 실패:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <select
      value={value || ""}
      onChange={e => onChange?.(e.target.value)}
      disabled={disabled || loading}
      style={{ padding: 8, minWidth: 220, borderRadius: 8, width: "auto", maxWidth: 360, flex: "0 0 auto" }}
      aria-label="부서 선택"
    >
      <option value="" disabled>
        부서를 선택하세요
      </option>
      {depts.map(d => (
        <option key={d.dept_id} value={d.dept_no}>
          {d.dept_name}
        </option>
      ))}
    </select>
  );
}
