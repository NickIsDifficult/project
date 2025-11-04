// src/components/org/ProfileCardOrg.jsx
import { useMemo, useState } from "react";
import ResponsibilityEditor from "./ResponsibilityEditor";
import "../../layout/profile-card.css";

const STATUS_LABELS = { WORKING: "업무중", FIELD: "외근", AWAY: "자리비움", OFF: "퇴근" };
const STATUS_COLOR = { WORKING: "#4CAF50", FIELD: "#E53935", AWAY: "#FFC107", OFF: "#BDBDBD" };

function getAccessToken() {
  try { return localStorage.getItem("access_token") || null; } catch { return null; }
}
function base64UrlDecode(str) {
  try {
    const pad = "=".repeat((4 - (str.length % 4)) % 4);
    const b64 = (str + pad).replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);
    try {
      return decodeURIComponent(bin.split("").map(c => "%" + ("00"+c.charCodeAt(0).toString(16)).slice(-2)).join(""));
    } catch { return bin; }
  } catch { return ""; }
}
function readSelfFromToken() {
  const t = getAccessToken();
  if (!t || typeof t !== "string") return { empId: null, email: null };
  const parts = t.split(".");
  if (parts.length !== 3) return { empId: null, email: null };
  try {
    const p = JSON.parse(base64UrlDecode(parts[1]) || "{}");
    const idCands = [p?.emp_id, p?.member?.emp_id, p?.employee?.emp_id, p?.member?.employee?.emp_id];
    let empId = null;
    for (const v of idCands) { const n = Number(v); if (Number.isFinite(n) && n > 0) { empId = n; break; } }
    const mailCands = [p?.email, p?.member?.email, p?.employee?.email, p?.member?.employee?.email];
    let email = null;
    for (const v of mailCands) { if (typeof v === "string" && v.includes("@")) { email = v; break; } }
    return { empId, email };
  } catch { return { empId: null, email: null }; }
}

export default function ProfileCardOrg({ emp, current }) {
  const [open, setOpen] = useState(false);

  const isSelf = useMemo(() => {
    const token = readSelfFromToken();
    const meEmpId = Number(
      current?.emp_id ??
      current?.member?.emp_id ??
      current?.employee?.emp_id ??
      token.empId
    );
    const meEmail = (
      current?.email ??
      current?.member?.email ??
      current?.employee?.email ??
      token.email ??
      ""
    ).toLowerCase();

    const idMatch = Number(emp?.emp_id) === meEmpId && Number.isFinite(meEmpId);
    const emailMatch = meEmail && typeof emp?.email === "string" && emp.email.toLowerCase() === meEmail;
    return Boolean(idMatch || emailMatch);
  }, [current, emp]);

  if (!emp) return null;

  const state = String(emp?.current_state || "OFF").toUpperCase();

  return (
    <div className="profile-card profile-card--org">
      <div className="profile-avatar">
        <img
          src={emp?.avatar_url || "/assets/avatar.png"}
          alt="avatar"
          onError={e => {
            e.currentTarget.onerror = null;
            e.currentTarget.src =
              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="%23cbd5e1"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>';
          }}
        />
      </div>

      <div className="profile-info" style={{ minWidth: 160, textAlign: "center" }}>
        <div className="profile-name" style={{ color: "#222" }}>{emp.name}</div>
        <div className="profile-email" style={{ color: "#666" }}>
          {(emp.role_name ?? `직급 ${emp.role_no}`) + " · " + (emp.email || "")}
        </div>
      </div>

      <div className="profile-actions">
        <div
          className={`status-dot ${state === "OFF" ? "status-dot--off" : ""}`}
          style={{ backgroundColor: STATUS_COLOR[state] }}
          title={`현재 상태: ${STATUS_LABELS[state] ?? state}`}
        >
          {state === "OFF" && <div className="status-dot-inner" />}
        </div>
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="resp-btn"
          aria-expanded={open}
        >
          {open ? "담당업무 닫기" : "담당업무"}
        </button>
      </div>

      {open && (
        <div className="org-resp-popover" role="dialog" aria-label="담당업무">
          <div className="org-resp-header">담당업무</div>
          <div className="org-resp-body">
            {/* 본인일 때 즉시 입력칸 + 저장 버튼 노출 */}
            <ResponsibilityEditor empId={emp.emp_id} canEdit={isSelf} />
          </div>
        </div>
      )}
    </div>
  );
}
