import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import StatusBadge, { MockNotice } from "../../components/StatusBadge";
import { MOCK_FLAGS } from "../../api/config";
import { getSubmission, reviewSubmission } from "../../api/surveysApi";
import { useAuth } from "../../context/AuthContext";

export default function SubmissionDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [submission, setSubmission] = useState(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  useEffect(() => {
    getSubmission(Number(id)).then((s) => {
      setSubmission(s);
      setNotes(s.officer_notes || "");
    });
  }, [id]);

  async function handleReview(nextStatus) {
    setSaving(true);
    try {
      const updated = await reviewSubmission(Number(id), {
        officer_review_status: nextStatus,
        officer_notes: notes,
      });
      setSubmission(updated);
    } finally {
      setSaving(false);
    }
  }

  if (!submission) {
    return (
      <>
        <PageHeader
          title={`Submission #${id}`}
          subtitle={
            <Link to={user?.role === "admin" ? "/admin/submissions" : "/survey"} style={{ color: "var(--soil)" }}>
              ← Back to submissions
            </Link>
          }
        />
        <div className="page-body"><div className="loading-state">Loading submission…</div></div>
      </>
    );
  }

  const ml = submission.latest_ml_prediction;
  const isAdmin = user?.role === "admin";

  return (
    <>
      <PageHeader
        title={`Submission #${id}`}
        subtitle={
          <>
            <Link to={isAdmin ? "/admin/submissions" : "/survey"} style={{ color: "var(--soil)" }}>
              ← Back to submissions
            </Link>
            {" "}{MOCK_FLAGS.surveySubmissions && <MockNotice />}
          </>
        }
      />
      <div className="page-body">
        <div className="review-grid">
          {/* LEFT: photo + officer actions */}
          <div>
            {submission.image_url ? (
              <img className="review-photo" src={submission.image_url} alt="Survey submission" />
            ) : (
              <div className="review-photo" style={{ background: "var(--sage)", display: "grid", placeItems: "center", minHeight: 240, color: "var(--soil)", fontSize: 14 }}>
                No photo uploaded
              </div>
            )}

            {/* ML Prediction card */}
            {ml && (
              <div className="panel" style={{ marginTop: 16 }}>
                <div className="panel-header">
                  <h2>ML Result</h2>
                  <span className={`badge badge-${ml.status === "success" ? "active" : ml.status === "failed" ? "rejected" : "planned"}`}>
                    {ml.status}
                  </span>
                </div>
                <div style={{ padding: "8px 20px 16px" }}>
                  {ml.status === "success" ? (
                    <dl>
                      <div className="detail-row">
                        <dt>Health label</dt>
                        <dd style={{ fontWeight: 700, color: ml.health_label === "Healthy" ? "var(--moss)" : "var(--rust)" }}>
                          {ml.health_label}
                        </dd>
                      </div>
                      {ml.disease_type && (
                        <div className="detail-row">
                          <dt>Disease type</dt>
                          <dd style={{ textTransform: "capitalize" }}>{ml.disease_type}</dd>
                        </div>
                      )}
                      <div className="detail-row">
                        <dt>Confidence</dt>
                        <dd className="mono">{(parseFloat(ml.confidence) * 100).toFixed(1)}%</dd>
                      </div>
                      <div className="detail-row">
                        <dt>Timing</dt>
                        <dd style={{ textTransform: "capitalize" }}>{ml.timing_flag?.replace(/_/g, " ")}</dd>
                      </div>
                      <div className="detail-row">
                        <dt>Dosage factor</dt>
                        <dd className="mono">{ml.dosage_factor}×</dd>
                      </div>
                      <div className="detail-row" style={{ border: "none", paddingTop: 10 }}>
                        <dt>Recommendation</dt>
                      </div>
                      <div style={{ fontSize: 13, color: "var(--canopy)", paddingBottom: 8, fontStyle: "italic" }}>
                        {ml.final_recommendation}
                      </div>
                    </dl>
                  ) : ml.status === "failed" ? (
                    <p style={{ color: "var(--rust)", fontSize: 13, padding: "8px 0" }}>
                      ML prediction failed. Please review manually.
                    </p>
                  ) : (
                    <p style={{ color: "var(--soil)", fontSize: 13, padding: "8px 0" }}>
                      ML prediction is {ml.status}…
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Officer notes + action buttons (read-only for admin) */}
            <div style={{ marginTop: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Officer notes
              </label>
              {isAdmin ? (
                <div style={{
                  width: "100%", padding: 10, border: "1px solid var(--line)", borderRadius: 6,
                  fontSize: 14, fontFamily: "inherit", background: "var(--sage)",
                  color: "var(--canopy)", minHeight: 96, whiteSpace: "pre-wrap",
                }}>
                  {notes || "No notes from the officer yet."}
                </div>
              ) : (
                <textarea
                  rows={4}
                  style={{ width: "100%", padding: 10, border: "1px solid var(--line)", borderRadius: 6, fontSize: 14, fontFamily: "inherit" }}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add findings or instructions for the farmer…"
                />
              )}
              <div className="row-actions" style={{ marginTop: 12, flexWrap: "wrap" }}>
                {!isAdmin && (
                  <>
                    <button className="btn btn-primary" disabled={saving} onClick={() => handleReview("reviewed")}>
                      Approve
                    </button>
                    <button className="btn btn-ghost" disabled={saving} onClick={() => handleReview("rejected")}
                      style={{ borderColor: "var(--rust)", color: "var(--rust)" }}>
                      Flag / Reject
                    </button>
                  </>
                )}
                <button className="btn btn-ghost" onClick={() => setShowPdfPreview(true)}>
                  Generate Report PDF
                </button>
              </div>
              {isAdmin && (
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--soil)" }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 13, verticalAlign: "middle" }}>lock</span>
                  {" "}Only Survey Officers can approve, flag, or reject. You can view and download the report.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: submission details */}
          <div className="panel">
            <div className="panel-header">
              <h2>Submission details</h2>
              <StatusBadge status={submission.officer_review_status} />
            </div>
            <div style={{ padding: "8px 20px 20px" }}>
              <dl>
                <div className="detail-row">
                  <dt>Farmer</dt>
                  <dd>{submission.farmer?.name}</dd>
                </div>
                <div className="detail-row">
                  <dt>Village / District</dt>
                  <dd>{submission.farmer?.village}, {submission.farmer?.district}</dd>
                </div>
                <div className="detail-row">
                  <dt>Phone</dt>
                  <dd className="mono">{submission.farmer?.phone || "—"}</dd>
                </div>
                <div className="detail-row">
                  <dt>Crop</dt>
                  <dd>{submission.crop?.name}</dd>
                </div>
                <div className="detail-row">
                  <dt>Stage</dt>
                  <dd>{submission.stage?.name} (#{submission.stage?.order})</dd>
                </div>
                <div className="detail-row">
                  <dt>Submitted</dt>
                  <dd className="mono">{new Date(submission.submitted_at).toLocaleString()}</dd>
                </div>
                <div className="detail-row">
                  <dt>GPS</dt>
                  <dd className="mono">
                    {submission.gps_lat && submission.gps_lng
                      ? `${Number(submission.gps_lat).toFixed(6)}, ${Number(submission.gps_lng).toFixed(6)}`
                      : "—"}
                  </dd>
                </div>
                <div className="detail-row">
                  <dt>Soil moisture</dt>
                  <dd className="mono">
                    {submission.soil_moisture_percent != null ? `${submission.soil_moisture_percent}%` : "—"}
                  </dd>
                </div>
                <div className="detail-row">
                  <dt>Observations</dt>
                  <dd>{submission.observations || "—"}</dd>
                </div>
                <div className="detail-row">
                  <dt>Issues reported</dt>
                  <dd>{submission.issues_reported || "—"}</dd>
                </div>
                {submission.reviewed_by && (
                  <div className="detail-row">
                    <dt>Reviewed by</dt>
                    <dd>{submission.reviewed_by.name}</dd>
                  </div>
                )}
                {submission.reviewed_at && (
                  <div className="detail-row">
                    <dt>Reviewed at</dt>
                    <dd className="mono">{new Date(submission.reviewed_at).toLocaleString()}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>

      {showPdfPreview && (
        <PdfPreviewModal
          submission={submission}
          ml={ml}
          notes={notes}
          officerName={user?.fullName || user?.email}
          onClose={() => setShowPdfPreview(false)}
        />
      )}
    </>
  );
}

/* ---------- Editable PDF Preview Modal ---------- */

function PdfPreviewModal({ submission, ml, notes, officerName, onClose }) {
  const [draft, setDraft] = useState({
    farmerName: submission.farmer?.name || "",
    village: `${submission.farmer?.village || ""}, ${submission.farmer?.district || ""}`,
    crop: submission.crop?.name || "",
    stage: submission.stage?.name || "",
    submittedAt: new Date(submission.submitted_at).toLocaleString(),
    soilMoisture: submission.soil_moisture_percent != null ? `${submission.soil_moisture_percent}%` : "N/A",
    observations: submission.observations || "",
    issuesReported: submission.issues_reported || "",
    healthLabel: ml?.health_label || "N/A",
    diseaseType: ml?.disease_type || "N/A",
    confidence: ml ? `${(parseFloat(ml.confidence) * 100).toFixed(1)}%` : "N/A",
    timingFlag: ml?.timing_flag?.replace(/_/g, " ") || "N/A",
    dosageFactor: ml ? `${ml.dosage_factor}×` : "N/A",
    finalRecommendation: ml?.final_recommendation || "",
    officerNotes: notes,
    reviewedBy: officerName || "",
    generatedAt: new Date().toLocaleString(),
  });

  function set(field) {
    return (e) => setDraft({ ...draft, [field]: e.target.value });
  }

  async function handleDownload() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = 210;
    const margin = 16;
    const col1 = margin;
    const col2 = 80;
    let y = 18;

    // Header
    doc.setFillColor(20, 38, 28);
    doc.rect(0, 0, W, 26, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("SmartAgri Advisor", margin, 11);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Survey Submission Report", margin, 18);
    doc.setTextColor(201, 150, 47);
    doc.text(`Generated: ${draft.generatedAt}`, W - margin, 18, { align: "right" });

    y = 34;
    doc.setTextColor(20, 38, 28);

    function sectionTitle(label) {
      doc.setFillColor(241, 244, 238);
      doc.rect(margin, y - 4, W - margin * 2, 8, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 38, 28);
      doc.text(label.toUpperCase(), col1 + 2, y + 1);
      y += 10;
    }

    function row(label, value) {
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(107, 91, 69);
      doc.text(label, col1, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(20, 38, 28);
      const lines = doc.splitTextToSize(String(value || "—"), W - col2 - margin);
      doc.text(lines, col2, y);
      y += lines.length * 5 + 2;
    }

    sectionTitle("Farmer & Field Info");
    row("Farmer", draft.farmerName);
    row("Location", draft.village);
    row("Crop", draft.crop);
    row("Stage", draft.stage);
    row("Submitted At", draft.submittedAt);
    row("Soil Moisture", draft.soilMoisture);

    y += 3;
    sectionTitle("Field Observations");
    row("Observations", draft.observations || "—");
    row("Issues Reported", draft.issuesReported || "—");

    y += 3;
    sectionTitle("ML Prediction Result");
    row("Health Label", draft.healthLabel);
    row("Disease Type", draft.diseaseType);
    row("Confidence", draft.confidence);
    row("Timing", draft.timingFlag);
    row("Dosage Factor", draft.dosageFactor);
    row("Final Recommendation", draft.finalRecommendation);

    y += 3;
    sectionTitle("Officer Review");
    row("Officer Notes", draft.officerNotes || "—");
    row("Reviewed By", draft.reviewedBy);

    // Footer
    doc.setDrawColor(221, 227, 214);
    doc.line(margin, 280, W - margin, 280);
    doc.setFontSize(7.5);
    doc.setTextColor(107, 91, 69);
    doc.text("SmartAgri Advisor — Confidential field report. Not for public distribution.", margin, 285);

    doc.save(`SmartAgri_Submission_${submission.id}_Report.pdf`);
  }

  const fieldStyle = { width: "100%", padding: "6px 8px", border: "1px solid var(--line)", borderRadius: 6, fontSize: 13, fontFamily: "inherit", marginBottom: 10, background: "var(--paper)", color: "var(--canopy)" };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 600, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: 4 }}>Report Preview — edit before downloading</h2>
        <p style={{ fontSize: 12, color: "var(--soil)", marginBottom: 16 }}>All fields are auto-filled from the submission. Edit anything before saving PDF.</p>

        {[
          ["Farmer name", "farmerName"],
          ["Location", "village"],
          ["Crop", "crop"],
          ["Stage", "stage"],
          ["Submitted at", "submittedAt"],
          ["Soil moisture", "soilMoisture"],
        ].map(([label, key]) => (
          <div key={key}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--soil)" }}>{label}</label>
            <input style={fieldStyle} value={draft[key]} onChange={set(key)} />
          </div>
        ))}

        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--soil)" }}>Observations</label>
        <textarea style={{ ...fieldStyle }} rows={2} value={draft.observations} onChange={set("observations")} />

        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--soil)" }}>Issues reported</label>
        <textarea style={{ ...fieldStyle }} rows={2} value={draft.issuesReported} onChange={set("issuesReported")} />

        {[
          ["ML health label", "healthLabel"],
          ["Disease type", "diseaseType"],
          ["Confidence", "confidence"],
          ["Timing flag", "timingFlag"],
          ["Dosage factor", "dosageFactor"],
        ].map(([label, key]) => (
          <div key={key}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--soil)" }}>{label}</label>
            <input style={fieldStyle} value={draft[key]} onChange={set(key)} />
          </div>
        ))}

        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--soil)" }}>Final recommendation</label>
        <textarea style={{ ...fieldStyle }} rows={3} value={draft.finalRecommendation} onChange={set("finalRecommendation")} />

        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--soil)" }}>Officer notes</label>
        <textarea style={{ ...fieldStyle }} rows={3} value={draft.officerNotes} onChange={set("officerNotes")} />

        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--soil)" }}>Reviewed by</label>
        <input style={fieldStyle} value={draft.reviewedBy} onChange={set("reviewedBy")} />

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleDownload}>
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
