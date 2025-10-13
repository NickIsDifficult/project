// src/api.js
// React -> Flask API 통신 유틸
const BASE = "http://127.0.0.1:5000";  // Flask 서버 주소

export async function api(path, { method = "POST", body, token } = {}) {
  try {
    const headers = {
      "Content-Type": "application/json",
    };

    // JWT 토큰 있으면 Authorization 추가
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const options = { method, headers };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(`${BASE}${path}`, options);

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("API 호출 실패:", err);
    throw err;
  }
}
