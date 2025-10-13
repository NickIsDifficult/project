// src/AdminPage.js
import React, { useState } from "react";
import { api } from "../../api";

export default function AdminPage() {
  const [message, setMessage] = useState("");

  async function checkAdmin() {
    try {
      const res = await api("/admin");
      setMessage(JSON.stringify(res));
    } catch (err) {
      setMessage("❌ 권한 없음: " + err.message);
    }
  }

  return (
    <div>
      <h2>관리자 권한 테스트</h2>
      <button onClick={checkAdmin}>권한 확인</button>
      <p>{message}</p>
    </div>
  );
}
