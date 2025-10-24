// frontend/src/pages/admin/Account.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../components/common/Button"

import {
  adminListAccounts,
  adminGetAccount,
  adminUpdateAccount,
  adminListDepartments,
  adminListRoles,
  adminChangePassword
} from "../../services/api/admin";

// ─────────────────────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────────────────────
const fmt = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString();
};
const safe = (v) => (v ?? "-");

// emp_id/ext_id 한쪽만 값이 있는 걸 표시용으로 합치기
const linkKey = (row) => row?.emp_id ?? row?.ext_id ?? null;

// ─────────────────────────────────────────────────────────────
// 편집 모달 (파일 분할하지 않고 이 파일 안에서만 사용)
// ─────────────────────────────────────────────────────────────
function EditDialog({
  open,
  onClose,
  memberId,
  userType, // "EMPLOYEE" | "EXTERNAL"
  initial,  // 목록행 or 상세조회로 얻은 값
  onSaved,  // 저장 성공 시 호출
}) {
  const [form, setForm] = useState(() => ({
    login_id: initial?.login_id ?? "",
    name: initial?.name ?? "",
    email: initial?.email ?? "",
    mobile: initial?.mobile ?? "",
    birthday: initial?.birthday ?? "",
    hire_date: initial?.hire_date ?? "",
    company: initial?.company ?? "", // EXTERNAL 전용
    dept_id: initial?.dept_id ?? "", // select 용
    role_id: initial?.role_id ?? "",
    dept_no: initial?.dept_no ?? "", // 표기용
    role_no: initial?.role_no ?? "",
    created_at: initial?.created_at ?? "",
    last_login_at: initial?.last_login_at ?? "",
    failed_attempts: initial?.failed_attempts ?? 0,
    locked_until: initial?.locked_until ?? ""
  }));
  const [deps, setDeps] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailLoaded, setDetailLoaded] = useState(false);
  const [error, setError] = useState("");

  // 최초 open 시 상세 재조회(정합성 확보) + 부서/직급 목록
  useEffect(() => {
    let active = true;
    async function bootstrap() {
      setError("");
      try {
        setLoading(true);
        const [depRes, roleRes] = await Promise.all([
          adminListDepartments(""),
          adminListRoles(""),
        ]);
        if (!active) return;
        setDeps(depRes || []);
        setRoles(roleRes || []);
      } catch (e) {
        if (!active) return;
        setError(e?.message || "부서/직급 목록을 불러오지 못했습니다.");
      } finally {
        if (active) setLoading(false);
      }
    }
    if (open) bootstrap();
    return () => { active = false; };
  }, [open]);

  // 상세 재조회 (memberId/userType 기준) — 실패해도 목록행 값으로 편집 가능
  useEffect(() => {
    let alive = true;
    async function loadDetail() {
      if (!open || !memberId || !userType) return;
      try {
        setLoading(true);
        const data = await adminGetAccount(userType, memberId);
        if (!alive) return;
        // 백엔드 응답 형태가 확정되어 있지 않아 “방어적으로” 병합
        const merged = {
          ...form,
          ...data,
          login_id: data?.login_id ?? form.login_id,
          name: data?.name ?? form.name,
          email: data?.email ?? form.email,
          mobile: data?.mobile ?? form.mobile,
          birthday: data?.birthday ?? form.birthday,
          hire_date: data?.hire_date ?? form.hire_date,
          company: data?.company ?? form.company,
          dept_id: data?.dept_id ?? form.dept_id,
          role_id: data?.role_id ?? form.role_id,
          dept_no: data?.dept_no ?? form.dept_no,
          role_no: data?.role_no ?? form.role_no,
          created_at: data?.created_at ?? form.created_at,
          last_login_at: data?.last_login_at ?? form.last_login_at,
          failed_attempts: data?.failed_attempts ?? form.failed_attempts,
          locked_until: data?.locked_until ?? form.locked_until,
        };
        setForm(merged);
        setDetailLoaded(true);
      } catch {
        // 상세 실패 시 목록값으로 편집 허용 (알림만)
        setDetailLoaded(false);
      } finally {
        if (alive) setLoading(false);
      }
    }
    loadDetail();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, memberId, userType]);

  const onChange = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const onSubmit = async () => {
    // 읽기 전용 필드(잠금): member_id(PK), created_at, last_login_at (서버에 안 보냄)
    const payload = {
      // 실무 기본: 정규화 기준으로 id를 우선, no는 서버에서 일관 계산/검증
      name: form.name,
      email: form.email,
      mobile: form.mobile,
      birthday: form.birthday || null,
      hire_date: form.hire_date || null,
      dept_id: form.dept_id || null,
      role_id: form.role_id || null,
      ...(userType === "EXTERNAL" ? { company: form.company } : {}),
    };
    try {
      setLoading(true);
      const updated = await adminUpdateAccount(userType, memberId, payload);
      onSaved?.(updated);
      onClose();
    } catch (e) {
      setError(e?.message || "수정 실패");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.35)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{ width: 720, maxWidth: "95%", background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 10px 30px rgba(0,0,0,.2)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: 8 }}>계정 수정</h2>
        <p style={{ marginTop: 0, color: "#888" }}>
          * 아래 항목 중 <b>프라이머리키 / 생성시각 / 마지막 접속시각</b>은 읽기 전용입니다.
        </p>

        {error && <div style={{ color: "#b00020", marginBottom: 12 }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* 읽기 전용 영역 */}
          <label>
            <div style={{ fontSize: 12, color: "#666" }}>Member ID (PK)</div>
            <input value={memberId} disabled style={{ width: "100%" }} />
          </label>
          <label>
            <div style={{ fontSize: 12, color: "#666" }}>구분(user_type)</div>
            <input value={userType} disabled style={{ width: "100%" }} />
          </label>
          <label>
            <div style={{ fontSize: 12, color: "#666" }}>로그인 ID</div>
            <input value={form.login_id} disabled style={{ width: "100%" }} />
          </label>
          <label>
            <div style={{ fontSize: 12, color: "#666" }}>마지막 접속시각</div>
            <input value={fmt(form.last_login_at)} disabled style={{ width: "100%" }} />
          </label>
          <label>
            <div style={{ fontSize: 12, color: "#666" }}>생성시각</div>
            <input value={fmt(form.created_at)} disabled style={{ width: "100%" }} />
          </label>
          <label>
            <div style={{ fontSize: 12, color: "#666" }}>입사일</div>
            <input
              type="date"
              value={form.hire_date ? form.hire_date.slice(0, 10) : ""}
              disabled
            />
          </label>
          <label>
            <div style={{ fontSize: 12, color: "#666" }}>로그인 실패횟수</div>
            <input value={form.failed_attempts} disabled style={{ width: "100%" }} />
          </label>

          <label>
            <div style={{ fontSize: 12, color: "#666" }}>잠금해제 예정</div>
            <input value={fmt(form.locked_until)} disabled style={{ width: "100%" }} />
          </label>

          {/* 편집 영역 */}
          <label>
            <div style={{ fontSize: 12, color: "#666" }}>이름</div>
            <input value={form.name} onChange={(e) => onChange("name", e.target.value)} />
          </label>
          <label>
            <div style={{ fontSize: 12, color: "#666" }}>이메일</div>
            <input value={form.email} onChange={(e) => onChange("email", e.target.value)} />
          </label>
          <label>
            <div style={{ fontSize: 12, color: "#666" }}>휴대폰</div>
            <input value={form.mobile} onChange={(e) => onChange("mobile", e.target.value)} />
          </label>
          <label>
            <div style={{ fontSize: 12, color: "#666" }}>생일</div>
            <input
              type="date"
              value={form.birthday ? form.birthday.slice(0, 10) : ""}
              onChange={(e) => onChange("birthday", e.target.value)}
            />
          </label>
          <label>
            <div style={{ fontSize: 12, color: "#666" }}>부서</div>
            <select
              value={form.dept_id ?? ""}
              onChange={(e) => onChange("dept_id", e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">선택 안 함</option>
              {deps.map((d) => (
                <option key={d.dept_id} value={d.dept_id}>
                  {d.dept_no ? `[${d.dept_no}] ` : ""}{d.dept_name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <div style={{ fontSize: 12, color: "#666" }}>직급</div>
            <select
              value={form.role_id ?? ""}
              onChange={(e) => onChange("role_id", e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">선택 안 함</option>
              {roles.map((r) => (
                <option key={r.role_id} value={r.role_id}>
                  {r.role_no ? `[${r.role_no}] ` : ""}{r.role_name}
                </option>
              ))}
            </select>
          </label>
          {userType === "EXTERNAL" && (
            <label>
              <div style={{ fontSize: 12, color: "#666" }}>회사</div>
              <input value={form.company} onChange={(e) => onChange("company", e.target.value)} />
            </label>
          )}
          <label>
            <div style={{ fontSize: 12, color: "#666" }}>비밀번호 변경</div>
            <input
              type="password"
              value={form.new_password || ""}
              onChange={(e) => onChange("new_password", e.target.value)}
            />
            <button
              type="button"
              onClick={async () => {
                if (!form.new_password) return alert("새 비밀번호를 입력하세요.");
                try {
                  await adminChangePassword(userType, memberId, { new_password: form.new_password });
                  alert("비밀번호가 변경되었습니다.");
                  setForm((s) => ({ ...s, new_password: "" }));  // ✅ 입력 초기화
                  onClose();
                } catch (e) {
                  alert(e.message || "비밀번호 변경 실패");
                }
              }}
            >
              비밀번호 변경
            </button>
          </label>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <button onClick={onClose} disabled={loading}>취소</button>
          <button onClick={onSubmit} disabled={loading}>{loading ? "저장 중..." : "저장"}</button>
        </div>

        {!detailLoaded && (
          <div style={{ marginTop: 10, fontSize: 12, color: "#888" }}>
            ※ 상세 조회에 실패하여 목록 값으로 편집합니다. 저장은 정상 동작합니다.
          </div>
        )}
      </div>
    </div >
  );
}

// ─────────────────────────────────────────────────────────────
// 메인 페이지 컴포넌트
// ─────────────────────────────────────────────────────────────
export default function Account() {

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // 편집 모달 상태
  const [openEdit, setOpenEdit] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // { member_id, user_type, ... }

  const pages = useMemo(() => Math.max(1, Math.ceil(total / size)), [total, size]);

  const fetchList = async () => {
    try {
      setLoading(true);
      setErr("");
      const data = await adminListAccounts({ q, page, size });
      setRows(data?.items || []);
      setTotal(data?.total || 0);
    } catch (e) {
      setErr(e?.message || "목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size]); // 검색(q)은 버튼으로 트리거

  const onSearch = () => {
    setPage(1);
    fetchList();
  };

  const onOpenEdit = (row) => {
    setEditTarget(row);
    setOpenEdit(true);
  };

  const onSaved = () => {
    // 저장 후 목록 갱신
    fetchList();
  };

  const navigate = useNavigate();

  return (
    <div className="account-page">
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
      }}>
        <h2>계정관리</h2>
        {/* ✅ 메인으로 버튼 */}
        <Button
          type="button"
          onClick={() => navigate("/main")}
          style={{ background: "#007bff", color: "white", padding: "6px 16px" }}
        >
          메인으로
        </Button>
      </div>
      {/* 툴바 */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="이름/이메일/사번(사외번호)/로그인ID 검색"
          style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", width: 360 }}
        />
        <button type="button" onClick={onSearch} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd" }}>
          검색
        </button>
        <button type="button" onClick={fetchList} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd" }}>
          새로고침
        </button>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#666", fontSize: 12 }}>표시행:</span>
          <select value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(1); }}>
            {[10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* 표 */}
      <div style={{ overflow: "auto", borderRadius: 12, border: "1px solid #eee" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f7f7f7" }}>
            <tr>
              <th style={th}>Member ID</th>
              <th style={th}>구분</th>
              <th style={th}>로그인ID</th>
              <th style={th}>이름</th>
              <th style={th}>이메일</th>
              <th style={th}>전화번호</th>
              <th style={th}>부서명</th>
              <th style={th}>부서코드(dept_no)</th>
              <th style={th}>직급</th>
              <th style={th}>직급코드(roel_no)</th>
              <th style={th}>회사명(외부인)</th>

            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.member_id}>
                <td style={td}>{safe(r.member_id)}</td>
                <td style={td}>{safe(r.user_type)}</td>
                <td style={td}>{safe(r.login_id)}</td>
                <td style={td}>{safe(r.name)}</td>
                <td style={td}>{safe(r.email)}</td>
                <td style={td}>{safe(r.mobile)}</td>
                <td style={td}>{safe(r.dept_name)}</td>
                <td style={td}>{safe(r.dept_no)}</td>
                <td style={td}>{safe(r.role_name)}</td>
                <td style={td}>{safe(r.role_no)}</td>
                <td style={td}>{safe(r.company)}</td>

                <td style={td}>
                  <button
                    type="button"
                    onClick={() => onOpenEdit(r)}
                    style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd" }}
                  >
                    수정
                  </button>
                </td>
              </tr>
            ))}
            {(!loading && rows.length === 0) && (
              <tr><td style={td} colSpan={11}>데이터가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 페이징 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>이전</button>
        <span style={{ color: "#666" }}>
          {page} / {pages} (총 {total}건)
        </span>
        <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages}>다음</button>
      </div>

      {err && <div style={{ color: "#b00020", marginTop: 8 }}>{err}</div>}
      {loading && <div style={{ color: "#666", marginTop: 8 }}>불러오는 중…</div>}

      {/* 편집 모달 */}
      <EditDialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        memberId={editTarget?.member_id}
        userType={editTarget?.user_type}
        initial={editTarget}
        onSaved={onSaved}
      />
    </div>
  );
}

const th = { textAlign: "left", padding: 10, borderBottom: "1px solid #eee", whiteSpace: "nowrap" };
const td = { padding: 10, borderBottom: "1px solid #f2f2f2", whiteSpace: "nowrap" };
