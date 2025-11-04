// path: src/pages/org/OrgChart.jsx
import { useEffect, useState } from "react";
import DepartmentPicker from "../../components/org/DepartmentPicker";
import AppShell from "../../layout/AppShell";
import OrgGrid from "../../components/org/OrgGrid";
import { fetchOrgChart } from "../../services/api/orgchart";
import { getMe } from "../../services/api/auth";

export default function OrgChart() {
  const [deptNo, setDeptNo] = useState("");
  const [org, setOrg] = useState({ department: null, roles: [], employees: [] });
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getMe();
        setMe(data?.member ?? data ?? null);
      } catch (e) {
        console.error("getMe 실패:", e);
      }
    })();
  }, []);

  useEffect(() => {
    if (!deptNo) return;
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchOrgChart(deptNo);
        if (alive) setOrg(data);
      } catch (e) {
        console.error("org-chart 로딩 실패:", e);
        if (alive) setOrg({ department: null, roles: [], employees: [] });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [deptNo]);

  const refresh = async () => {
    if (!deptNo) return;
    try {
      setLoading(true);
      const data = await fetchOrgChart(deptNo);
      setOrg(data);
    } catch (e) {
      console.error("org-chart 새로고침 실패:", e);
      setOrg({ department: null, roles: [], employees: [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div style={{ padding: 20 }}>
        {/* 상단 우측 툴바 (부서선택 + 새로고침) */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 12 }}>
          <DepartmentPicker value={deptNo} onChange={setDeptNo} />
          <button
            type="button"
            onClick={refresh}
            style={{
              padding: "8px 12px",
              border: "1px solid #2563eb",
              borderRadius: 10,
              background: "#3b82f6",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 1px 0 rgba(255,255,255,0.3) inset, 0 1px 2px rgba(0,0,0,0.05)",
            }}
            aria-label="조직도 새로고침"
          >
            새로고침
          </button>
        </div>

        {/* 부서명: 흰 박스 밖, 별도 영역 */}
        <div className="org-dept-title">
          {org?.department?.dept_name || (deptNo ? "" : "부서를 선택하세요")}
        </div>

        {/* 본문 카드 영역 */}
        <div
          style={{
            minHeight: 420,
            border: "1px solid #e5e5e5",
            borderRadius: 12,
            background: "#fff",
            padding: 12,
          }}
        >
          {!deptNo ? (
            <div style={{ color: "#888", padding: 20, textAlign: "center" }}>
              부서를 선택하면 조직도를 불러옵니다.
            </div>
          ) : loading ? (
            <div style={{ color: "#666", padding: 20, textAlign: "center" }}>불러오는 중…</div>
          ) : (
            <div>
              <OrgGrid roles={org.roles} employees={org.employees} current={me} />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
