import React, { useState } from 'react';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { ComplaintTable } from './components/ComplaintTable';
import { AnalyticsView } from './components/AnalyticsView';
import { TriageDetailDrawer } from './components/TriageDetailDrawer';
import { UploadModal } from './components/UploadModal';
import { SingleTriageModal } from './components/SingleTriageModal';
import { ExecutiveReportModal } from './components/ExecutiveReportModal';
import { ComplaintRecord } from './types/triage';
import { getInitialSampleComplaints } from './data/sampleComplaints';
import { triageComplaintDeterministic } from './utils/triageHeuristics';
import { exportComplaintsToCsv } from './utils/fileParser';

export default function App() {
  const [complaints, setComplaints] = useState<ComplaintRecord[]>(() => getInitialSampleComplaints());
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintRecord | null>(null);
  const [activeView, setActiveView] = useState<'queue' | 'analytics'>('queue');
  const [activeQuickFilter, setActiveQuickFilter] = useState('ALL');

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSingleTriageOpen, setIsSingleTriageOpen] = useState(false);
  const [isExecutiveReportOpen, setIsExecutiveReportOpen] = useState(false);

  // Loading states
  const [isBatchTriaging, setIsBatchTriaging] = useState(false);
  const [isReTriaging, setIsReTriaging] = useState(false);

  // Critical complaints count
  const criticalCount = complaints.filter(
    (c) =>
      c.triageResult?.severityLevel.includes('LEVEL 4') ||
      c.triageResult?.severityLevel.includes('Level 4')
  ).length;

  // Import handler from CSV/Excel
  const handleImport = async (newRecords: ComplaintRecord[], runAutoTriage: boolean) => {
    let processedRecords = [...newRecords];

    if (runAutoTriage) {
      processedRecords = newRecords.map((r) => {
        const triage = triageComplaintDeterministic(r.complaintText);
        return {
          ...r,
          status: 'Triaged' as const,
          triageResult: triage,
        };
      });
    }

    setComplaints((prev) => [...processedRecords, ...prev]);
  };

  // Re-load initial sample dataset
  const handleLoadSampleData = () => {
    const samples = getInitialSampleComplaints();
    setComplaints(samples);
  };

  // Save single complaint created from modal
  const handleSaveSingleComplaint = (newRecord: ComplaintRecord) => {
    setComplaints((prev) => [newRecord, ...prev]);
    setSelectedComplaint(newRecord);
  };

  // Update existing complaint (e.g. human verification sign-off or overrides)
  const handleUpdateComplaint = (updated: ComplaintRecord) => {
    setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelectedComplaint(updated);
  };

  // Delete complaint
  const handleDeleteComplaint = (id: string) => {
    setComplaints((prev) => prev.filter((c) => c.id !== id));
    if (selectedComplaint?.id === id) {
      setSelectedComplaint(null);
    }
  };

  // Re-triage single complaint via backend API
  const handleReTriage = async (record: ComplaintRecord) => {
    setIsReTriaging(true);
    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaintText: record.complaintText,
          caseNumber: record.caseNumber,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.triage) {
        const updated: ComplaintRecord = {
          ...record,
          status: 'Triaged',
          triageResult: data.triage,
        };
        handleUpdateComplaint(updated);
      } else {
        // Fallback deterministic
        const triage = triageComplaintDeterministic(record.complaintText);
        const updated: ComplaintRecord = {
          ...record,
          status: 'Triaged',
          triageResult: triage,
        };
        handleUpdateComplaint(updated);
      }
    } catch {
      const triage = triageComplaintDeterministic(record.complaintText);
      const updated: ComplaintRecord = {
        ...record,
        status: 'Triaged',
        triageResult: triage,
      };
      handleUpdateComplaint(updated);
    } finally {
      setIsReTriaging(false);
    }
  };

  // Batch triage selected IDs
  const handleBatchTriage = async (ids: string[]) => {
    setIsBatchTriaging(true);
    try {
      const updated = complaints.map((c) => {
        if (ids.includes(c.id)) {
          const triage = triageComplaintDeterministic(c.complaintText);
          return {
            ...c,
            status: 'Triaged' as const,
            triageResult: triage,
          };
        }
        return c;
      });
      setComplaints(updated);
    } finally {
      setIsBatchTriaging(false);
    }
  };

  // Export to CSV
  const handleExportCsv = (selectedOnly = false) => {
    exportComplaintsToCsv(complaints);
  };

  // Filter selection from StatsCards
  const handleSelectFilterFromStats = (filterKey: string, filterVal: string) => {
    setActiveView('queue');
    if (filterKey === 'severity' && filterVal.includes('LEVEL 4')) {
      setActiveQuickFilter('CRITICAL_L4');
    } else if (filterKey === 'humanReview') {
      setActiveQuickFilter('HUMAN_REVIEW');
    } else if (filterKey === 'priority') {
      setActiveQuickFilter('IMMEDIATE');
    } else if (filterKey === 'category') {
      setActiveQuickFilter('SAFETY');
    } else {
      setActiveQuickFilter('ALL');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <Header
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenSingleTriage={() => setIsSingleTriageOpen(true)}
        onLoadSampleData={handleLoadSampleData}
        onOpenExecutiveReport={() => setIsExecutiveReportOpen(true)}
        onExportCsv={() => handleExportCsv(false)}
        activeView={activeView}
        setActiveView={setActiveView}
        criticalCount={criticalCount}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* KPI Stats Cards */}
        <StatsCards
          complaints={complaints}
          onSelectFilter={handleSelectFilterFromStats}
        />

        {/* View Content: Queue vs Analytics */}
        {activeView === 'queue' ? (
          <ComplaintTable
            complaints={complaints}
            onSelectComplaint={(c) => setSelectedComplaint(c)}
            onBatchTriage={handleBatchTriage}
            onDeleteComplaint={handleDeleteComplaint}
            onExportCsv={handleExportCsv}
            isBatchTriaging={isBatchTriaging}
            activeQuickFilter={activeQuickFilter}
            setActiveQuickFilter={setActiveQuickFilter}
          />
        ) : (
          <AnalyticsView complaints={complaints} />
        )}
      </main>

      {/* Detail & Human Oversight Drawer */}
      <TriageDetailDrawer
        complaint={selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        onUpdateComplaint={handleUpdateComplaint}
        onReTriage={handleReTriage}
        isReTriaging={isReTriaging}
      />

      {/* Upload Spreadsheet Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onImport={handleImport}
      />

      {/* Live Single Triage Modal */}
      <SingleTriageModal
        isOpen={isSingleTriageOpen}
        onClose={() => setIsSingleTriageOpen(false)}
        onSaveComplaint={handleSaveSingleComplaint}
      />

      {/* Executive Report Modal */}
      <ExecutiveReportModal
        isOpen={isExecutiveReportOpen}
        onClose={() => setIsExecutiveReportOpen(false)}
        complaints={complaints}
      />
    </div>
  );
}
