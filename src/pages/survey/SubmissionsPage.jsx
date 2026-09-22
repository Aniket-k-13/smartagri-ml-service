import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import StatusBadge, { MockNotice } from "../../components/StatusBadge";
import { MOCK_FLAGS } from "../../api/config";
import { listSubmissions } from "../../api/surveysApi";

const FILTERS = [
  { value: "", label: "All", icon: "list" },
  { value: "submitted", label: "Submitted", icon: "inbox" },
  { value: "under_review", label: "Under Review", icon: "manage_search" },
  { value: "reviewed", label: "Reviewed", icon: "task_alt" },
  { value: "rejected", label: "Rejected", icon: "cancel" },
];

export default function SubmissionsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [submissions, setSubmissions] = useState(null);

  useEffect(() => {
    setSubmissions(null);
    listSubmissions({ officer_review_status: statusFilter || undefined }).then(setSubmissions);
  }, [statusFilter]);

  return (
    <>
      <PageHeader
        title="Submissions"
        subtitle={
          <>
            <span className="material-symbols-rounded" style={{ fontSize: 14, opacity: 0.6 }}>photo_camera</span>
            Farmer photo surveys awaiting review {MOCK_FLAGS.surveySubmissions && <MockNotice />}
          </>
        }
      />
      <div className="page-body">
        {/* Filter tabs */}
        <div className="filter-tabs">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`filter-tab${statusFilter === f.value ? " active" : ""}`}
              onClick={() => setStatusFilter(f.value)}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 15, verticalAlign: "middle", marginRight: 4 }}>{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>

        <div className="panel">
          {submissions === null ? (
            <div className="loading-state">
              <div className="spinner" />
              Loading submissions…
            </div>
          ) : submissions.length === 0 ? (
            <div className="empty-state">
              <span className="material-symbols-rounded empty-state-icon">inbox</span>
              <p>No submissions in this filter.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Farmer</th>
                  <th>Crop / Stage</th>
                  <th>Location</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: "50%",
                          background: "var(--sage)", border: "1.5px solid var(--line)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          <span className="material-symbols-rounded" style={{ fontSize: 18, color: "var(--canopy-2)" }}>person</span>
                        </div>
                        <div>
                          <strong style={{ fontSize: 14 }}>{s.farmer?.name}</strong>
                          {s.farmer?.village && (
                            <div style={{ color: "var(--soil)", fontSize: 12 }}>
                              {s.farmer.village}, {s.farmer.district}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{s.crop?.name}</div>
                      <div style={{ color: "var(--soil)", fontSize: 12 }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 12, verticalAlign: "middle" }}>timeline</span>
                        {" "}{s.stage?.name}
                      </div>
                    </td>
                    <td>
                      {s.gps_lat && s.gps_lng ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--soil)", fontSize: 12 }}>
                          <span className="material-symbols-rounded" style={{ fontSize: 14 }}>location_on</span>
                          <span className="mono">{Number(s.gps_lat).toFixed(3)}, {Number(s.gps_lng).toFixed(3)}</span>
                        </div>
                      ) : (
                        <span style={{ color: "var(--soil)", fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td>
                      <div className="mono" style={{ fontSize: 13 }}>
                        {new Date(s.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                      <div style={{ color: "var(--soil)", fontSize: 11 }}>
                        {new Date(s.submitted_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={s.officer_review_status} />
                    </td>
                    <td>
                      <Link
                        className="btn btn-sm btn-ghost"
                        to={`/survey/${s.id}`}
                        style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}
                      >
                        <span className="material-symbols-rounded" style={{ fontSize: 15 }}>visibility</span>
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
