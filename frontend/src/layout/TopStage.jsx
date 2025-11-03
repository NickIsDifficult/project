// src/layout/TopStage.jsx
import { Link } from "react-router-dom";
import "./appshell.css";
import logo from "./colink-2.png";

export default function TopStage() {
  return (
    <div className="top-stage">
      <Link to="/main" className="top-stage__logo" aria-label="홈으로">
        <img
          src={logo}
          alt="COLINK"
          loading="lazy"
        />
      </Link>
    </div>
  );
}
