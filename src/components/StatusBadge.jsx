export default function StatusBadge({ status }) {
  const label = status.replace(/_/g, " ");
  return <span className={`badge badge-${status}`}>{label}</span>;
}

/**
 * Small inline flag so it's always visible during dev which screens are
 * still running on mock data vs the real backend (see api/config.js).
 * Safe to delete once every MOCK_FLAGS entry a screen depends on is false.
 */
export function MockNotice() {
  return (
    <span className="mock-notice">
      <span className="material-symbols-rounded" style={{ fontSize: 11 }}>data_object</span>
      mock data
    </span>
  );
}
