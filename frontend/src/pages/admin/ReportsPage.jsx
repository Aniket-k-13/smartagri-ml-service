import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader";
import { MockNotice } from "../../components/StatusBadge";
import { MOCK_FLAGS } from "../../api/config";
import { getDashboard } from "../../api/surveysApi";

const METRIC_CARDS = [
  { key: "total_farmers", label: "Total Farmers", icon: "people", color: "var(--canopy-2)" },
  { key: "total_survey_officers", label: "Survey Officers", icon: "badge", color: "var(--sky)" },
  { key: "total_active_crop_plans", label: "Active Crop Plans", icon: "grass", color: "var(--moss)" },
  { key: "total_survey_submissions", label: "Total Submissions", icon: "assignment", color: "var(--wheat)" },
  { key: "pending_reviews", label: "Pending Review", icon: "pending_actions", color: "var(--rust)", accent: true },
  { key: "reviewed_submissions", label: "Reviewed", icon: "task_alt", color: "var(--moss)" },
  { key: "successful_ml_predictions", label: "ML Predictions OK", icon: "psychology", color: "var(--sky)" },
  { key: "failed_ml_predictions", label: "ML Failures", icon: "error_outline", color: "var(--rust)" },
];

export default function ReportsPage() {
  const [dash, setDash] = useState(null);

  useEffect(() => {
    getDashboard().then(setDash);
  }, []);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={
          <>
            <span className="material-symbols-rounded" style={{ fontSize: 14, opacity: 0.6 }}>bar_chart</span>
            Platform overview {MOCK_FLAGS.dashboard && <MockNotice />}
          </>
        }
      />
      <div className="page-body">
        {!dash ? (
          <div className="loading-state">
            <div className="spinner" />
            Loading dashboard…
          </div>
        ) : (
          <>
            <div className="metric-grid">
              {METRIC_CARDS.map(({ key, label, icon, color, accent }) => (
                <div
                  className="metric-card"
                  key={key}
                  style={accent ? { borderTopColor: "var(--rust)", borderTopWidth: 3 } : {}}
                >
                  <div className="metric-card-icon" style={{ background: `${color}18`, color }}>
                    <span className="material-symbols-rounded">{icon}</span>
                  </div>
                  <div className="metric-value" style={accent && dash[key] > 0 ? { color: "var(--rust)" } : {}}>
                    {dash[key] ?? 0}
                  </div>
                  <div className="metric-label">{label}</div>
                </div>
              ))}
            </div>

            {/* Quick Summary Panel */}
            <div className="panel">
              <div className="panel-header">
                <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 18, color: "var(--wheat)" }}>insights</span>
                  Platform Summary
                </h2>
              </div>
              <div style={{ padding: "16px 22px" }}>
                <dl style={{ margin: 0 }}>
                  {[
                    { label: "Total farmers registered", value: dash.total_farmers },
                    { label: "Survey officers active", value: dash.total_survey_officers },
                    { label: "Active crop plans this season", value: dash.total_active_crop_plans },
                    { label: "Total survey submissions", value: dash.total_survey_submissions },
                    { label: "Submissions pending officer review", value: dash.pending_reviews },
                    { label: "Submissions already reviewed", value: dash.reviewed_submissions },
                    { label: "ML predictions completed successfully", value: dash.successful_ml_predictions },
                    { label: "ML prediction failures", value: dash.failed_ml_predictions },
                  ].map(({ label, value }) => (
                    <div className="detail-row" key={label}>
                      <dt>{label}</dt>
                      <dd className="mono">{value ?? 0}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
