export default function PageHeader({ title, subtitle, action }) {
  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
        {subtitle && <div className="topbar-sub">{subtitle}</div>}
      </div>
      {action}
    </header>
  );
}
