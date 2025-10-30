// frontend/src/pages/admin/DeptRoles.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  adminListDepartments, adminCreateDepartment, adminUpdateDepartment, adminDeleteDepartment,
  adminListRoles,       adminCreateRole,       adminUpdateRole,       adminDeleteRole
} from "../../services/api/admin";
import Popup from "../../components/common/Popup";
import Button from "../../components/common/Button";

function only2Digits(v) {
  return (v || "").replace(/\D/g, "").slice(0, 2);
}
// 직급 코드는 자유 문자열, DB가 VARCHAR(20)이므로 UI에서 20자로 제한
function normalizeRoleCode(v) {
  return (v || "").trim().slice(0, 20);
}

export default function DeptRoles() {
  const navigate = useNavigate();

  // Departments
  const [deps, setDeps] = useState([]);
  const [depQuery, setDepQuery] = useState("");
  const [depName, setDepName] = useState("");
  const [depNo, setDepNo] = useState("");        // 부서: 2자리 숫자
  const [selectedDep, setSelectedDep] = useState(null);

  // Roles
  const [roles, setRoles] = useState([]);
  const [roleQuery, setRoleQuery] = useState("");
  const [roleName, setRoleName] = useState("");
  const [roleNo, setRoleNo] = useState("");      // 직급: 자유 문자열(최대 20자)
  const [selectedRole, setSelectedRole] = useState(null);

  // UI
  const [popup, setPopup] = useState({ open: false, title: "", msg: "" });
  const [error, setError] = useState("");

  const fetchDeps = async () => {
    try {
      const data = await adminListDepartments(depQuery);
      setDeps(data || []);
    } catch (e) {
      setError("부서 목록을 불러오지 못했습니다.");
    }
  };
  const fetchRoles = async () => {
    try {
      const data = await adminListRoles(roleQuery);
      setRoles(data || []);
    } catch (e) {
      setError("직급 목록을 불러오지 못했습니다.");
    }
  };

  useEffect(() => { fetchDeps(); }, []);
  useEffect(() => { fetchRoles(); }, []);

  const depFiltered = useMemo(() => deps, [deps]);
  const roleFiltered = useMemo(() => roles, [roles]);

  // ===== handlers (Department) =====
  const onDepCreate = async () => {
    const name = depName.trim();
    const code = only2Digits(depNo);
    if (!name) return setError("부서명을 입력하세요.");
    if (code.length !== 2) return setError("부서 코드는 2자리 숫자여야 합니다.");
    try {
      await adminCreateDepartment({ dept_name: name, dept_no: code });
      setDepName("");
      setDepNo("");
      await fetchDeps();
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || "부서 생성에 실패했습니다.";
      setError(msg);
    }
  };
  const onDepSelect = (row) => {
    setSelectedDep(row);
    setDepName(row.dept_name || "");
    setDepNo(row.dept_no || "");
  };
  const onDepUpdate = async () => {
    if (!selectedDep) return;
    const name = depName.trim();
    const code = only2Digits(depNo);
    if (!name) return setError("부서명을 입력하세요.");
    if (code.length !== 2) return setError("부서 코드는 2자리 숫자여야 합니다.");
    try {
      await adminUpdateDepartment(selectedDep.dept_id, { dept_name: name, dept_no: code });
      setSelectedDep(null);
      setDepName("");
      setDepNo("");
      await fetchDeps();
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || "부서 수정에 실패했습니다.";
      setError(msg);
    }
  };
  const onDepDelete = async () => {
    if (!selectedDep) return;
    if (!window.confirm("정말 삭제하시겠습니까? 연관 데이터가 있으면 실패합니다.")) return;
    try {
      await adminDeleteDepartment(selectedDep.dept_id);
      setSelectedDep(null);
      setDepName("");
      setDepNo("");
      await fetchDeps();
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || "부서 삭제에 실패했습니다.";
      setError(msg);
    }
  };

  // ===== handlers (Role) =====
  const onRoleCreate = async () => {
    const name = roleName.trim();
    const code = normalizeRoleCode(roleNo);
    if (!name) return setError("직급명을 입력하세요.");
    if (!code) return setError("직급 코드를 입력하세요."); // 빈값 허용하려면 이 줄 삭제
    try {
      await adminCreateRole({ role_name: name, role_no: code });
      setRoleName("");
      setRoleNo("");
      await fetchRoles();
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || "직급 생성에 실패했습니다.";
      setError(msg);
    }
  };
  const onRoleSelect = (row) => {
    setSelectedRole(row);
    setRoleName(row.role_name || "");
    setRoleNo(row.role_no || "");
  };
  const onRoleUpdate = async () => {
    if (!selectedRole) return;
    const name = roleName.trim();
    const code = normalizeRoleCode(roleNo);
    if (!name) return setError("직급명을 입력하세요.");
    if (!code) return setError("직급 코드를 입력하세요."); // 빈값 허용하려면 이 줄 삭제
    try {
      await adminUpdateRole(selectedRole.role_id, { role_name: name, role_no: code });
      setSelectedRole(null);
      setRoleName("");
      setRoleNo("");
      await fetchRoles();
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || "직급 수정에 실패했습니다.";
      setError(msg);
    }
  };
  const onRoleDelete = async () => {
    if (!selectedRole) return;
    if (!window.confirm("정말 삭제하시겠습니까? 연관 데이터가 있으면 실패합니다.")) return;
    try {
      await adminDeleteRole(selectedRole.role_id);
      setSelectedRole(null);
      setRoleName("");
      setRoleNo("");
      await fetchRoles();
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || "직급 삭제에 실패했습니다.";
      setError(msg);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      {/* 상단 헤더: 제목 + 메인으로 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>부서 및 직급관리</h2>
        <Button type="button" onClick={() => navigate("/main")}>메인으로</Button>
      </div>

      {error && (
        <div style={{
          marginBottom: 12, padding: "10px 12px",
          border: "1px solid #fecaca", background: "#fff1f2", color: "#b91c1c", borderRadius: 10
        }}>{error}</div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* ================== 부서 ================== */}
        <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
          <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <strong>부서 관리</strong>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={depQuery}
                onChange={(e) => setDepQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchDeps()}
                placeholder="코드/이름 검색"
                style={{ padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8 }}
              />
              <Button type="button" onClick={fetchDeps}>조회</Button>
            </div>
          </header>

          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, marginBottom: 12 }}>
            <input
              value={depNo}
              onChange={(e) => setDepNo(only2Digits(e.target.value))}
              inputMode="numeric"
              pattern="\d{2}"
              maxLength={2}
              placeholder="부서 코드(2자리 숫자)"
              style={{ padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8 }}
            />
            <input
              value={depName}
              onChange={(e) => setDepName(e.target.value)}
              placeholder={selectedDep ? "부서명 수정" : "부서명 입력"}
              style={{ padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8 }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {selectedDep ? (
              <>
                <Button type="button" onClick={onDepUpdate}>수정</Button>
                <Button type="button" onClick={onDepDelete} variant="danger">삭제</Button>
                <Button type="button" onClick={() => { setSelectedDep(null); setDepName(""); setDepNo(""); }}>취소</Button>
              </>
            ) : (
              <Button type="button" onClick={onDepCreate}>추가</Button>
            )}
          </div>

          <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 8, paddingTop: 8, maxHeight: 360, overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: 8, width: 80 }}>코드</th>
                  <th style={{ padding: 8 }}>부서명</th>
                </tr>
              </thead>
              <tbody>
                {depFiltered.map((d) => (
                  <tr key={d.dept_id}
                      onClick={() => onDepSelect(d)}
                      style={{ cursor: "pointer", borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: 8 }}>{d.dept_no}</td>
                    <td style={{ padding: 8 }}>{d.dept_name}</td>
                  </tr>
                ))}
                {!depFiltered.length && (
                  <tr><td colSpan={2} style={{ padding: 12, color: "#6b7280" }}>데이터가 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ================== 직급 ================== */}
        <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
          <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <strong>직급 관리</strong>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={roleQuery}
                onChange={(e) => setRoleQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchRoles()}
                placeholder="코드/이름 검색"
                style={{ padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8 }}
              />
              <Button type="button" onClick={fetchRoles}>조회</Button>
            </div>
          </header>

          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, marginBottom: 12 }}>
            <input
              value={roleNo}
              onChange={(e) => setRoleNo(normalizeRoleCode(e.target.value))}
              maxLength={20}
              placeholder="직급 코드(최대 20자)"
              style={{ padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8 }}
            />
            <input
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder={selectedRole ? "직급명 수정" : "직급명 입력"}
              style={{ padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 8 }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {selectedRole ? (
              <>
                <Button type="button" onClick={onRoleUpdate}>수정</Button>
                <Button type="button" onClick={onRoleDelete} variant="danger">삭제</Button>
                <Button type="button" onClick={() => { setSelectedRole(null); setRoleName(""); setRoleNo(""); }}>취소</Button>
              </>
            ) : (
              <Button type="button" onClick={onRoleCreate}>추가</Button>
            )}
          </div>

          <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 8, paddingTop: 8, maxHeight: 360, overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: 8, width: 80 }}>코드</th>
                  <th style={{ padding: 8 }}>직급명</th>
                </tr>
              </thead>
              <tbody>
                {roleFiltered.map((r) => (
                  <tr key={r.role_id}
                      onClick={() => onRoleSelect(r)}
                      style={{ cursor: "pointer", borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: 8 }}>{r.role_no}</td>
                    <td style={{ padding: 8 }}>{r.role_name}</td>
                  </tr>
                ))}
                {!roleFiltered.length && (
                  <tr><td colSpan={2} style={{ padding: 12, color: "#6b7280" }}>데이터가 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <Popup open={popup.open} title={popup.title} message={popup.msg} onClose={() => setPopup({ open:false, title:"", msg:"" })} />
    </div>
  );
}
