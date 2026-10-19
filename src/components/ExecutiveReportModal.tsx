import React from 'react';
import {
  FileText,
  X,
  Printer,
  Download,
  ShieldAlert,
  AlertTriangle,
  Building,
  CheckCircle,
} from 'lucide-react';
import { ComplaintRecord } from '../types/triage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  complaints: ComplaintRecord[];
}

export const ExecutiveReportModal: React.FC<Props> = ({ isOpen, onClose, complaints }) => {
  if (!isOpen) return null;

  const triaged = complaints.filter((c) => !!c.triageResult);
  const criticalCases = triaged.filter(
    (c) => c.triageResult?.severityLevel.includes('LEVEL 4') || c.triageResult?.severityLevel.includes('Level 4')
  );
  const immediateCases = triaged.filter((c) => c.triageResult?.escalationPriority === 'Immediate');
  const humanReviewCases = triaged.filter((c) => c.triageResult?.humanReviewStatus === 'Human Review Required');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Executive Complaint Triage & Safety Briefing</h2>
              <p className="text-xs text-slate-400">
                Formal clinical oversight report for Risk Management & Patient Safety Committee
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
            >
              <Printer className="w-4 h-4 text-teal-400" />
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-slate-950/40 text-slate-100 text-xs font-sans print:bg-white print:text-black">
          {/* Document Header */}
          <div className="border-b border-slate-800 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-bold tracking-widest uppercase text-teal-400 print:text-teal-700 block mb-1">
                  HEALTHCARE QUALITY & PATIENT SAFETY DIVISION
                </span>
                <h1 className="text-xl font-bold text-white print:text-black">
                  Patient Complaint & Incident Triage Executive Summary
                </h1>
                <p className="text-xs text-slate-400 print:text-gray-600 mt-1">
                  Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()} • AI Studio Clinical Triage Agent
                </p>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 rounded bg-teal-500/15 border border-teal-500/30 text-teal-300 print:text-black font-semibold text-xs">
                  CONFIDENTIAL / CQI PRIVILEGED
                </span>
              </div>
            </div>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 print:border-gray-300">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Audited</span>
              <div className="text-xl font-bold text-white print:text-black">{triaged.length} Cases</div>
            </div>
            <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 print:border-red-300">
              <span className="text-[10px] text-rose-300 uppercase font-semibold">Level 4 Criticals</span>
              <div className="text-xl font-bold text-rose-400 print:text-red-700">{criticalCases.length} Incidents</div>
            </div>
            <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 print:border-amber-300">
              <span className="text-[10px] text-amber-300 uppercase font-semibold">Immediate SLAs</span>
              <div className="text-xl font-bold text-amber-400 print:text-amber-700">{immediateCases.length} Dispatch</div>
            </div>
            <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-500/30 print:border-purple-300">
              <span className="text-[10px] text-purple-300 uppercase font-semibold">Human Sign-off</span>
              <div className="text-xl font-bold text-purple-400 print:text-purple-700">{humanReviewCases.length} Cases</div>
            </div>
          </div>

          {/* Executive Overview Narrative */}
          <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 print:border-gray-300 space-y-2">
            <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider">
              Governance & Clinical Risk Assessment
            </h3>
            <p className="text-slate-300 print:text-gray-800 text-xs leading-relaxed">
              During the reviewed audit period, {triaged.length} patient communications, portal grievances, and survey feedbacks were triaged through the 6-step standardized protocol. A total of {criticalCases.length} complaints were flagged as <strong>LEVEL 4 – Critical</strong>, requiring immediate multi-disciplinary intervention to mitigate patient harm, HIPAA liability, or civil rights regulatory non-compliance.
            </p>
          </div>

          {/* Urgent Cases Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white print:text-black uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Priority Action Items: Critical & Immediate Escalations
            </h3>

            <div className="border border-slate-800 rounded-xl overflow-hidden print:border-gray-300">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] print:bg-gray-100 print:text-black">
                  <tr>
                    <th className="py-2.5 px-3">Case</th>
                    <th className="py-2.5 px-3">Primary Category</th>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Target Department</th>
                    <th className="py-2.5 px-3">Identified Risks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-gray-200">
                  {criticalCases.length > 0 ? (
                    criticalCases.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-900/40">
                        <td className="py-2.5 px-3 font-semibold text-white print:text-black">
                          {c.caseNumber}
                          <div className="text-[10px] text-slate-500 font-normal">{c.patientName || 'Anonymous'}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-200 print:text-black">
                          {c.triageResult?.primaryCategory}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-rose-400 print:text-red-700">
                          {c.triageResult?.severityLevel}
                        </td>
                        <td className="py-2.5 px-3 text-slate-200 print:text-black">
                          {c.triageResult?.recommendedDepartment}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 print:text-gray-700 text-[11px]">
                          {c.triageResult?.riskFlags.map((r) => r.risk).join(', ')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400">
                        No critical incidents currently pending.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Department Action Routing */}
          <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-[11px] text-slate-400 print:text-gray-600">
            <div>Healthcare Complaint Triage System • Safe, Fair & Compliant Routing</div>
            <div>Sign-off: ________________________ (Chief Medical Officer / VP Quality)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
