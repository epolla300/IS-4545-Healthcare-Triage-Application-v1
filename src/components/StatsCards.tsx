import React from 'react';
import {
  AlertOctagon,
  ShieldAlert,
  UserCheck,
  Clock,
  Layers,
  HeartPulse,
} from 'lucide-react';
import { ComplaintRecord } from '../types/triage';

interface Props {
  complaints: ComplaintRecord[];
  onSelectFilter: (filterKey: string, filterVal: string) => void;
}

export const StatsCards: React.FC<Props> = ({ complaints, onSelectFilter }) => {
  const total = complaints.length;
  const triaged = complaints.filter((c) => c.status === 'Triaged' || c.status === 'Resolved').length;

  const criticalL4 = complaints.filter(
    (c) => c.triageResult?.severityLevel.includes('LEVEL 4') || c.triageResult?.severityLevel.includes('Level 4')
  ).length;

  const highL3 = complaints.filter(
    (c) => c.triageResult?.severityLevel.includes('LEVEL 3') || c.triageResult?.severityLevel.includes('Level 3')
  ).length;

  const humanReviewReq = complaints.filter(
    (c) => c.triageResult?.humanReviewStatus === 'Human Review Required'
  ).length;

  const immediateEsc = complaints.filter(
    (c) => c.triageResult?.escalationPriority === 'Immediate'
  ).length;

  const safetyRisks = complaints.filter((c) =>
    c.triageResult?.riskFlags.some(
      (r) => r.risk === 'Patient Safety Risk' || r.risk === 'Clinical Risk'
    )
  ).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
      {/* 1. Total Complaints */}
      <div
        onClick={() => onSelectFilter('status', 'ALL')}
        className="bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 rounded-xl p-3.5 transition cursor-pointer shadow-sm group"
      >
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Total Complaints</span>
          <Layers className="w-4 h-4 text-slate-400 group-hover:text-teal-400 transition" />
        </div>
        <div className="text-2xl font-bold text-white tracking-tight">{total}</div>
        <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
          <span>Triaged: {triaged}/{total}</span>
          <span className="text-teal-400 font-semibold">{total > 0 ? Math.round((triaged / total) * 100) : 0}%</span>
        </div>
      </div>

      {/* 2. Critical Level 4 */}
      <div
        onClick={() => onSelectFilter('severity', 'LEVEL 4 – Critical')}
        className={`rounded-xl p-3.5 transition cursor-pointer shadow-sm border ${
          criticalL4 > 0
            ? 'bg-rose-950/40 hover:bg-rose-950/60 border-rose-500/50 ring-1 ring-rose-500/30'
            : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700/80'
        }`}
      >
        <div className="flex items-center justify-between text-rose-300 mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Level 4 Critical</span>
          <AlertOctagon className={`w-4 h-4 ${criticalL4 > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
        </div>
        <div className="text-2xl font-bold text-white tracking-tight flex items-baseline gap-1.5">
          {criticalL4}
          {criticalL4 > 0 && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/20 px-1.5 py-0.5 rounded">
              Urgent
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          L3 High: <span className="text-amber-400 font-semibold">{highL3}</span>
        </div>
      </div>

      {/* 3. Human Review Required */}
      <div
        onClick={() => onSelectFilter('humanReview', 'Human Review Required')}
        className={`rounded-xl p-3.5 transition cursor-pointer shadow-sm border ${
          humanReviewReq > 0
            ? 'bg-purple-950/30 hover:bg-purple-950/50 border-purple-500/40'
            : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700/80'
        }`}
      >
        <div className="flex items-center justify-between text-purple-300 mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Human Review Req</span>
          <UserCheck className="w-4 h-4 text-purple-400" />
        </div>
        <div className="text-2xl font-bold text-white tracking-tight">{humanReviewReq}</div>
        <div className="text-[11px] text-slate-400 mt-1">
          Safety / HIPAA / Equity rules
        </div>
      </div>

      {/* 4. Immediate Escalations */}
      <div
        onClick={() => onSelectFilter('priority', 'Immediate')}
        className={`rounded-xl p-3.5 transition cursor-pointer shadow-sm border ${
          immediateEsc > 0
            ? 'bg-amber-950/30 hover:bg-amber-950/50 border-amber-500/40'
            : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700/80'
        }`}
      >
        <div className="flex items-center justify-between text-amber-300 mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Immediate Escalation</span>
          <Clock className="w-4 h-4 text-amber-400" />
        </div>
        <div className="text-2xl font-bold text-white tracking-tight">{immediateEsc}</div>
        <div className="text-[11px] text-slate-400 mt-1">
          Target SLA: &lt; 2 Hours
        </div>
      </div>

      {/* 5. Patient Safety & Clinical Risks */}
      <div
        onClick={() => onSelectFilter('category', 'Patient Safety')}
        className="bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 rounded-xl p-3.5 transition cursor-pointer shadow-sm col-span-2 md:col-span-1"
      >
        <div className="flex items-center justify-between text-teal-300 mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Clinical / Safety Risks</span>
          <HeartPulse className="w-4 h-4 text-teal-400" />
        </div>
        <div className="text-2xl font-bold text-white tracking-tight">{safetyRisks}</div>
        <div className="text-[11px] text-slate-400 mt-1">
          Harm & Adverse drug alerts
        </div>
      </div>
    </div>
  );
};
