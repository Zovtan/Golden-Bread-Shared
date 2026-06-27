
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import NotifikasiModal from "../components/NotifikasiModal";
import ToastContainer from "../components/ToastContainer";
import { useNotifikasi } from "../hooks/useNotifikasi";

export default function DashboardLayout({
  profile, title, navItems = [],
  activePage, onNavigate,
  headerRight, onNotifAction,
  layoutRef, themeClass, children
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);


  useEffect(() => {setDrawerOpen(false);}, [activePage]);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 769px)");
    const fn = () => {if (mq.matches) setDrawerOpen(false);};
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  const {
    notifs, unread,
    tandaiDibaca, tandaiSemuaDibaca,
    toasts, addToast, dismissToast
  } = useNotifikasi(profile?.id);

  useEffect(() => {
    if (!layoutRef) return;
    layoutRef.current = { addToast };
  }, [layoutRef, addToast]);

  const handleNotifAction = (notif) => onNotifAction?.(notif);

  return (
    <div className={`db-shell${themeClass ? " " + themeClass : ""}`}>
      <div
        className={`fixed inset-0 bg-black/40 z-[199] md:hidden${drawerOpen ? "" : " hidden"}`}
        onClick={() => setDrawerOpen(false)} />
      

      <Sidebar
        profile={profile} navItems={navItems}
        activePage={activePage} onNavigate={onNavigate}
        extraClass={drawerOpen ? "mobile-open" : ""}
        logoutVariant={themeClass === "pelanggan-theme" ? "amber" : "default"} />
      

      <div className="db-main">
        <header className="db-header">
          <button
            className="flex md:hidden items-center justify-center w-8 h-8 bg-transparent
                       border-none cursor-pointer text-gray-700 rounded mr-2 flex-shrink-0
                       hover:bg-gray-100"




            onClick={() => setDrawerOpen((v) => !v)}
            aria-label="Buka menu">
            
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <h1 className="min-w-0 truncate flex-shrink text-base font-semibold">{title}</h1>

          <div className="db-header-right">
            {headerRight}
            <button
              className="db-notif-btn"
              onClick={() => setNotifOpen((v) => !v)}
              title="Notifikasi">
              
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unread > 0 &&
              <span className="db-notif-badge">{unread > 9 ? "9+" : unread}</span>
              }
            </button>
          </div>
        </header>

        <main className="db-content">{children}</main>
      </div>

      <NotifikasiModal
        open={notifOpen}
        role={profile?.role}
        onClose={() => setNotifOpen(false)}
        notifs={notifs}
        onTandaiDibaca={tandaiDibaca}
        onTandaiSemua={tandaiSemuaDibaca}
        onNotifClick={handleNotifAction} />
      

      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
        onToastClick={handleNotifAction} />
      
    </div>);

}