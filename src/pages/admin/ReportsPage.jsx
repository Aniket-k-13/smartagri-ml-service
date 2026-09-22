import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader";
import { MockNotice } from "../../components/StatusBadge";
import { MOCK_FLAGS } from "../../api/config";
import { getDashboard } from "../../api/surveysApi";

export default function ReportsPage() {
  const [dash, setDash] = useState(null);

  useEffect(() => {
    getDashboard().then(setDash);
  }, []);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={<>Platform overview {MOCK_FLAGS.dashboard && <MockNotice />}</>}
      />
      <div className="page-body">
        {!dash ? (
          <div className="loading-state">Loading dashboard…</div>
        ) : (
          <>
            <div className="metric-grid">
              <MetricCard label="Total farmers" value={dash.total_farmers} />
              <MetricCard label="Survey officers" value={dash.total_survey_officers} />
              <MetricCard label="Active crop plans" value={dash.total_active_crop_plans} />
              <MetricCard label="Total submissions" value={dash.total_survey_submissions} />
              <MetricCard label="Pending review" value={dash.pending_reviews} accent />
              <MetricCard label="Reviewed" value={dash.reviewed_submissions} />
              <MetricCard label="ML predictions ok" value={dash.successful_ml_predictions} />
              <MetricCard label="ML failures" value={dash.failed_ml_predictions} />
            </div>
          </>
        )}
      </div>
    </>
  );
}

function MetricCard({ label, value, accent }) {
  return (
    <div className="metric-card" style={accent ? { borderColor: "var(--wheat)" } : {}}>
      <div className="metric-value" style={accent ? { color: "var(--wheat)" } : {}}>{value}</div>
      <div className="metric-label">{label}</div>
    </div>
  );
}
