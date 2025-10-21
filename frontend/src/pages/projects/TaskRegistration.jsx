import React, { useEffect, useState } from "react";

export default function TaskRegistration({ onClose }) {
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [mainAssignees, setMainAssignees] = useState([]); // 상위업무 담당자
  const [subtasks, setSubtasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ✅ 드로어 열릴 때 body 스크롤 잠그고, 닫힐 때 복원
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ESC로 닫기
  useEffect(() => {
    const onKey = e => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // 서버 전송
  const handleSubmit = async () => {
    try {
      const body = {
        project_name: projectName,
        description,
        owner_emp_id: 1, // 로그인 사용자 가정
        main_assignees: mainAssignees,
        tasks: subtasks.map(s => ({
          title: s.title,
          assignees: s.assignees,
          subtasks: s.details.map(d => ({
            title: d.title,
            assignees: d.assignees,
          })),
        })),
      };

      const res = await fetch("http://127.0.0.1:8000/projects-with-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("등록 실패");
      const result = await res.json();
      console.log("등록 완료:", result);

      alert("업무 등록 완료!");
      onClose?.();
    } catch (err) {
      console.error(err);
      alert("등록 중 오류 발생");
    }
  };

  // 담당자 검색 + 멀티 선택
  const AssigneeSelector = ({ selected, setSelected }) => {
    const [query, setQuery] = useState("");
    const filtered = employees.filter(
      emp => emp.name.toLowerCase().includes(query.toLowerCase()) && !selected.includes(emp.emp_id),
    );

    return (
      <div style={{ marginTop: 6, position: "relative" }}>
        {/* 선택된 담당자 칩 */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {selected.map(id => {
            const emp = employees.find(e => e.emp_id === id);
            return (
              <span
                key={id}
                style={{
                  background: "#e3f2fd",
                  color: "#1976d2",
                  padding: "4px 8px",
                  borderRadius: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {emp?.name}
                <button
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                  onClick={() => setSelected(selected.filter(sid => sid !== id))}
                >
                  ✕
                </button>
              </span>
            );
          })}
        </div>

        {/* 검색 입력 */}
        <input
          type="text"
          placeholder="담당자 검색"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ width: "100%", marginTop: 6 }}
        />

        {/* 검색 결과 드롭다운 */}
        {query && (
          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: 6,
              marginTop: 4,
              maxHeight: 160,
              overflowY: "auto",
              background: "#fff",
              position: "absolute",
              zIndex: 1000,
              width: "100%",
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            }}
          >
            {filtered.length === 0 ? (
              <div style={{ padding: 8 }}>검색 결과 없음</div>
            ) : (
              filtered.map(emp => (
                <div
                  key={emp.emp_id}
                  style={{
                    padding: 8,
                    cursor: "pointer",
                    borderBottom: "1px solid #eee",
                  }}
                  onClick={() => {
                    setSelected([...selected, emp.emp_id]);
                    setQuery("");
                  }}
                >
                  {emp.name}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  // ====== 드로어 UI (오버레이 + 고정 컨테이너 + 내부 스크롤 영역) ======
  return (
    <div
      style={{
        flex: 1, // ✅ 드로어 내부에서 채워짐
        overflowY: "auto", // ✅ 내부 스크롤 유지
        padding: 16,
        WebkitOverflowScrolling: "touch",
      }}
    >
      {/* ✅ 상단 헤더 제거 — TaskManager에서 헤더 렌더링함 */}
      <h2 style={{ margin: 0, fontSize: 18 }}>📌 프로젝트 & 업무 등록</h2>
      <button onClick={onClose} aria-label="닫기">
        ✕
      </button>

      {/* 스크롤 영역 (여기만 스크롤) */}
      <div
        style={{
          flex: 1,
          overflowY: "auto", // ✅ 스크롤 핵심
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          padding: 16,
        }}
      >
        {/* ===== 프로젝트 기본 정보 ===== */}
        <label>프로젝트 이름</label>
        <input value={projectName} onChange={e => setProjectName(e.target.value)} />
        <br></br>
        <label style={{ marginTop: 8 }}>시작일</label>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <br></br>
        <label style={{ marginTop: 8 }}>종료일</label>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />

        {/* ===== 상위업무 담당자 ===== */}
        <div style={{ marginTop: 12, position: "relative" }}>
          <strong>상위업무 담당자:</strong>
          <AssigneeSelector selected={mainAssignees} setSelected={setMainAssignees} />
        </div>

        {/* ===== 프로젝트 설명 ===== */}
        <label style={{ marginTop: 12 }}>프로젝트 설명</label>
        <textarea
          placeholder="프로젝트에 대한 설명을 입력하세요..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          onInput={e => {
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
          style={{
            width: "100%",
            minHeight: 40,
            overflow: "hidden",
            resize: "none",
            lineHeight: 1.5,
            fontSize: 14,
            padding: 8,
            borderRadius: 6,
            border: "1px solid #ccc",
            boxSizing: "border-box",
          }}
        />

        {/* ===== 하위업무 ===== */}
        {subtasks.length === 0 ? (
          <button
            style={{ marginTop: 12 }}
            onClick={() => setSubtasks([{ title: "", assignees: [], details: [] }])}
          >
            ➕ 하위업무 추가
          </button>
        ) : (
          subtasks.map((s, i) => (
            <div key={i} style={{ marginLeft: 10, marginTop: 12 }}>
              {/* 하위업무 제목 */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  placeholder="하위 업무 제목"
                  value={s.title}
                  onChange={e => {
                    const newSubs = [...subtasks];
                    newSubs[i].title = e.target.value;
                    setSubtasks(newSubs);
                  }}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      const newSubs = [...subtasks];
                      newSubs.splice(i + 1, 0, {
                        title: "",
                        assignees: [],
                        details: [],
                      });
                      setSubtasks(newSubs);
                    }
                  }}
                  style={{ flex: 1 }}
                />
                <button
                  onClick={() => {
                    const newSubs = [...subtasks];
                    newSubs.splice(i + 1, 0, {
                      title: "",
                      assignees: [],
                      details: [],
                    });
                    setSubtasks(newSubs);
                  }}
                >
                  ＋
                </button>
                <button
                  onClick={() => {
                    const newSubs = [...subtasks];
                    newSubs.splice(i, 1);
                    setSubtasks(newSubs);
                  }}
                  disabled={subtasks.length === 1}
                >
                  −
                </button>
              </div>

              {/* 하위업무 담당자 */}
              <div
                style={{
                  marginLeft: 20,
                  marginBottom: 12,
                  position: "relative",
                }}
              >
                <strong>하위업무 담당자:</strong>
                <AssigneeSelector
                  selected={s.assignees}
                  setSelected={newList => {
                    const newSubs = [...subtasks];
                    newSubs[i].assignees = newList;
                    setSubtasks(newSubs);
                  }}
                />
              </div>

              {/* ===== 세부업무 ===== */}
              <div style={{ marginLeft: 20 }}>
                {s.details.length === 0 ? (
                  <button
                    onClick={() => {
                      const newSubs = [...subtasks];
                      newSubs[i].details.push({
                        title: "",
                        assignees: [],
                      });
                      setSubtasks(newSubs);
                    }}
                  >
                    ➕ 세부업무 추가
                  </button>
                ) : (
                  s.details.map((d, j) => (
                    <div key={j} style={{ marginBottom: 12 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <input
                          placeholder="세부 업무 제목"
                          value={d.title}
                          onChange={e => {
                            const newSubs = [...subtasks];
                            newSubs[i].details[j].title = e.target.value;
                            setSubtasks(newSubs);
                          }}
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              const newSubs = [...subtasks];
                              newSubs[i].details.splice(j + 1, 0, {
                                title: "",
                                assignees: [],
                              });
                              setSubtasks(newSubs);
                            }
                          }}
                          style={{ flex: 1 }}
                        />
                        <button
                          onClick={() => {
                            const newSubs = [...subtasks];
                            newSubs[i].details.splice(j + 1, 0, {
                              title: "",
                              assignees: [],
                            });
                            setSubtasks(newSubs);
                          }}
                        >
                          ＋
                        </button>
                        <button
                          onClick={() => {
                            const newSubs = [...subtasks];
                            newSubs[i].details.splice(j, 1);
                            setSubtasks(newSubs);
                          }}
                          disabled={s.details.length === 1}
                        >
                          −
                        </button>
                      </div>

                      {/* 세부업무 담당자 */}
                      <div
                        style={{
                          marginLeft: 20,
                          marginTop: 6,
                          position: "relative",
                        }}
                      >
                        <strong>세부업무 담당자:</strong>
                        <AssigneeSelector
                          selected={d.assignees}
                          setSelected={newList => {
                            const newSubs = [...subtasks];
                            newSubs[i].details[j].assignees = newList;
                            setSubtasks(newSubs);
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div
        style={{
          paddingTop: 12,
          borderTop: "1px solid #eee",
          display: "flex",
          gap: 8,
          justifyContent: "flex-end",
          background: "#fff",
          marginTop: 16,
        }}
      >
        <button onClick={handleSubmit}>저장</button>
        <button onClick={onClose}>취소</button>
      </div>
    </div>
  );
}
