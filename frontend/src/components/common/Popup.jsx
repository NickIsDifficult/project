// frontend/src/components/Popup.jsx
import React from "react";

export default function Popup({ open, title, message, onClose }) {
  if (!open) return null;
  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,.25)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:20, zIndex:9999
    }}>
      <div style={{ background:"#fff", borderRadius:16, width:420, maxWidth:"100%", padding:20 }}>
        <h3 style={{ marginTop:0 }}>{title}</h3>
        <div style={{ color:"#333", whiteSpace:"pre-wrap" }}>{message}</div>
        <div style={{ marginTop:16, textAlign:"right" }}>
          <button onClick={onClose} style={{
            padding:"10px 16px", borderRadius:10, border:"1px solid #ddd", background:"#fafafa", cursor:"pointer"
          }}>확인</button>
        </div>
      </div>
    </div>
  );
}
