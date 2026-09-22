import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import StatusBadge, { MockNotice } from "../../components/StatusBadge";
import { MOCK_FLAGS } from "../../api/config";
import { listSubmissions } from "../../api/surveysApi";

const FILTERS = [
  { value: "", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under review" },
  { value: "reviewed", label: "Reviewed" },
  { value: "rejected", label: "Rejected" },
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
        subtitle={<>Farmer photo surveys awaiting review {MOCK_FLAGS.surveySubmissions && <MockNotice />}</>}
      />
      <div className="page-body">
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={statusFilter === f.value ? "btn btn-primary" : "btn btn-ghost"}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="panel">
          {submissions === null ? (
            <div className="loading-state">Loading submissions…</div>
          ) : submissions.length === 0 ? (
            <div className="empty-state">No submissions in this filter.</div>
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
                      <strong>{s.farmer?.name}</strong>
                      {s.farmer?.village && (
                        <div style={{ color: "var(--soil)", fontSize: 12 }}>
                          {s.farmer.village}, {s.farmer.district}
                        </div>
                      )}
                    </td>
                    <td>
                      {s.crop?.name}{" "}
                      <span style={{ color: "var(--soil)" }}>— {s.stage?.name}</span>
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>
                      {s.gps_lat && s.gps_lng
                        ? `${Number(s.gps_lat).toFixed(4)}, ${Number(s.gps_lng).toFixed(4)}`
                        : "—"}
                    </td>
                    <td className="mono">
                      {new Date(s.submitted_at).toLocaleDateString()}
                    </td>
                    <td>
                      <StatusBadge status={s.officer_review_status} />
                    </td>
                    <td>
                      <Link className="link-btn" to={`/survey/${s.id}`}>Review</Link>
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
