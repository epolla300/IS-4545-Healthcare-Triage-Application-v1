import React from 'react';
import {
  ShieldAlert,
  Upload,
  PlusCircle,
  Database,
  FileText,
  Download,
  BarChart2,
  Table,
  HeartPulse,
  Sparkles,
  AlertOctagon,
} from 'lucide-react';

interface Props {
  onOpenUpload: () => void;
  onOpenSingleTriage: () => void;
  onLoadSampleData: () => void;
  onOpenExecutiveReport: () => void;
  onExportCsv: () => void;
  activeView: 'queue' | 'analytics';
  setActiveView: (view: 'queue' | 'analytics') => void;
  criticalCount: number;
}

export const Header: React.FC<Props> = ({
  onOpenUpload,
  onOpenSingleTriage,
  onLoadSampleData,
  onOpenExecutiveReport,
  onExportCsv,
  activeView,
  setActiveView,
  criticalCount,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/95 sticky top-0 z-30 backdrop-blur-md">
      {/* Top Banner if Criticals are pending */}
      {criticalCount > 0 && (
        <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 border-b border-rose-500/40 px-4 py-1.5 text-xs text-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <AlertOctagon className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>
              <strong>CLINICAL SAFETY ALERT:</strong> {criticalCount} LEVEL 4 – Critical complaint(s) require immediate human review &amp; routing within &lt; 2 hours.
            </span>
          </div>
          <span className="text-[11px] text-rose-300 font-semibold uppercase tracking-wider hidden sm:inline">
            Human Oversight Enforced
          </span>
        </div>
      )}

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-teal-500/20">
            <HeartPulse className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight leading-tight">
                Complaint Triage Agent
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-teal-400" />
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Healthcare Complaint Triage Assistant • Patient Safety &amp; Fair Routing
            </p>
          </div>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700/80 mr-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveView('queue')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                activeView === 'queue'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Triage Queue
            </button>
            <button
              type="button"
              onClick={() => setActiveView('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                activeView === 'analytics'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Analytics
            </button>
          </div>

          {/* Quick Single Triage */}
          <button
            type="button"
            onClick={onOpenSingleTriage}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white flex items-center gap-1.5 shadow-md shadow-teal-950/40 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">New Single</span> Triage
          </button>

          {/* Upload File */}
          <button
            type="button"
            onClick={onOpenUpload}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
            title="Upload CSV or Excel file"
          >
            <Upload className="w-4 h-4 text-teal-400" />
            <span>Upload File</span>
          </button>

          {/* Load Sample Dataset */}
          <button
            type="button"
            onClick={onLoadSampleData}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition hidden md:flex"
            title="Load 12 authentic healthcare complaints"
          >
            <Database className="w-4 h-4 text-amber-400" />
            <span>Load Demo Data</span>
          </button>

          {/* Executive Report */}
          <button
            type="button"
            onClick={onOpenExecutiveReport}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition hidden sm:flex"
            title="Open Executive Safety Briefing"
          >
            <FileText className="w-4 h-4 text-purple-400" />
            <span>Report</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={onExportCsv}
            className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
            title="Export all triaged complaints to CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
