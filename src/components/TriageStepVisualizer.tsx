import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  ArrowRight,
  Copy,
  Check,
  Building2,
  FileText,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { TriageResult } from '../types/triage';

interface Props {
  triage: TriageResult;
  showRawOutputToggle?: boolean;
}

export const TriageStepVisualizer: React.FC<Props> = ({ triage, showRawOutputToggle = true }) => {
  const [copied, setCopied] = useState(false);
  const [showRawOutput, setShowRawOutput] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(triage.formattedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSeverityStyle = (level: string) => {
    if (level.includes('Level 4') || level.includes('LEVEL 4')) {
      return {
        badge: 'bg-rose-500/15 text-rose-300 border-rose-500/40 ring-1 ring-rose-500/30',
        card: 'border-rose-500/40 bg-gradient-to-br from-rose-950/30 to-slate-900/60',
        text: 'text-rose-400',
        icon: <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />,
        sla: 'Immediate Action (< 2 Hours)',
      };
    }
    if (level.includes('Level 3') || level.includes('LEVEL 3')) {
      return {
        badge: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
        card: 'border-amber-500/30 bg-gradient-to-br from-amber-950/20 to-slate-900/60',
        text: 'text-amber-400',
        icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
        sla: 'High Priority (< 24 Hours)',
      };
    }
    if (level.includes('Level 2') || level.includes('LEVEL 2')) {
      return {
        badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
        card: 'border-sky-500/20 bg-slate-900/60',
        text: 'text-sky-400',
        icon: <Clock className="w-5 h-5 text-sky-400" />,
        sla: 'Standard Review (< 3 Business Days)',
      };
    }
    return {
      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      card: 'border-emerald-500/20 bg-slate-900/60',
      text: 'text-emerald-400',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      sla: 'Routine Review (< 5 Business Days)',
    };
  };

  const getHumanReviewStyle = (status: string) => {
    if (status.includes('Required')) {
      return {
        badge: 'bg-rose-950/60 text-rose-200 border-rose-500/50 ring-1 ring-rose-500/40',
        indicator: 'Mandatory Human Verification Required',
        sub: 'Must be formally reviewed and signed off by authorized clinical or compliance personnel prior to case closure.',
      };
    }
    if (status.includes('Recommended')) {
      return {
        badge: 'bg-amber-950/50 text-amber-200 border-amber-500/40',
        indicator: 'Human Review Recommended',
        sub: 'Supervisory review advised to confirm patient satisfaction and operational remediation.',
      };
    }
    return {
      badge: 'bg-slate-800 text-slate-300 border-slate-700',
      indicator: 'AI Review Only',
      sub: 'Routine feedback eligible for automated logging and aggregate trend reporting.',
    };
  };

  const sev = getSeverityStyle(triage.severityLevel);
  const rev = getHumanReviewStyle(triage.humanReviewStatus);

  return (
    <div className="space-y-6">
      {/* 6-Step Triage Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* STEP 1: Complaint Category */}
        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80 shadow-sm hover:border-slate-600 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-[10px] font-bold">1</span>
              Complaint Category
            </span>
          </div>
          <div className="space-y-2">
            <div className="text-base font-bold text-white flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-teal-500/15 border border-teal-500/30 text-teal-200 text-sm font-semibold">
                {triage.primaryCategory}
              </span>
              <span className="text-xs text-slate-400 font-normal">Primary</span>
            </div>

            {triage.secondaryCategories && triage.secondaryCategories.length > 0 && (
              <div className="pt-1 text-xs text-slate-300 flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400">Secondary:</span>
                {triage.secondaryCategories.map((sec, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-slate-700/80 border border-slate-600 text-slate-200 text-[11px]"
                  >
                    {sec}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* STEP 2: Severity Assessment */}
        <div className={`rounded-xl p-4 border shadow-sm transition-colors ${sev.card}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px] font-bold">2</span>
              Severity Assessment
            </span>
            <span className="text-[11px] text-slate-400">{sev.sla}</span>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5">{sev.icon}</div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-md border text-sm font-bold ${sev.badge}`}>
                  {triage.severityLevel}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed font-sans">
                {triage.severityJustification}
              </p>
            </div>
          </div>
        </div>

        {/* STEP 3: Risk Detection */}
        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center text-[10px] font-bold">3</span>
              Risk Detection
            </span>
            <span className="text-[11px] text-slate-400">
              {triage.riskFlags?.length || 0} Risk Flag(s) Identified
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
            {triage.riskFlags && triage.riskFlags.length > 0 ? (
              triage.riskFlags.map((riskItem, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-700/80 flex flex-col gap-1"
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                    {riskItem.risk}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    {riskItem.explanation}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700 text-xs text-slate-400">
                No active clinical, safety, or legal risks flagged.
              </div>
            )}
          </div>
        </div>

        {/* STEP 4: Escalation Recommendation */}
        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px] font-bold">4</span>
              Escalation Recommendation
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase border ${
                triage.escalationPriority === 'Immediate'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                  : triage.escalationPriority === 'Priority'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {triage.escalationPriority}
            </span>
          </div>

          <div className="space-y-2 mt-2">
            <div className="flex items-center gap-2 text-white">
              <Building2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <div>
                <span className="text-xs text-slate-400 block">ROUTE TO:</span>
                <span className="text-sm font-bold text-white">
                  {triage.recommendedDepartment}
                </span>
              </div>
            </div>
            <div className="text-[11px] text-slate-300 flex items-center gap-1.5 pt-1">
              <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
              Target SLA:{' '}
              <span className="font-semibold text-slate-200">
                {triage.escalationPriority === 'Immediate'
                  ? 'Dispatch within 2 hours'
                  : triage.escalationPriority === 'Priority'
                  ? 'Dispatch within 24 hours'
                  : 'Routine queue review (3-5 days)'}
              </span>
            </div>
          </div>
        </div>

        {/* STEP 5: Human Review Requirement */}
        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-[10px] font-bold">5</span>
              Human Review Requirement
            </span>
            <UserCheck className="w-4 h-4 text-purple-400" />
          </div>

          <div className="space-y-2 mt-1">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${rev.badge}`}>
                {triage.humanReviewStatus}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {rev.sub}
            </p>

            {triage.humanReviewTriggers && triage.humanReviewTriggers.length > 0 && (
              <div className="pt-1.5 border-t border-slate-700/60">
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block mb-1">
                  Enforcement Criteria:
                </span>
                <ul className="text-[11px] text-slate-300 space-y-0.5">
                  {triage.humanReviewTriggers.map((trig, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-purple-400"></span>
                      {trig}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* STEP 6: Executive Summary */}
        <div className="bg-slate-800/90 rounded-xl p-4 border border-slate-700 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center text-[10px] font-bold">6</span>
              Executive Summary
            </span>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              Source: {triage.triageSource === 'gemini' ? 'Gemini 3.8 Flash' : 'Clinical Heuristics'}
            </span>
          </div>

          <div className="bg-slate-900/80 rounded-lg p-3.5 border border-slate-700/70 space-y-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2 border-b border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-400">Complaint Category:</span>{' '}
                <span className="font-semibold text-white">{triage.executiveSummary.category}</span>
              </div>
              <div>
                <span className="text-slate-400">Severity Level:</span>{' '}
                <span className="font-semibold text-white">{triage.executiveSummary.severityLevel}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400">Major Risk:</span>{' '}
                <span className="font-semibold text-rose-300">{triage.executiveSummary.majorRisk}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400">Recommended Action:</span>{' '}
                <span className="font-semibold text-teal-300">{triage.executiveSummary.recommendedAction}</span>
              </div>
            </div>

            <p className="text-slate-200 text-xs leading-relaxed pt-1">
              {triage.executiveSummary.narrative}
            </p>
          </div>
        </div>
      </div>

      {/* Raw Prompt Output Format Box */}
      {showRawOutputToggle && (
        <div className="border border-slate-700/70 rounded-xl bg-slate-950/70 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-semibold text-slate-200 tracking-wide uppercase">
                Standardized Output Format
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowRawOutput(!showRawOutput)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 border border-slate-700 transition"
              >
                {showRawOutput ? 'Collapse Clean Text' : 'View Clean Text'}
              </button>
              <button
                type="button"
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 text-xs text-teal-300 hover:text-teal-200 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 px-2.5 py-1 rounded transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Output Format'}
              </button>
            </div>
          </div>

          {showRawOutput && (
            <pre className="mt-3 p-3 bg-slate-900 rounded-lg text-slate-200 text-xs font-mono whitespace-pre-wrap leading-relaxed border border-slate-800 overflow-x-auto">
              {triage.formattedOutput}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};
