import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ADMIN_LINKS = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/crops", label: "Crops" },
  { to: "/admin/stages", label: "Crop Stages" },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/stage-products", label: "Stage \u2192 Product Map" },
  { to: "/admin/employees", label: "Survey Officers" },
];

const SURVEY_LINKS = [{ to: "/survey", label: "Submissions", end: true }];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const links = user?.role === "admin" ? ADMIN_LINKS : SURVEY_LINKS;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">SmartAgri Advisor</div>
      <div className="sidebar-role">{user?.role === "admin" ? "Admin Console" : "Survey Officer"}</div>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          {user?.fullName || user?.email}
          <span>{user?.email}</span>
        </div>
        <button className="btn btn-ghost btn-block" onClick={logout}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
