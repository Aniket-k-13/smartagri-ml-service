import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ADMIN_LINKS = [
  { to: "/admin", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/admin/crops", label: "Crops", icon: "grass" },
  { to: "/admin/stages", label: "Crop Stages", icon: "timeline" },
  { to: "/admin/products", label: "Products", icon: "inventory_2" },
  { to: "/admin/stage-products", label: "Stage → Product Map", icon: "account_tree" },
  { to: "/admin/employees", label: "Survey Officers", icon: "badge" },
];

const SURVEY_LINKS = [
  { to: "/survey", label: "Submissions", icon: "fact_check", end: true },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const links = user?.role === "admin" ? ADMIN_LINKS : SURVEY_LINKS;
  const isAdmin = user?.role === "admin";

  // Get initials for avatar
  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "?";

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <span className="material-symbols-rounded">eco</span>
          </div>
          <div>
            <div className="sidebar-brand-text">SmartAgri</div>
            <div className="sidebar-brand-sub">Advisor</div>
          </div>
        </div>
        <div className="sidebar-role-badge">
          <span className="material-symbols-rounded" style={{ fontSize: 13 }}>
            {isAdmin ? "admin_panel_settings" : "person_search"}
          </span>
          {isAdmin ? "Admin Console" : "Survey Officer"}
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-label">Navigation</div>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <span className="material-symbols-rounded">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user-card">
          <div className="sidebar-user-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.fullName || "User"}</div>
            <div className="sidebar-user-email">{user?.email}</div>
          </div>
        </div>
        <button className="sidebar-signout" onClick={logout}>
          <span className="material-symbols-rounded" style={{ fontSize: 17 }}>logout</span>
          Sign out
        </button>
      </div>
    </aside>
  );
}
