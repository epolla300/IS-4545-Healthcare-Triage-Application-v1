import React from 'react';
import {
  BarChart3,
  PieChart,
  ShieldAlert,
  Building,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { ComplaintRecord } from '../types/triage';

interface Props {
  complaints: ComplaintRecord[];
}

export const AnalyticsView: React.FC<Props> = ({ complaints }) => {
  const triaged = complaints.filter((c) => !!c.triageResult);

  // Severity counts
  const severityCounts: Record<string, number> = {
    'LEVEL 4 – Critical': 0,
    'LEVEL 3 – High': 0,
    'LEVEL 2 – Moderate': 0,
    'LEVEL 1 – Low': 0,
  };

  // Category counts
  const categoryCounts: Record<string, number> = {};

  // Risk flags counts
  const riskCounts: Record<string, number> = {};

  // Department counts
  const deptCounts: Record<string, number> = {};

  // Human review counts
  const reviewCounts: Record<string, number> = {
    'Human Review Required': 0,
    'Human Review Recommended': 0,
    'AI Review Only': 0,
  };

  triaged.forEach((c) => {
    const t = c.triageResult!;

    // Severity
    if (severityCounts[t.severityLevel] !== undefined) {
      severityCounts[t.severityLevel]++;
    } else {
      severityCounts[t.severityLevel] = 1;
    }

    // Category
    categoryCounts[t.primaryCategory] = (categoryCounts[t.primaryCategory] || 0) + 1;

    // Risks
    t.riskFlags.forEach((r) => {
      riskCounts[r.risk] = (riskCounts[r.risk] || 0) + 1;
    });

    // Department
    deptCounts[t.recommendedDepartment] = (deptCounts[t.recommendedDepartment] || 0) + 1;

    // Review status
    if (reviewCounts[t.humanReviewStatus] !== undefined) {
      reviewCounts[t.humanReviewStatus]++;
    }
  });

  const totalTriaged = triaged.length || 1;

  const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  const sortedRisks = Object.entries(riskCounts).sort((a, b) => b[1] - a[1]);
  const sortedDepts = Object.entries(deptCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-400" />
            Clinical Triage Analytics & Organizational Risk Profile
          </h2>
          <p className="text-xs text-slate-400">
            Real-time aggregate distribution across {triaged.length} triaged complaints
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Severity Distribution */}
        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" /> Severity Level Breakdown
            </span>
          </div>

          <div className="space-y-3">
            {[
              { label: 'LEVEL 4 – Critical', count: severityCounts['LEVEL 4 – Critical'] || 0, color: 'bg-rose-500', text: 'text-rose-400' },
              { label: 'LEVEL 3 – High', count: severityCounts['LEVEL 3 – High'] || 0, color: 'bg-amber-500', text: 'text-amber-400' },
              { label: 'LEVEL 2 – Moderate', count: severityCounts['LEVEL 2 – Moderate'] || 0, color: 'bg-sky-500', text: 'text-sky-400' },
              { label: 'LEVEL 1 – Low', count: severityCounts['LEVEL 1 – Low'] || 0, color: 'bg-emerald-500', text: 'text-emerald-400' },
            ].map((sev) => {
              const pct = Math.round((sev.count / totalTriaged) * 100);
              return (
                <div key={sev.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-semibold ${sev.text}`}>{sev.label}</span>
                    <span className="text-slate-400">
                      {sev.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${sev.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Human Review Oversight Ratio */}
        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-400" /> Human Oversight Enforcement
            </span>
          </div>

          <div className="space-y-3">
            {[
              {
                label: 'Human Review Required',
                count: reviewCounts['Human Review Required'],
                desc: 'Mandatory clinical/compliance sign-off before closure',
                color: 'bg-rose-500',
                border: 'border-rose-500/30',
              },
              {
                label: 'Human Review Recommended',
                count: reviewCounts['Human Review Recommended'],
                desc: 'Departmental supervisory remediation advised',
                color: 'bg-amber-500',
                border: 'border-amber-500/30',
              },
              {
                label: 'AI Review Only',
                count: reviewCounts['AI Review Only'],
                desc: 'Eligible for automated logging and aggregate trend review',
                color: 'bg-slate-500',
                border: 'border-slate-700',
              },
            ].map((item) => {
              const pct = Math.round((item.count / totalTriaged) * 100);
              return (
                <div key={item.label} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{item.label}</span>
                    <span className="font-bold text-white">
                      {item.count} <span className="text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Risk Flags Frequency */}
        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Active Risk Types Flagged
            </span>
            <span className="text-xs text-slate-400">Total: {sortedRisks.reduce((a, b) => a + b[1], 0)}</span>
          </div>

          <div className="space-y-2">
            {sortedRisks.length > 0 ? (
              sortedRisks.map(([risk, count]) => {
                const pct = Math.round((count / totalTriaged) * 100);
                return (
                  <div key={risk} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">{risk}</span>
                      <span className="text-slate-400 font-semibold">{count}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-rose-500/80 transition-all duration-500"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">No risk flags detected.</p>
            )}
          </div>
        </div>

        {/* Recommended Department Routing */}
        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-400" /> Escalation Department Routing
            </span>
          </div>

          <div className="space-y-2">
            {sortedDepts.length > 0 ? (
              sortedDepts.map(([dept, count]) => {
                const pct = Math.round((count / totalTriaged) * 100);
                return (
                  <div key={dept} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 truncate max-w-[240px]">{dept}</span>
                      <span className="text-indigo-300 font-semibold">{count} cases ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">No departments routed yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
