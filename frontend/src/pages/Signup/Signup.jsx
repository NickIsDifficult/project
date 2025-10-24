// frontend/src/pages/Signup/Signup.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import Popup from "../../components/common/Popup";
import { getDepartments, getRoles, signup } from "../../services/api/auth";
import "./Signup.css"; // ★ 추가

export default function Signup() {
  const nav = useNavigate();
  const [userType, setUserType] = useState("EMPLOYEE"); // EMPLOYEE / EXTERNAL
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [company, setCompany] = useState("");

  const [deptList, setDeptList] = useState([]);
  const [roleList, setRoleList] = useState([]);
  const [deptId, setDeptId] = useState("");
  const [roleId, setRoleId] = useState("");

  const [error, setError] = useState("");
  const [popup, setPopup] = useState({ open: false, title: "", msg: "" });

  useEffect(() => {
    if (userType === "EMPLOYEE") {
      Promise.all([getDepartments(), getRoles()])
        .then(([deps, roles]) => {
          setDeptList(deps);
          setRoleList(roles);
        })
        .catch(() => setError("부서/직책 조회 중 오류가 발생했습니다."));
    } else {
      setDeptList([]);
      setRoleList([]);
      setDeptId("");
      setRoleId("");
    }
  }, [userType]);

  const validate = () => {
    if (!name || !email || !mobile) return "이름/이메일/연락처는 필수입니다.";
    if (userType === "EMPLOYEE" && (!deptId || !roleId)) return "부서/직책을 선택하세요.";
    return "";
  };

  const onSubmit = async e => {
    e.preventDefault();
    const v = validate();
    if (v) return setError(v);

    const payload = {
      user_type: userType,
      name,
      email,
      mobile,
      dept_no: userType === "EMPLOYEE" ? deptId : undefined,
      role_no: userType === "EMPLOYEE" ? roleId : undefined,
      company: userType === "EXTERNAL" ? company : undefined,
    };

    try {
      const res = await signup(payload);
      setPopup({
        open: true,
        title: "계정생성 완료",
        msg: `아이디: ${res.login_id}\n초기 비밀번호: 0000\n\n확인을 누르면 로그인 화면으로 이동합니다.`,
      });
    } catch (err) {
      const msg = err?.response?.data?.detail || "계정생성 중 오류가 발생했습니다.";
      setError(msg);
    }
  };

  const goLogin = () => {
    setPopup({ open: false, title: "", msg: "" });
    nav("/");
  };

  return (
    <div className="container signup-wrap">
      <h1 className="signup-title">계정생성</h1>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-right",
          marginBottom: 16,
        }}
      >
        <Button type="button" onClick={() => nav("/main")}>
          메인으로
        </Button>
      </div>
      <p className="signup-sub">유저 유형을 선택하고 필수 정보를 입력하세요.</p>

      {error && <div className="signup-error">{error}</div>}

      <form onSubmit={onSubmit} className="signup-form">
        {/* 유저 유형 */}
        <fieldset className="signup-section">
          <legend className="section-title">회원 유형</legend> {/* ← 문구 개선 */}
          <div className="radio-seg two-col" role="radiogroup" aria-label="가입 유형">
            <label className={`seg ${userType === "EMPLOYEE" ? "active" : ""}`}>
              <input
                type="radio"
                name="ut"
                value="EMPLOYEE"
                checked={userType === "EMPLOYEE"}
                onChange={() => setUserType("EMPLOYEE")}
              />
              <span>사내 직원</span> {/* 가독성 위해 띄어쓰기 */}
            </label>

            <label className={`seg ${userType === "EXTERNAL" ? "active" : ""}`}>
              <input
                type="radio"
                name="ut"
                value="EXTERNAL"
                checked={userType === "EXTERNAL"}
                onChange={() => setUserType("EXTERNAL")}
              />
              <span>외부인</span>
            </label>
          </div>
        </fieldset>

        {/* 공통 정보 */}
        <fieldset className="signup-section">
          <legend className="section-title">기본 정보</legend>

          <label className="fld">
            <span className="lbl">이름 *</span>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="홍길동" />
          </label>

          <label className="fld">
            <span className="lbl">이메일 *</span>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </label>

          <label className="fld">
            <span className="lbl">연락처(숫자만) *</span>
            <input
              value={mobile}
              onChange={e => setMobile(e.target.value)}
              placeholder="01012345678"
            />
          </label>
        </fieldset>

        {/* ── 사내직원 전용 ─────────────────────────────── */}
        {userType === "EMPLOYEE" && (
          <fieldset className="signup-section">
            <legend className="section-title">사내직원 선택</legend>
            <div className="grid-2">
              <label className="fld">
                <span className="lbl">부서 *</span>
                <select value={deptId} onChange={e => setDeptId(e.target.value)}>
                  <option value="">부서 선택</option>
                  {deptList.map(d => (
                    <option key={d.dept_no} value={d.dept_no}>
                      {`${d.dept_no} ${d.dept_name}`}
                    </option>
                  ))}
                </select>
              </label>

              <label className="fld">
                <span className="lbl">직책 *</span>
                <select value={roleId} onChange={e => setRoleId(e.target.value)}>
                  <option value="">직책 선택</option>
                  {roleList.map(r => (
                    <option key={r.role_no} value={r.role_no}>
                      {r.role_name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </fieldset>
        )}

        {/* ── 외부인 전용 ───────────────────────────────── */}
        {userType === "EXTERNAL" && (
          <fieldset className="signup-section">
            <legend className="section-title">외부인 정보</legend>
            <label className="fld">
              <span className="lbl">회사명</span>
              <input
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="ABC 주식회사"
              />
            </label>
          </fieldset>
        )}

        <Button type="submit">계정생성</Button>
      </form>
      <Popup open={popup.open} title={popup.title} message={popup.msg} onClose={goLogin} />
    </div>
  );
}
