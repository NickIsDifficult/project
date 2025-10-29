// // src/routes/ProjectDetailProviderLoader.jsx
// import { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import { ProjectDetailProvider } from "../context/ProjectDetailContext";
// import { getProject } from "../services/api/project";

// export default function ProjectDetailProviderLoader({ children }) {
//   const { projectId } = useParams();
//   const [project, setProject] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     // ✅ projectId 유효성 체크 (undefined 방지)
//     if (!projectId) {
//       console.error("⚠️ projectId가 정의되지 않았습니다. (useParams 실패)");
//       setError("유효하지 않은 프로젝트 경로입니다.");
//       setLoading(false);
//       return;
//     }

//     async function fetchProject() {
//       try {
//         setLoading(true);
//         const data = await getProject(projectId);
//         if (!data) throw new Error("프로젝트 데이터를 찾을 수 없습니다.");
//         setProject(data);
//       } catch (err) {
//         console.error("❌ 프로젝트 상세 API 요청 실패:", err);
//         setError(err);
//       } finally {
//         setLoading(false);
//       }
//     }

//     fetchProject();
//   }, [projectId]);

//   if (loading)
//     return <div style={{ padding: 20 }}>⏳ 프로젝트 불러오는 중...</div>;
//   if (error)
//     return (
//       <div style={{ color: "red", padding: 20 }}>
//         ❌ 프로젝트 로드 실패: {String(error)}
//       </div>
//     );
//   if (!project)
//     return <div style={{ padding: 20 }}>⚠️ 프로젝트가 없습니다.</div>;

//   // ✅ project 데이터가 정상일 때만 Provider 감싸기
//   return (
//     <ProjectDetailProvider initialProject={project}>
//       {children}
//     </ProjectDetailProvider>
//   );
// }
