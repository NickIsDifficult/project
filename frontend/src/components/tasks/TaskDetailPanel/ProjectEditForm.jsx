// export default function ProjectInfoEditor({ project, onClose }) {
//   const [isEditing, setIsEditing] = useState(false);
//   const [employees, setEmployees] = useState([]);
//   const [projectName, setProjectName] = useState(project?.project_name || "");
//   const [description, setDescription] = useState(project?.description || "");
//   const [attachments, setAttachments] = useState([]);
//   const [mainAssignees, setMainAssignees] = useState([]);
//   const [showDetails, setShowDetails] = useState(false);
//   const [priority, setPriority] = useState("MEDIUM");
//   const [startDate, setStartDate] = useState(project?.start_date || "");
//   const [endDate, setEndDate] = useState(project?.end_date || "");
//   const [tasks, setTasks] = useState([]);

//   const fileInputRef = useRef(null);

//   useEffect(() => {
//     setEmployees([
//       { emp_id: 1, name: "홍길동" },
//       { emp_id: 2, name: "김철수" },
//       { emp_id: 3, name: "이영희" },
//     ]);
//   }, []);

//   const handleFileChange = e => {
//     const file = e.target.files?.[0];
//     if (file) setAttachments(prev => [...prev, file]);
//   };
//   const handleFileDelete = index =>
//     setAttachments(prev => prev.filter((_, i) => i !== index));

//   const handleAddRootTask = () => {
//     const newTask = {
//       id: Date.now(),
//       title: "",
//       startDate: "",
//       endDate: "",
//       assignees: [],
//       children: [],
//     };
//     setTasks([...tasks, newTask]);
//   };

//   const handleTaskUpdate = (index, updated) => {
//     const newTasks = [...tasks];
//     if (updated === null) newTasks.splice(index, 1);
//     else newTasks[index] = updated;
//     setTasks(newTasks);
//   };

//   const handleSave = () => {
//     const payload = {
//       project_name: projectName,
//       description,
//       attachments: attachments.map(f => f.name),
//       priority,
//       startDate,
//       endDate,
//       main_assignees: mainAssignees,
//       tasks,
//     };
//     console.log("📤 전송 데이터:", JSON.stringify(payload, null, 2));
//     toast.success("✅ 저장 완료 (콘솔 확인)");
//     setIsEditing(false);
//   };

//   return (
//     <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
//       {!isEditing ? (
//         <>
//           <h2 style={{ fontSize: 20, fontWeight: 600 }}>
//             📁 {project?.project_name || "프로젝트명 없음"}
//           </h2>
//           <p style={{ color: "#555" }}>{project?.description || "설명 없음"}</p>
//           <p>📅 기간: {startDate || "미정"} ~ {endDate || "미정"}</p>
//           <p>📊 우선순위: {priority}</p>

//           <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
//             <button
//               onClick={() => setIsEditing(true)}
//               style={{
//                 background: "#4caf50",
//                 color: "#fff",
//                 border: "none",
//                 borderRadius: 6,
//                 padding: "8px 14px",
//                 cursor: "pointer",
//               }}
//             >
//               ✏️ 수정
//             </button>
//             <button
//               onClick={onClose}
//               style={{
//                 background: "#f1f1f1",
//                 border: "1px solid #ccc",
//                 borderRadius: 6,
//                 padding: "8px 14px",
//                 cursor: "pointer",
//               }}
//             >
//               닫기
//             </button>
//           </div>
//         </>
//       ) : (
//         <>
//           <h2>📌 프로젝트 수정</h2>

//           {/* ====== 기존 TaskRegistration 입력양식 ====== */}
//           <label>프로젝트 이름</label>
//           <input
//             value={projectName}
//             onChange={e => setProjectName(e.target.value)}
//             style={{ width: "100%", marginBottom: 12 }}
//           />

//           <button
//             onClick={() => setShowDetails(!showDetails)}
//             style={{
//               background: showDetails ? "#555" : "#1976d2",
//               color: "white",
//               border: "none",
//               borderRadius: 6,
//               padding: "8px 12px",
//               cursor: "pointer",
//               marginBottom: 12,
//             }}
//           >
//             {showDetails ? "▲ 상세입력 닫기" : "▼ 상세입력 보기"}
//           </button>

