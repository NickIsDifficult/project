// src/screens/Screen.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../layout/AppShell";
import { changePassword, getMe, logout, updateProfile } from "../../services/api/auth";
import PersonalInfoModal from "./Setting/PersonalInfoModal";
import "./style.css";

// 간단 모달 컴포넌트
function Modal({ open, title, onClose, onDouble, children }) {
  useEffect(() => {
    if (!open) return;
    const handleKey = e => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-panel" onClick={e => e.stopPropagation()} onDoubleClick={onDouble}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export default function Screen() {
  const [modal, setModal] = useState(null); // 'ann' | 'proj' | 'noti' | 'cal' | null
  const [openSettings, setOpenSettings] = useState(false);
  const [me, setMe] = useState(null);
  const nav = useNavigate();

  const modalToPath = {
    ann: "/notices",
    proj: "/dashboard",
    noti: "/alerts",
    cal: "/calendar",
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await getMe();
        setMe(data?.member ?? data);
      } catch (e) {
        console.error("getMe failed:", e);
        nav("/");
      }
    })();
  }, [nav]);

  return (
    <AppShell>
      {/* 네 개의 모달 트리거 */}
      <div className="view-14 box-click" onClick={() => setModal("ann")} /> {/* 좌상단 */}
      <div className="view-15 box-click" onClick={() => setModal("proj")} /> {/* 우상단 */}
      <div className="view-12 box-click" onClick={() => setModal("noti")} /> {/* 좌하단 */}
      <div className="view-13 box-click" onClick={() => setModal("cal")} /> {/* 우하단 */}
      {/* 모달 4개 */}
      <Modal
        open={modal === "ann"}
        title="공지사항"
        onClose={() => setModal(null)}
        onDouble={() => {
          setModal(null);
          nav(modalToPath.ann);
        }}
      >
        <div className="modal-list-skel">공지사항 목록을 불러옵니다. (더블클릭 시 이동)</div>
      </Modal>
      <Modal
        open={modal === "proj"}
        title="프로젝트"
        onClose={() => setModal(null)}
        onDouble={() => {
          setModal(null);
          nav(modalToPath.proj);
        }}
      >
        <div className="modal-list-skel">프로젝트 목록을 불러옵니다. (더블클릭 시 이동)</div>
      </Modal>
      <Modal
        open={modal === "noti"}
        title="알림"
        onClose={() => setModal(null)}
        onDouble={() => {
          setModal(null);
          nav(modalToPath.noti);
        }}
      >
        <div className="modal-list-skel">알림 내역을 불러옵니다. (더블클릭 시 이동)</div>
      </Modal>
      <Modal
        open={modal === "cal"}
        title="캘린더"
        onClose={() => setModal(null)}
        onDouble={() => {
          setModal(null);
          nav(modalToPath.cal);
        }}
      >
        <div className="modal-list-skel">일정 데이터를 불러옵니다. (더블클릭 시 이동)</div>
      </Modal>
      {/* 개인정보 수정 모달 */}
      <PersonalInfoModal
        open={openSettings}
        initial={{
          status: "WORKING",
          name: me?.name ?? "",
          email: me?.email ?? "",
        }}
        onClose={() => setOpenSettings(false)}
        onSave={async payload => {
          try {
            const updated = await updateProfile({ name: payload.name, email: payload.email });
            setMe(prev => ({
              ...(prev || {}),
              ...(updated?.member ?? updated),
            }));

            if (payload.password?.current && payload.password?.next) {
              await changePassword(payload.password);
              alert("비밀번호 변경 완료. 다시 로그인해주세요.");
            }
            await logout();
            setOpenSettings(false);
          } catch (e) {
            alert(e?.response?.data?.detail || e?.message || "수정 실패");
          }
        }}
      />
    </AppShell>
  );
}
