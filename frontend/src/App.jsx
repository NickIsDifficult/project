// frontend/src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login/Login";
import Signup from "./pages/Signup/Signup";
import Main from "./pages/Main/Main";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("access_token");
  return token ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/main" element={
          <PrivateRoute><Main /></PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