//           {showDetails && (
//             <div style={{ background: "#f9f9f9", padding: 12, borderRadius: 8 }}>
//               <label>시작일</label>
//               <input
//                 type="date"
//                 value={startDate}
//                 onChange={e => setStartDate(e.target.value)}
//                 style={{ width: "100%", marginBottom: 8 }}
//               />
//               <label>종료일</label>
//               <input
//                 type="date"
//                 value={endDate}
//                 onChange={e => setEndDate(e.target.value)}
//                 style={{ width: "100%", marginBottom: 8 }}
//               />
//               <label>우선순위</label>
//               <select
//                 value={priority}
//                 onChange={e => setPriority(e.target.value)}
//                 style={{ width: "100%" }}
//               >
//                 <option value="LOW">낮음</option>
//                 <option value="MEDIUM">보통</option>
//                 <option value="HIGH">높음</option>
//                 <option value="URGENT">긴급</option>
//               </select>

//               <div style={{ marginTop: 12 }}>
//                 <strong>상위업무 담당자:</strong>
//                 <AssigneeSelector
//                   employees={employees}
//                   selected={mainAssignees}
//                   setSelected={setMainAssignees}
//                 />
//               </div>
//             </div>
//           )}

//           <label style={{ marginTop: 12 }}>프로젝트 설명</label>
//           <textarea
//             placeholder="프로젝트 설명을 입력하세요..."
//             value={description}
//             onChange={e => setDescription(e.target.value)}
//             style={{
//               width: "100%",
//               minHeight: 80,
//               padding: 8,
//               borderRadius: 6,
//               border: "1px solid #ccc",
//               resize: "none",
//             }}
//           />

//           {/* 첨부파일 */}
//           <div style={{ marginTop: 20 }}>
//             <h3>📎 첨부파일</h3>
//             <input
//               type="file"
//               ref={fileInputRef}
//               style={{ display: "none" }}
//               onChange={handleFileChange}
//             />
//             <button
//               onClick={() => fileInputRef.current?.click()}
//               style={{
//                 background: "#1976d2",
//                 color: "white",
//                 border: "none",
//                 borderRadius: 6,
//                 padding: "8px 12px",
//                 cursor: "pointer",
//               }}
//             >
//               📤 첨부파일 추가
//             </button>
//             {attachments.length > 0 && (
//               <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
//                 {attachments.map((file, index) => (
//                   <li
//                     key={index}
//                     style={{
//                       display: "flex",
//                       justifyContent: "space-between",
//                       alignItems: "center",
//                       borderBottom: "1px solid #eee",
//                       padding: "4px 0",
//                     }}
//                   >
//                     <span>{file.name}</span>
//                     <button
//                       onClick={() => handleFileDelete(index)}
//                       style={{
//                         background: "crimson",
//                         color: "white",
//                         border: "none",
//                         borderRadius: 4,
//                         padding: "4px 8px",
//                         cursor: "pointer",
//                       }}
//                     >
//                       삭제
//                     </button>
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </div>

//           {/* 업무 구조 */}
//           <div style={{ marginTop: 20 }}>
//             <h3>📋 하위 업무</h3>
//             {tasks.map((task, index) => (
//               <TaskNode
//                 key={task.id}
//                 task={task}
//                 employees={employees}
//                 onUpdate={updated => handleTaskUpdate(index, updated)}
//                 depth={0}
//                 onAddSibling={() => {
//                   const newTasks = [...tasks];
//                   const newTask = {
//                     id: Date.now(),
//                     title: "",
//                     startDate: "",
//                     endDate: "",
//                     assignees: [],
//                     children: [],
//                   };
//                   newTasks.splice(index + 1, 0, newTask);
//                   setTasks(newTasks);
//                 }}
//               />
//             ))}
//             {tasks.length === 0 && (
//               <button
//                 onClick={handleAddRootTask}
//                 style={{
//                   marginTop: 10,
//                   background: "#1976d2",
//                   color: "white",
//                   border: "none",
//                   borderRadius: 6,
//                   padding: "8px 12px",
//                   cursor: "pointer",
//                 }}
//               >
//                 ➕ 업무 추가
//               </button>
//             )}
//           </div>

//           {/* 버튼 */}
//           <div
//             style={{
//               paddingTop: 12,
//               borderTop: "1px solid #eee",
//               display: "flex",
//               justifyContent: "flex-end",
//               gap: 8,
//               marginTop: 16,
//             }}
//           >
//             <button
//               onClick={handleSave}
//               style={{
//                 background: "#1976d2",
//                 color: "#fff",
//                 border: "none",
//                 borderRadius: 6,
//                 padding: "8px 14px",
//                 cursor: "pointer",
//               }}
//             >
//               저장
//             </button>
//             <button
//               onClick={() => setIsEditing(false)}
//               style={{
//                 background: "#f1f1f1",
//                 border: "1px solid #ccc",
//                 borderRadius: 6,
//                 padding: "8px 14px",
//                 cursor: "pointer",
//               }}
//             >
//               취소
//             </button>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }
