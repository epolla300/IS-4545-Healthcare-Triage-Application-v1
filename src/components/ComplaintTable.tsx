import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Eye,
  Play,
  Download,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  Clock,
  UserCheck,
  CheckCircle2,
  FileText,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';
import { ComplaintRecord, ComplaintCategory, SeverityLevel, RoutingDepartment } from '../types/triage';

interface Props {
  complaints: ComplaintRecord[];
  onSelectComplaint: (complaint: ComplaintRecord) => void;
  onBatchTriage: (ids: string[]) => void;
  onDeleteComplaint: (id: string) => void;
  onExportCsv: (selectedOnly?: boolean) => void;
  isBatchTriaging?: boolean;
  activeQuickFilter: string;
  setActiveQuickFilter: (filter: string) => void;
}

export const ComplaintTable: React.FC<Props> = ({
  complaints,
  onSelectComplaint,
  onBatchTriage,
  onDeleteComplaint,
  onExportCsv,
  isBatchTriaging = false,
  activeQuickFilter,
  setActiveQuickFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [sortField, setSortField] = useState<'date' | 'severity' | 'case'>('date');
  const [sortAsc, setSortAsc] = useState(false);

  // Filter & Search logic
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesText = c.complaintText.toLowerCase().includes(q);
        const matchesCase = c.caseNumber.toLowerCase().includes(q);
        const matchesPatient = (c.patientName || '').toLowerCase().includes(q);
        const matchesDept = (c.submittedDepartment || '').toLowerCase().includes(q);
        const matchesCat = (c.triageResult?.primaryCategory || '').toLowerCase().includes(q);
        if (!matchesText && !matchesCase && !matchesPatient && !matchesDept && !matchesCat) {
          return false;
        }
      }

      // Quick filter tabs
      if (activeQuickFilter === 'CRITICAL_L4') {
        if (!c.triageResult?.severityLevel.includes('LEVEL 4') && !c.triageResult?.severityLevel.includes('Level 4')) {
          return false;
        }
      } else if (activeQuickFilter === 'HUMAN_REVIEW') {
        if (c.triageResult?.humanReviewStatus !== 'Human Review Required') {
          return false;
        }
      } else if (activeQuickFilter === 'IMMEDIATE') {
        if (c.triageResult?.escalationPriority !== 'Immediate') {
          return false;
        }
      } else if (activeQuickFilter === 'SAFETY') {
        const isSafety = c.triageResult?.primaryCategory === 'Patient Safety' ||
          c.triageResult?.riskFlags.some((r) => r.risk === 'Patient Safety Risk' || r.risk === 'Clinical Risk');
        if (!isSafety) return false;
      } else if (activeQuickFilter === 'PRIVACY') {
        const isPrivacy = c.triageResult?.primaryCategory === 'Privacy or Security' ||
          c.triageResult?.riskFlags.some((r) => r.risk === 'Privacy Risk' || r.risk === 'Compliance Risk');
        if (!isPrivacy) return false;
      } else if (activeQuickFilter === 'UNPROCESSED') {
        if (c.status !== 'Unprocessed') return false;
      }

      // Dropdown filters
      if (categoryFilter && c.triageResult?.primaryCategory !== categoryFilter) {
        return false;
      }
      if (severityFilter && c.triageResult?.severityLevel !== severityFilter) {
        return false;
      }
      if (deptFilter && c.triageResult?.recommendedDepartment !== deptFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortField === 'date') {
        const da = new Date(a.dateReceived).getTime();
        const db = new Date(b.dateReceived).getTime();
        return sortAsc ? da - db : db - da;
      }
      if (sortField === 'severity') {
        const getWeight = (s?: string) => {
          if (!s) return 0;
          if (s.includes('4')) return 4;
          if (s.includes('3')) return 3;
          if (s.includes('2')) return 2;
          return 1;
        };
        const wa = getWeight(a.triageResult?.severityLevel);
        const wb = getWeight(b.triageResult?.severityLevel);
        return sortAsc ? wa - wb : wb - wa;
      }
      if (sortField === 'case') {
        return sortAsc ? a.caseNumber.localeCompare(b.caseNumber) : b.caseNumber.localeCompare(a.caseNumber);
      }
      return 0;
    });
  }, [complaints, searchQuery, activeQuickFilter, categoryFilter, severityFilter, deptFilter, sortField, sortAsc]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredComplaints.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const renderSeverityBadge = (level?: string) => {
    if (!level) return <span className="text-slate-500 text-xs">Pending</span>;

    if (level.includes('LEVEL 4') || level.includes('Level 4')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          L4 Critical
        </span>
      );
    }
    if (level.includes('LEVEL 3') || level.includes('Level 3')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          L3 High
        </span>
      );
    }
    if (level.includes('LEVEL 2') || level.includes('Level 2')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          L2 Moderate
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        L1 Low
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Quick Filter Pill Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'ALL', label: 'All Records' },
          { id: 'CRITICAL_L4', label: '🚨 Level 4 Critical' },
          { id: 'HUMAN_REVIEW', label: '🛡️ Human Review Required' },
          { id: 'IMMEDIATE', label: '⚡ Immediate Escalation' },
          { id: 'SAFETY', label: '💊 Patient Safety & Clinical' },
          { id: 'PRIVACY', label: '⚖️ Privacy & Compliance' },
          { id: 'UNPROCESSED', label: '⏳ Unprocessed' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveQuickFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition border ${
              activeQuickFilter === tab.id
                ? 'bg-teal-500/20 text-teal-200 border-teal-500/50 shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border-slate-700/80 hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Secondary Filters Bar */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[260px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search complaint text, patient name, case number, or category..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="Patient Safety">Patient Safety</option>
            <option value="Clinical Care">Clinical Care</option>
            <option value="Privacy or Security">Privacy or Security</option>
            <option value="Accessibility and Equity">Accessibility and Equity</option>
            <option value="Billing">Billing</option>
            <option value="Communication">Communication</option>
            <option value="Wait Time">Wait Time</option>
            <option value="Scheduling">Scheduling</option>
            <option value="Technology / Patient Portal">Technology / Patient Portal</option>
            <option value="Staff Conduct">Staff Conduct</option>
            <option value="Discharge and Follow-Up">Discharge and Follow-Up</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Severities</option>
            <option value="LEVEL 4 – Critical">LEVEL 4 – Critical</option>
            <option value="LEVEL 3 – High">LEVEL 3 – High</option>
            <option value="LEVEL 2 – Moderate">LEVEL 2 – Moderate</option>
            <option value="LEVEL 1 – Low">LEVEL 1 – Low</option>
          </select>

          {/* Sort By */}
          <button
            type="button"
            onClick={() => {
              if (sortField === 'severity') {
                setSortAsc(!sortAsc);
              } else {
                setSortField('severity');
                setSortAsc(false);
              }
            }}
            className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1 transition ${
              sortField === 'severity'
                ? 'bg-slate-700 text-white border-slate-600'
                : 'bg-slate-900 text-slate-400 border-slate-700'
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            Sort: Severity
          </button>
        </div>
      </div>

      {/* Bulk Actions Banner */}
      {selectedIds.length > 0 && (
        <div className="bg-teal-950/40 border border-teal-500/40 rounded-xl px-4 py-2.5 flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs text-teal-200">
            <span className="font-bold">{selectedIds.length}</span> record(s) selected
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isBatchTriaging}
              onClick={() => onBatchTriage(selectedIds)}
              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              {isBatchTriaging ? 'Triaging...' : 'Run Triage on Selected'}
            </button>
            <button
              type="button"
              onClick={() => onExportCsv(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Export Selected
            </button>
            <button
              type="button"
              onClick={() => {
                selectedIds.forEach((id) => onDeleteComplaint(id));
                setSelectedIds([]);
              }}
              className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 transition"
              title="Delete selected"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-700/80 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      filteredComplaints.length > 0 &&
                      selectedIds.length === filteredComplaints.length
                    }
                    className="w-4 h-4 rounded text-teal-500 bg-slate-800 border-slate-700"
                  />
                </th>
                <th className="py-3 px-3">Case / Intake</th>
                <th className="py-3 px-4 min-w-[280px]">Patient Complaint Narrative</th>
                <th className="py-3 px-3">Step 1: Category</th>
                <th className="py-3 px-3">Step 2: Severity</th>
                <th className="py-3 px-3">Step 4: Route & SLA</th>
                <th className="py-3 px-3">Step 5: Human Review</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredComplaints.length > 0 ? (
                filteredComplaints.map((item) => {
                  const t = item.triageResult;
                  const isSelected = selectedIds.includes(item.id);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-800/90 transition-colors ${
                        isSelected ? 'bg-teal-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.id)}
                          className="w-4 h-4 rounded text-teal-500 bg-slate-800 border-slate-700"
                        />
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-semibold text-white">{item.caseNumber}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(item.dateReceived).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[110px]">
                          {item.sourceChannel}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <p className="text-slate-200 line-clamp-2 leading-relaxed">
                          "{item.complaintText}"
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                          <span>Patient: {item.patientName || 'Anonymous'}</span>
                          {item.submittedDepartment && (
                            <>
                              <span>•</span>
                              <span>{item.submittedDepartment}</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {t ? (
                          <div>
                            <span className="px-2 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/30 text-teal-300 font-semibold text-[11px] block w-fit">
                              {t.primaryCategory}
                            </span>
                            {t.secondaryCategories?.length > 0 && (
                              <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[130px]">
                                + {t.secondaryCategories[0]}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Uncategorized</span>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {renderSeverityBadge(t?.severityLevel)}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {t ? (
                          <div>
                            <span className="font-semibold text-slate-200 block truncate max-w-[140px]">
                              {t.recommendedDepartment}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider ${
                                t.escalationPriority === 'Immediate'
                                  ? 'text-rose-400'
                                  : t.escalationPriority === 'Priority'
                                  ? 'text-amber-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              {t.escalationPriority} SLA
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">—</span>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {t ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                              t.humanReviewStatus === 'Human Review Required'
                                ? 'bg-rose-950/40 text-rose-300 border-rose-500/40'
                                : t.humanReviewStatus === 'Human Review Recommended'
                                ? 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {t.humanReviewStatus}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">—</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onSelectComplaint(item)}
                          className="px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold inline-flex items-center gap-1 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Triage
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No complaints matched your search and filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
