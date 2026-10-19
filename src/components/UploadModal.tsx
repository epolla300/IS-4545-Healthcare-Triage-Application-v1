import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Database,
} from 'lucide-react';
import { parseComplaintFile, ParsedSheetData } from '../utils/fileParser';
import { ComplaintRecord } from '../types/triage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newRecords: ComplaintRecord[], runAutoTriage: boolean) => void;
}

export const UploadModal: React.FC<Props> = ({ isOpen, onClose, onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedSheetData | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Column mappings
  const [textCol, setTextCol] = useState('');
  const [caseCol, setCaseCol] = useState('');
  const [patientIdCol, setPatientIdCol] = useState('');
  const [patientNameCol, setPatientNameCol] = useState('');
  const [dateCol, setDateCol] = useState('');
  const [sourceCol, setSourceCol] = useState('');
  const [deptCol, setDeptCol] = useState('');

  const [autoTriage, setAutoTriage] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMsg(null);
    setIsParsing(true);

    try {
      const data = await parseComplaintFile(selectedFile);
      setParsedData(data);

      // Set detected column mappings
      setTextCol(data.detectedMapping.complaintTextCol || data.headers[0] || '');
      setCaseCol(data.detectedMapping.caseNumberCol || '');
      setPatientIdCol(data.detectedMapping.patientIdCol || '');
      setPatientNameCol(data.detectedMapping.patientNameCol || '');
      setDateCol(data.detectedMapping.dateCol || '');
      setSourceCol(data.detectedMapping.sourceCol || '');
      setDeptCol(data.detectedMapping.departmentCol || '');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to parse file. Please ensure it is a valid CSV or Excel file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleImportSubmit = () => {
    if (!parsedData || !textCol) {
      setErrorMsg('Please select which column contains the complaint text.');
      return;
    }

    const records: ComplaintRecord[] = parsedData.rows.map((row, index) => {
      const rawText = String(row[textCol] || '').trim();
      const rawCase = caseCol ? String(row[caseCol] || '') : '';
      const rawDate = dateCol ? String(row[dateCol] || '') : '';
      const rawSource = sourceCol ? String(row[sourceCol] || '') : '';
      const rawPatientId = patientIdCol ? String(row[patientIdCol] || '') : '';
      const rawPatientName = patientNameCol ? String(row[patientNameCol] || '') : '';
      const rawDept = deptCol ? String(row[deptCol] || '') : '';

      return {
        id: `imp-${Date.now()}-${index}`,
        caseNumber: rawCase || `CASE-IMP-${1000 + index}`,
        dateReceived: rawDate || new Date().toISOString(),
        sourceChannel: (rawSource as any) || 'Formal Grievance Report',
        patientId: rawPatientId || undefined,
        patientName: rawPatientName || undefined,
        submittedDepartment: rawDept || undefined,
        complaintText: rawText,
        status: 'Unprocessed' as const,
      };
    }).filter((r) => r.complaintText.length > 5);

    if (records.length === 0) {
      setErrorMsg('No valid rows containing complaint text found in this file.');
      return;
    }

    onImport(records, autoTriage);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Import Complaint Data Source</h2>
              <p className="text-xs text-slate-400">
                Upload CSV or Excel spreadsheets (.xlsx, .xls, .csv) for clinical triage
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-teal-500/60 rounded-xl p-8 text-center cursor-pointer transition bg-slate-800/30 hover:bg-slate-800/60 group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              accept=".csv,.xlsx,.xls,.tsv,.txt"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-teal-500/20 text-teal-400 flex items-center justify-center mx-auto mb-3 transition">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white">
              {file ? file.name : 'Choose a file or drag and drop here'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports CSV, Excel (.xlsx, .xls), and TSV formatted complaint exports
            </p>
          </div>

          {isParsing && (
            <div className="p-4 bg-slate-800/50 rounded-xl text-center text-xs text-slate-300 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
              Parsing spreadsheet rows and detecting schema...
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Column Mapping Section */}
          {parsedData && !isParsing && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" /> Column Schema Mapping
                </span>
                <span className="text-xs text-slate-400">
                  {parsedData.rows.length} records detected
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
                <div>
                  <label className="text-[11px] font-semibold text-slate-200 block mb-1">
                    Complaint Text <span className="text-rose-400">*Required</span>
                  </label>
                  <select
                    value={textCol}
                    onChange={(e) => setTextCol(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="">-- Select Column --</option>
                    {parsedData.headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-200 block mb-1">
                    Case / Grievance ID
                  </label>
                  <select
                    value={caseCol}
                    onChange={(e) => setCaseCol(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="">-- None / Auto Generate --</option>
                    {parsedData.headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-200 block mb-1">
                    Patient Name / Complainant
                  </label>
                  <select
                    value={patientNameCol}
                    onChange={(e) => setPatientNameCol(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="">-- None / Anonymous --</option>
                    {parsedData.headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-200 block mb-1">
                    Patient ID / MRN
                  </label>
                  <select
                    value={patientIdCol}
                    onChange={(e) => setPatientIdCol(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="">-- None / Unspecified --</option>
                    {parsedData.headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-200 block mb-1">
                    Date Received
                  </label>
                  <select
                    value={dateCol}
                    onChange={(e) => setDateCol(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="">-- Current Timestamp --</option>
                    {parsedData.headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-200 block mb-1">
                    Source Channel
                  </label>
                  <select
                    value={sourceCol}
                    onChange={(e) => setSourceCol(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="">-- Default (Formal Grievance Report) --</option>
                    {parsedData.headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Data Preview */}
              {parsedData.rows.length > 0 && textCol && (
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-2">
                    Sample Data Preview (First 2 Rows):
                  </span>
                  <div className="space-y-2">
                    {parsedData.rows.slice(0, 2).map((row, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 line-clamp-2"
                      >
                        <span className="font-semibold text-teal-400 mr-2">Row {i + 1}:</span>
                        "{String(row[textCol] || '')}"
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Auto Triage Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer pt-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={autoTriage}
                  onChange={(e) => setAutoTriage(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-500 bg-slate-800 border-slate-700 focus:ring-teal-500"
                />
                <span>Automatically run 6-step clinical triage on imported complaints immediately</span>
              </label>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!parsedData || !textCol || isParsing}
            onClick={handleImportSubmit}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white flex items-center gap-2 shadow-lg shadow-teal-900/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Import {parsedData ? `${parsedData.rows.length} Complaints` : 'Data'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
