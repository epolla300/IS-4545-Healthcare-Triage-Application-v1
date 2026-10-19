import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  FileCheck,
  AlertTriangle,
  Building,
  User,
  Zap,
} from 'lucide-react';
import { ComplaintRecord } from '../types/triage';
import { TriageStepVisualizer } from './TriageStepVisualizer';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaveComplaint: (record: ComplaintRecord) => void;
}

const PRESET_SCENARIOS = [
  {
    title: 'Medication Overdose (High Risk)',
    channel: 'Post-Discharge Survey' as const,
    dept: 'Inpatient Cardiology Ward',
    text: 'My discharge paperwork listed Carvedilol 50mg twice daily when the cardiologist specifically told me 6.25mg! When the retail pharmacy filled it, I took one tablet and my heart rate dropped to 38 bpm. I almost passed out on the bathroom floor.',
  },
  {
    title: 'HIPAA & Privacy Breach (Critical)',
    channel: 'Formal Grievance Report' as const,
    dept: 'Outpatient Psychiatry',
    text: 'The medical records clerk handed my complete psychiatric history and psychotherapy session notes to my ex-husband when he requested our children\'s immunization records. This is a severe HIPAA violation that jeopardizes my custody proceedings.',
  },
  {
    title: 'Interpreter Refusal / Civil Rights (Critical)',
    channel: 'Telephone Transcript' as const,
    dept: 'Emergency Department',
    text: 'I am profoundly deaf and communicate through American Sign Language (ASL). During my emergency visit for severe abdominal pain, the charge nurse refused to request a certified ASL interpreter, saying "writing on paper is good enough." I could not understand the surgical risks.',
  },
  {
    title: 'Surprise Out-of-Network Billing (Moderate)',
    channel: 'Patient Portal Message' as const,
    dept: 'Billing & Patient Accounts',
    text: 'I received an unexpected bill for $2,100 from an out-of-network pathology group for routine bloodwork conducted during an in-network annual physical exam. I was never informed or provided a Good Faith Estimate.',
  },
  {
    title: 'Patient Portal 2FA Bug (Low)',
    channel: 'Online Review / Feedback' as const,
    dept: 'Health Information Technology',
    text: 'Every time I try to view my lab results in the portal on my mobile phone, the two-factor authentication loop returns an error 502 code and resets the login screen.',
  },
];

export const SingleTriageModal: React.FC<Props> = ({ isOpen, onClose, onSaveComplaint }) => {
  const [complaintText, setComplaintText] = useState('');
  const [sourceChannel, setSourceChannel] = useState<ComplaintRecord['sourceChannel']>('Patient Portal Message');
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [dept, setDept] = useState('');
  const [isTriaging, setIsTriaging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [triageOutput, setTriageOutput] = useState<ComplaintRecord | null>(null);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof PRESET_SCENARIOS[0]) => {
    setComplaintText(preset.text);
    setSourceChannel(preset.channel);
    setDept(preset.dept);
    setPatientName('Sample Test Patient');
    setPatientId(`PT-${Math.floor(10000 + Math.random() * 90000)}`);
  };

  const handleRunTriage = async () => {
    if (!complaintText.trim()) {
      setErrorMsg('Please enter a complaint description.');
      return;
    }

    setIsTriaging(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaintText: complaintText.trim(),
          caseNumber: `CASE-LIVE-${Math.floor(1000 + Math.random() * 9000)}`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Triage processing failed');
      }

      const newRecord: ComplaintRecord = {
        id: `single-${Date.now()}`,
        caseNumber: `CASE-LIVE-${Math.floor(1000 + Math.random() * 9000)}`,
        dateReceived: new Date().toISOString(),
        sourceChannel,
        patientName: patientName.trim() || 'Anonymous Complainant',
        patientId: patientId.trim() || undefined,
        submittedDepartment: dept.trim() || undefined,
        complaintText: complaintText.trim(),
        status: 'Triaged',
        triageResult: data.triage,
      };

      setTriageOutput(newRecord);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to triage complaint.');
    } finally {
      setIsTriaging(false);
    }
  };

  const handleSaveAndAdd = () => {
    if (triageOutput) {
      onSaveComplaint(triageOutput);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Live Complaint Triage Workbench</h2>
              <p className="text-xs text-slate-400">
                Execute 6-step clinical triage on any message, phone transcript, or grievance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Quick Preset Selector */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Quick Sample Scenarios:
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_SCENARIOS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 transition text-left"
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Patient Complaint / Grievance Text <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                rows={4}
                placeholder="Paste or enter patient portal message, nurse triage notes, formal grievance statement, or survey feedback..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-teal-500 font-sans leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Source Channel
                </label>
                <select
                  value={sourceChannel}
                  onChange={(e) => setSourceChannel(e.target.value as any)}
                  className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                >
                  <option value="Patient Portal Message">Patient Portal Message</option>
                  <option value="Formal Grievance Report">Formal Grievance Report</option>
                  <option value="Post-Discharge Survey">Post-Discharge Survey</option>
                  <option value="Online Review / Feedback">Online Review / Feedback</option>
                  <option value="Telephone Transcript">Telephone Transcript</option>
                  <option value="In-Person Submission">In-Person Submission</option>
                  <option value="Email / Letter">Email / Letter</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Patient Name (Optional)
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Department / Unit (Optional)
                </label>
                <input
                  type="text"
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  placeholder="e.g. Inpatient Oncology"
                  className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                disabled={isTriaging || !complaintText.trim()}
                onClick={handleRunTriage}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-teal-900/40 transition disabled:opacity-50"
              >
                {isTriaging ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Executing 6-Step Triage...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Run 6-Step Clinical Triage
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Render Result if triaged */}
          {triageOutput && triageOutput.triageResult && (
            <div className="pt-6 border-t border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-teal-400" />
                  Triage Protocol Results
                </h3>
                <button
                  type="button"
                  onClick={handleSaveAndAdd}
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  Save & Add to Patient Safety Queue
                </button>
              </div>

              <TriageStepVisualizer triage={triageOutput.triageResult} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
