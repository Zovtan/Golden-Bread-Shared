
import { useState } from "react";
import { createPortal } from "react-dom";
import NavIcon from "./NavIcon";
import LogoutModal from "./LogoutModal";
import { logout } from "../../shared/utils/logout";


export default function Sidebar({ profile, navItems = [], activePage, onNavigate, extraClass = "", logoutVariant = "default" }) {
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState(
    () => Object.fromEntries(navItems.filter((i) => i.children).map((i) => [i.key, true]))
  );
  const [confirmLogout, setConfirmLogout] = useState(false);

  const toggleGroup = (key) => {
    if (collapsed) {
      setCollapsed(false);
      setOpenGroups((prev) => ({ ...prev, [key]: true }));
    } else {
      setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const handleLogout = async () => {
    try {await logout();} catch (e) {console.error("Gagal logout:", e);}
  };

  const initials = profile?.nama_lengkap?.
  split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() ?? "?";

  return (
    <>
      <aside className={`db-sidebar${collapsed ? " collapsed" : ""}${extraClass ? " " + extraClass : ""}`}>

        {}
        <div
          className="db-user-info"
          title={collapsed ? `${profile?.nama_lengkap ?? ""} - ${profile?.role ?? ""}` : undefined}>
          
          <div className="db-avatar">{initials}</div>
          {!collapsed &&
          <div className="db-user-text" style={{ overflow: "hidden", flex: 1, minWidth: 0 }}>
              <div className="db-user-name">{profile?.nama_lengkap ?? "-"}</div>
              <div className="db-user-role">{profile?.role ?? "-"} {profile?.jenis_pelanggan ?? ""}</div>
              <button
              className="db-logout-inline"
              onClick={() => setConfirmLogout(true)}
              title="Keluar">
              
                <NavIcon name="logout" size={12} />
                <span>Keluar</span>
              </button>
            </div>
          }
        </div>

        {}
        <nav className="db-nav">
          {navItems.map((item) => {
            if (item.children) {
              const isOpen = openGroups[item.key] ?? true;
              return (
                <div key={item.key} className="db-nav-group">
                  <button
                    className="db-nav-toggle"
                    onClick={() => toggleGroup(item.key)}
                    title={collapsed ? item.label : undefined}>
                    
                    <span className="db-nav-icon"><NavIcon name={item.icon} /></span>
                    {!collapsed &&
                    <>
                        <span className="db-nav-label">{item.label}</span>
                        <span className="db-nav-chevron">
                          <NavIcon name={isOpen ? "chevronUp" : "chevronDown"} size={12} />
                        </span>
                      </>
                    }
                  </button>
                  {!collapsed && isOpen && item.children.map((child) =>
                  <button
                    key={child.key}
                    className={`db-nav-link sub${activePage === child.key ? " active" : ""}`}
                    onClick={() => onNavigate?.(child.key)}
                    title={child.label}>
                    
                      <span className="db-nav-icon"><NavIcon name={child.icon} /></span>
                      <span className="db-nav-label">{child.label}</span>
                    </button>
                  )}
                </div>);

            }
            return (
              <button
                key={item.key}
                className={`db-nav-link${activePage === item.key ? " active" : ""}`}
                onClick={() => onNavigate?.(item.key)}
                title={collapsed ? item.label : undefined}>
                
                <span className="db-nav-icon"><NavIcon name={item.icon} /></span>
                {!collapsed && <span className="db-nav-label">{item.label}</span>}
              </button>);

          })}
        </nav>

        {}
        <button
          className="db-collapse-toggle"
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? "Perluas sidebar" : "Perkecil sidebar"}
          aria-label={collapsed ? "Perluas sidebar" : "Perkecil sidebar"}>
          
          <NavIcon name={collapsed ? "chevronRight" : "chevronLeft"} size={10} />
        </button>
      </aside>

      {createPortal(
        <LogoutModal
          open={confirmLogout}
          onClose={() => setConfirmLogout(false)}
          onConfirm={handleLogout}
          variant={logoutVariant} />,

        document.body
      )}
    </>);

}