// src/routes/routesConfig.js
import { lazy } from "react";
import { ProjectGlobalProvider } from "../context/ProjectGlobalContext";
import LoginPage from "../pages/Login/Login";
import Signup from "../pages/Signup/Signup";
import Account from "../pages/admin/Account";
import DeptRoles from "../pages/admin/DeptRoles";

const OrgChart = lazy(() => import("../pages/org/OrgChart"));
const Screen = lazy(() => import("../pages/screens/Screen"));
const Calendar = lazy(() => import("../pages/calendar/CalendarView"));
const NoticeList = lazy(() => import("../pages/notices/NoticeList"));
const TrashBin = lazy(() => import("../components/TrashBin"));
const ProjectPage = lazy(() => import("../pages/projects/index"));
const NotFoundPage = lazy(() => import("../pages/errors/NotFoundPage"));
const Search = lazy(() => import("../pages/search/SearchPage"));

// ------------------------------------
// ✅ 라우트 구성
// ------------------------------------
export const routesConfig = [
  { path: "/", element: <LoginPage />, isPrivate: false },

  { path: "/signup", element: <Signup />, isPrivate: true, adminOnly: true },

  // Private Routes
  { path: "/main", element: <Screen />, isPrivate: true },
  {
    path: "/projects",
    element: (
      <ProjectGlobalProvider>
        <ProjectPage />
      </ProjectGlobalProvider>
    ),
    isPrivate: true
  },
  {
    path: "/calendar",
    element: <Calendar />,
    isPrivate: true
  },
  {
    path: "/notices",
    element: <NoticeList />,
    isPrivate: true
  },
  {
    path: "/search",
    element: <Search />,
    isPrivate: true
  },
  {
    path: "/trashbin",
    element: <TrashBin />,
    isPrivate: true
  },

  { 
    path: "/org-chart",
    element: <OrgChart />,
    isPrivate: true 
  },
  {
    path: "/admin/dept_roles",
    element: <DeptRoles />,
    isPrivate: true,
    adminOnly: true
  },
  {
    path: "/admin/account",
    element: <Account />,
    isPrivate: true,
    adminOnly: true
  },
  {
    path: "*",
    element: <NotFoundPage />,
    isPrivate: false
  },
];
("// update marker $(date)");
