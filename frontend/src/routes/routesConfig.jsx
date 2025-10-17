// src/routes/routesConfig.js
import { lazy } from "react";
import LoginPage from "../pages/Login/Login";
import SignupPage from "../pages/Signup/Signup";

const Screen = lazy(() => import("../pages/screens/Screen"));
const Calendar = lazy(() => import("../pages/calendar/CalendarView"));
const NoticeBoard = lazy(() => import("../pages/notices/NoticeBoard"));
const TrashBin = lazy(() => import("../components/TrashBin"));
const ProjectsPage = lazy(() => import("../pages/projects/ProjectsPage"));
const ProjectDetailPage = lazy(() => import("../pages/projects/ProjectDetailPage"));
const NotFoundPage = lazy(() => import("../pages/errors/NotFoundPage"));

// ------------------------------------
// ✅ 라우트 구성
// ------------------------------------
export const routesConfig = [
  { path: "/", element: <LoginPage />, isPrivate: false },
  { path: "/signup", element: <SignupPage />, isPrivate: false },

  // Private Routes
  { path: "/main", element: <Screen />, isPrivate: true },
  {
    path: "/projects",
    element: <ProjectsPage />,
    isPrivate: true,
  },
  {
    path: "/projects/:projectId",
    element: <ProjectDetailPage />,
    isPrivate: true,
  },
  {
    path: "/calendar",
    element: <Calendar />,
    isPrivate: true,
  },
  {
    path: "/notices",
    element: <NoticeBoard />,
    isPrivate: true,
  },
  {
    path: "/trash-bin",
    element: <TrashBin />,
    isPrivate: true,
  },
  { path: "*", element: <NotFoundPage />, isPrivate: false },
];
