// frontend/src/pages/Signup/Signup.jsx
import React, { useEffect, useState } from "react";
import { signup, getDepartments, getRoles } from "../../api/auth";
import Button from "../../components/Button";
import Popup from "../../components/Popup";
import { useNavigate } from "react-router-dom";

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
        .then(([deps, roles]) => { setDeptList(deps); setRoleList(roles); })
        .catch(() => setError("부서/직책 조회 중 오류가 발생했습니다."));
    } else {
      setDeptList([]); setRoleList([]); setDeptId(""); setRoleId("");
    }
  }, [userType]);

  const validate = () => {
    if (!name || !email || !mobile) return "이름/이메일/연락처는 필수입니다.";
    if (userType === "EMPLOYEE" && (!deptId || !roleId)) return "부서/직책을 선택하세요.";
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) { setError(v); return; }

    const payload = {
      user_type: userType,
      name, email, mobile,
      dept_id: userType === "EMPLOYEE" ? Number(deptId) : undefined,
      role_id: userType === "EMPLOYEE" ? Number(roleId) : undefined,
      company: userType === "EXTERNAL" ? company : undefined,
    };

    try {
      const res = await signup(payload);
      setPopup({
        open: true,
        title: "회원가입 완료",
        msg: `아이디: ${res.login_id}\n초기 비밀번호: 0000\n\n확인을 누르면 로그인 화면으로 이동합니다.`,
      });
    } catch (err) {
      const msg = err?.response?.data?.detail || "회원가입 중 오류가 발생했습니다.";
      setError(msg);
    }
  };

  const goLogin = () => {
    setPopup({ open:false, title:"", msg:"" });
    nav("/");
  };

  return (
    <div className="container">
      <h1>회원가입</h1>
      <small>유저 유형을 선택하고 필수 정보를 입력하세요.</small>
      {error && <div className="error">{error}</div>}
      <form onSubmit={onSubmit}>
        <label>유저 유형</label>
        <div className="row">
          <label>사내직원<input type="radio" name="ut" value="EMPLOYEE"
            checked={userType==="EMPLOYEE"} onChange={()=>setUserType("EMPLOYEE")} /></label>
          <label>외부인<input type="radio" name="ut" value="EXTERNAL"
            checked={userType==="EXTERNAL"} onChange={()=>setUserType("EXTERNAL")} /></label>
        </div>

        <label>이름 *</label>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="홍길동" />

        <label>이메일 *</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com" />

        <label>연락처(숫자만) *</label>
        <input value={mobile} onChange={e=>setMobile(e.target.value)} placeholder="01012345678" />

        {userType === "EMPLOYEE" && (
          <>
            <label>부서 선택 *</label>
            <select value={deptId} onChange={e=>setDeptId(e.target.value)}>
              <option value="">부서 선택</option>
              {deptList.map(d => (
                <option key={d.dept_id} value={d.dept_id}>
                  {`${d.dept_id} ${d.dept_name}`}
                </option>
              ))}
            </select>

            <label>직책 선택 *</label>
            <select value={roleId} onChange={e=>setRoleId(e.target.value)}>
              <option value="">직책 선택</option>
              {roleList.map(r => (
                <option key={r.role_id} value={r.role_id}>{r.role_name}</option>
              ))}
            </select>
          </>
        )}

        {userType === "EXTERNAL" && (
          <>
            <label>회사명</label>
            <input value={company} onChange={e=>setCompany(e.target.value)} placeholder="ABC 주식회사" />
          </>
        )}

        <Button type="submit">회원가입</Button>
      </form>

      <div style={{ marginTop: 14, textAlign:"center" }}>
        <small>이미 계정이 있나요? <a href="/" onClick={(e)=>{e.preventDefault(); nav("/");}}>로그인</a></small>
      </div>

      <Popup open={popup.open} title={popup.title} message={popup.msg} onClose={goLogin} />
    </div>
  );
}
