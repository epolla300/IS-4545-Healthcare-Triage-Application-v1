import React, { useState } from 'react';
import {
  X,
  User,
  Calendar,
  Tag,
  Building,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Send,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { ComplaintRecord, ComplaintCategory, SeverityLevel, RoutingDepartment, EscalationPriority } from '../types/triage';
import { TriageStepVisualizer } from './TriageStepVisualizer';

interface Props {
  complaint: ComplaintRecord | null;
  onClose: () => void;
  onUpdateComplaint: (updated: ComplaintRecord) => void;
  onReTriage: (complaint: ComplaintRecord) => Promise<void>;
  isReTriaging?: boolean;
}

export const TriageDetailDrawer: React.FC<Props> = ({
  complaint,
  onClose,
  onUpdateComplaint,
  onReTriage,
  isReTriaging = false,
}) => {
  if (!complaint) return null;

  const [reviewerName, setReviewerName] = useState(complaint.humanReview?.reviewedBy || 'Nurse Manager Sarah Vance, RN');
  const [reviewNotes, setReviewNotes] = useState(complaint.humanReview?.notes || '');
  const [overrideCategory, setOverrideCategory] = useState<ComplaintCategory>(
    complaint.humanReview?.overrideCategory || complaint.triageResult?.primaryCategory || 'Clinical Care'
  );
  const [overrideSeverity, setOverrideSeverity] = useState<SeverityLevel>(
    complaint.humanReview?.overrideSeverity || complaint.triageResult?.severityLevel || 'LEVEL 3 – High'
  );
  const [overrideDept, setOverrideDept] = useState<RoutingDepartment>(
    complaint.humanReview?.overrideDepartment || complaint.triageResult?.recommendedDepartment || 'Quality Improvement Team'
  );
  const [overridePriority, setOverridePriority] = useState<EscalationPriority>(
    complaint.humanReview?.overridePriority || complaint.triageResult?.escalationPriority || 'Priority'
  );
  const [isEditingOverride, setIsEditingOverride] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveReview = (statusType: 'Verified & Approved' | 'Modified / Overridden') => {
    const updated: ComplaintRecord = {
      ...complaint,
      status: 'Resolved',
      humanReview: {
        reviewedBy: reviewerName,
        reviewedAt: new Date().toISOString(),
        status: statusType,
        notes: reviewNotes,
        overrideCategory: statusType === 'Modified / Overridden' ? overrideCategory : undefined,
        overrideSeverity: statusType === 'Modified / Overridden' ? overrideSeverity : undefined,
        overrideDepartment: statusType === 'Modified / Overridden' ? overrideDept : undefined,
        overridePriority: statusType === 'Modified / Overridden' ? overridePriority : undefined,
      },
    };

    onUpdateComplaint(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-3xl bg-slate-900 border-l border-slate-700 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-6 border-b border-slate-700/80 bg-slate-900/90 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Complaint Case: {complaint.caseNumber}
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {complaint.sourceChannel}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Received: {new Date(complaint.dateReceived).toLocaleDateString()} {new Date(complaint.dateReceived).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onReTriage(complaint)}
              disabled={isReTriaging}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition disabled:opacity-50"
              title="Re-run triage engine"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-teal-400 ${isReTriaging ? 'animate-spin' : ''}`} />
              {isReTriaging ? 'Triaging...' : 'Re-Triage'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-800/50 p-3.5 rounded-xl border border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 flex items-center gap-1 mb-0.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Patient:
              </span>
              <span className="font-semibold text-white truncate block">
                {complaint.patientName || 'Anonymous'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {complaint.patientId || 'ID: Unspecified'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 flex items-center gap-1 mb-0.5">
                <Building className="w-3.5 h-3.5 text-slate-400" /> Unit / Dept:
              </span>
              <span className="font-semibold text-white truncate block">
                {complaint.submittedDepartment || 'Hospital Wide'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 flex items-center gap-1 mb-0.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" /> Case Status:
              </span>
              <span
                className={`font-semibold inline-block px-2 py-0.5 rounded text-[11px] ${
                  complaint.status === 'Resolved'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : complaint.status === 'Triaged'
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                }`}
              >
                {complaint.status}
              </span>
            </div>

            <div>
              <span className="text-slate-400 flex items-center gap-1 mb-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Intake Channel:
              </span>
              <span className="font-semibold text-white truncate block">
                {complaint.sourceChannel}
              </span>
            </div>
          </div>

          {/* Original Complaint Narrative */}
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Original Complaint Narrative
              </span>
              <span className="text-[11px] text-slate-400">
                {complaint.complaintText.length} characters
              </span>
            </div>
            <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 text-slate-200 text-sm leading-relaxed font-sans select-text">
              "{complaint.complaintText}"
            </div>
          </div>

          {/* 6-Step Triage Output Visualizer */}
          {complaint.triageResult ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                  Clinical Triage Protocol (6 Steps)
                </h3>
                <span className="text-xs text-slate-400">
                  Engine:{' '}
                  <span className="text-teal-300 font-semibold">
                    {complaint.triageResult.triageSource === 'gemini' ? 'Gemini 3.8 Flash' : 'Clinical Heuristics'}
                  </span>
                </span>
              </div>
              <TriageStepVisualizer triage={complaint.triageResult} />
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-800/40 rounded-xl border border-dashed border-slate-700">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-200">This complaint has not been triaged yet.</p>
              <button
                type="button"
                onClick={() => onReTriage(complaint)}
                className="mt-3 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition"
              >
                Run Triage Now
              </button>
            </div>
          )}

          {/* Human Review & Oversight Action Panel */}
          <div className="bg-slate-800/90 rounded-xl p-5 border border-purple-500/30 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white">
                  Human Oversight & Clinical Review Sign-off
                </h3>
              </div>
              {complaint.humanReview?.status && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  {complaint.humanReview.status}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              In accordance with patient safety governance and regulatory compliance, certified human reviewers may affirm the AI triage or apply clinical overrides before dispatching to the response queue.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 uppercase block mb-1">
                  Reviewer Name & Credential
                </label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="e.g. Dr. Robert Lee, MD or Sarah Jenkins, RN"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 uppercase block mb-1">
                  Review Mode
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingOverride(false)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition ${
                      !isEditingOverride
                        ? 'bg-purple-600/30 text-purple-200 border-purple-500'
                        : 'bg-slate-900 text-slate-400 border-slate-700'
                    }`}
                  >
                    Confirm Triage
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingOverride(true)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition ${
                      isEditingOverride
                        ? 'bg-purple-600/30 text-purple-200 border-purple-500'
                        : 'bg-slate-900 text-slate-400 border-slate-700'
                    }`}
                  >
                    Manual Override
                  </button>
                </div>
              </div>
            </div>

            {/* Manual Override Fields if enabled */}
            {isEditingOverride && (
              <div className="p-3.5 bg-slate-900/90 rounded-lg border border-purple-500/40 space-y-3">
                <span className="text-xs font-bold text-purple-300 block">
                  Override Categorization & Routing Parameters
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Primary Category</label>
                    <select
                      value={overrideCategory}
                      onChange={(e) => setOverrideCategory(e.target.value as ComplaintCategory)}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                    >
                      <option value="Communication">Communication</option>
                      <option value="Scheduling">Scheduling</option>
                      <option value="Wait Time">Wait Time</option>
                      <option value="Technology / Patient Portal">Technology / Patient Portal</option>
                      <option value="Billing">Billing</option>
                      <option value="Clinical Care">Clinical Care</option>
                      <option value="Discharge and Follow-Up">Discharge and Follow-Up</option>
                      <option value="Accessibility and Equity">Accessibility and Equity</option>
                      <option value="Patient Safety">Patient Safety</option>
                      <option value="Privacy or Security">Privacy or Security</option>
                      <option value="Staff Conduct">Staff Conduct</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Severity Level</label>
                    <select
                      value={overrideSeverity}
                      onChange={(e) => setOverrideSeverity(e.target.value as SeverityLevel)}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                    >
                      <option value="LEVEL 1 – Low">LEVEL 1 – Low</option>
                      <option value="LEVEL 2 – Moderate">LEVEL 2 – Moderate</option>
                      <option value="LEVEL 3 – High">LEVEL 3 – High</option>
                      <option value="LEVEL 4 – Critical">LEVEL 4 – Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Routing Department</label>
                    <select
                      value={overrideDept}
                      onChange={(e) => setOverrideDept(e.target.value as RoutingDepartment)}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                    >
                      <option value="Patient Experience Team">Patient Experience Team</option>
                      <option value="Nursing Leadership">Nursing Leadership</option>
                      <option value="Physician Leadership">Physician Leadership</option>
                      <option value="Quality Improvement Team">Quality Improvement Team</option>
                      <option value="Compliance Office">Compliance Office</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Revenue Cycle / Billing">Revenue Cycle / Billing</option>
                      <option value="Accessibility Coordinator">Accessibility Coordinator</option>
                      <option value="Risk Management">Risk Management</option>
                      <option value="Executive Review">Executive Review</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Escalation Priority</label>
                    <select
                      value={overridePriority}
                      onChange={(e) => setOverridePriority(e.target.value as EscalationPriority)}
                      className="w-full px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-xs text-white"
                    >
                      <option value="Routine">Routine</option>
                      <option value="Priority">Priority</option>
                      <option value="Immediate">Immediate</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-semibold text-slate-300 uppercase block mb-1">
                Clinical Oversight / Remediation Notes
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={2}
                placeholder="Enter investigation notes, immediate safety mitigations, or follow-up instructions..."
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {savedSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Human review decision recorded and synced successfully.
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleSaveReview('Verified & Approved')}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 shadow transition"
              >
                <CheckCircle className="w-4 h-4" />
                Approve & Sign Off
              </button>
              {isEditingOverride && (
                <button
                  type="button"
                  onClick={() => handleSaveReview('Modified / Overridden')}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 shadow transition"
                >
                  <Send className="w-4 h-4" />
                  Save Override
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
