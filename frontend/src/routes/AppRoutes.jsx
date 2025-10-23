// src/routes/AppRoutes.jsx
import { Route, Routes, Navigate } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import { routesConfig } from "./routesConfig";

export default function AppRoutes() {
  return (
    <Routes>
      {routesConfig.map(({ path, element, isPrivate, adminOnly }, index) => {
        const routeElement = isPrivate ? (
          <PrivateRoute adminOnly={adminOnly}>{element}</PrivateRoute>
        ) : (
          element
        );

        return <Route key={index} path={path} element={routeElement} />;
      })}

      {/* ✅ 하이픈 URL 보정 */}
      <Route
        path="/admin/dept-roles"
        element={<Navigate to="/admin/dept_roles" replace />}
      />
    </Routes>
  );
}
