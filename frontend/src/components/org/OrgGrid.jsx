// src/components/org/OrgGrid.jsx
import ProfileCardOrg from "./ProfileCardOrg";

export default function OrgGrid({ roles = [], employees = [], current }) {
  const byRole = new Map();
  for (const e of employees) {
    const list = byRole.get(e.role_id) || [];
    list.push(e);
    byRole.set(e.role_id, list);
  }

  return (
    <section>
      {roles.map(role => {
        const list = byRole.get(role.role_id) || [];
        return (
          <div key={role.role_id} className="org-row">
            <div className="org-row-title">{role.role_name ?? `직급 ${role.role_no}`}</div>
            <div className="org-cards-box">
              {list.length === 0 ? (
                <div className="org-empty">해당 직급 인원이 없습니다.</div>
              ) : (
                list.map(emp => <ProfileCardOrg key={emp.emp_id} emp={emp} current={current} />)
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
