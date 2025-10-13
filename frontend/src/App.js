import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import TrashBin from "./components/TrashBin";

function App() {
  return (
    <BrowserRouter>
      <nav style={{ padding: "10px", background: "#f2f2f2" }}>
        <Link to="/trash" style={{ marginRight: "10px" }}>
          휴지통
        </Link>
      </nav>
      <Routes>
        <Route path="/trash" element={<TrashBin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
