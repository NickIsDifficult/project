// src/routes/AppRoutes.jsx
import { Route, Routes } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import { routesConfig } from "./routesConfig";

export default function AppRoutes() {
  return (
    <Routes>
      {routesConfig.map(({ path, element, isPrivate, roles = [] }, index) => {
        const routeElement = isPrivate ? (
          <PrivateRoute allowedRoles={roles}>{element}</PrivateRoute>
        ) : (
          element
        );

        return <Route key={index} path={path} element={routeElement} />;
      })}
    </Routes>
  );
}
