import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ComplaintRecord } from '../types/triage';

export interface ParsedSheetData {
  fileName: string;
  fileSize: number;
  headers: string[];
  rows: Record<string, any>[];
  detectedMapping: {
    complaintTextCol?: string;
    caseNumberCol?: string;
    patientIdCol?: string;
    patientNameCol?: string;
    dateCol?: string;
    sourceCol?: string;
    departmentCol?: string;
  };
}

export async function parseComplaintFile(file: File): Promise<ParsedSheetData> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  if (extension === 'xlsx' || extension === 'xls') {
    return parseExcelFile(file);
  } else {
    return parseCsvFile(file);
  }
}

function parseCsvFile(file: File): Promise<ParsedSheetData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows = (results.data as Record<string, any>[]).filter((row) =>
          Object.values(row).some((val) => val && String(val).trim() !== '')
        );
        const detectedMapping = autoDetectColumns(headers);
        resolve({
          fileName: file.name,
          fileSize: file.size,
          headers,
          rows,
          detectedMapping,
        });
      },
      error: (error) => reject(error),
    });
  });
}

async function parseExcelFile(file: File): Promise<ParsedSheetData> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
    header: 1,
    defval: '',
  });

  if (!jsonData || jsonData.length === 0) {
    throw new Error('Excel sheet appears to be empty.');
  }

  const rawHeaders = (jsonData[0] as any[]).map((h) => String(h || '').trim());
  const headers = rawHeaders.filter((h) => h !== '');

  const rows: Record<string, any>[] = [];
  for (let i = 1; i < jsonData.length; i++) {
    const rawRow = jsonData[i] as any[];
    if (!rawRow || rawRow.length === 0) continue;

    const rowObj: Record<string, any> = {};
    let hasData = false;

    headers.forEach((hdr, idx) => {
      const val = rawRow[idx] !== undefined ? String(rawRow[idx]).trim() : '';
      if (val) hasData = true;
      rowObj[hdr] = val;
    });

    if (hasData) {
      rows.push(rowObj);
    }
  }

  const detectedMapping = autoDetectColumns(headers);

  return {
    fileName: file.name,
    fileSize: file.size,
    headers,
    rows,
    detectedMapping,
  };
}

export function autoDetectColumns(headers: string[]) {
  const mapping: {
    complaintTextCol?: string;
    caseNumberCol?: string;
    patientIdCol?: string;
    patientNameCol?: string;
    dateCol?: string;
    sourceCol?: string;
    departmentCol?: string;
  } = {};

  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const h of headers) {
    const c = clean(h);

    if (!mapping.complaintTextCol && /complaint|feedback|narrative|text|comment|issue|description|message|grievance|details/i.test(c)) {
      mapping.complaintTextCol = h;
    } else if (!mapping.caseNumberCol && /casenum|caseid|ticket|recordid|complaintid|incident/i.test(c)) {
      mapping.caseNumberCol = h;
    } else if (!mapping.patientIdCol && /patientid|mrn|patientnumber|accountnum|ptid/i.test(c)) {
      mapping.patientIdCol = h;
    } else if (!mapping.patientNameCol && /patientname|complainant|submitter|patient/i.test(c)) {
      mapping.patientNameCol = h;
    } else if (!mapping.dateCol && /date|time|received|submitted|created|timestamp/i.test(c)) {
      mapping.dateCol = h;
    } else if (!mapping.sourceCol && /source|channel|origin|method|type/i.test(c)) {
      mapping.sourceCol = h;
    } else if (!mapping.departmentCol && /department|dept|unit|clinic|service|location|facility/i.test(c)) {
      mapping.departmentCol = h;
    }
  }

  // Fallback if no complaint column found: pick the header with longest average sample content or first string column
  if (!mapping.complaintTextCol && headers.length > 0) {
    mapping.complaintTextCol = headers[0];
  }

  return mapping;
}

export function exportComplaintsToCsv(complaints: ComplaintRecord[], filename = 'triaged_healthcare_complaints.csv') {
  const exportRows = complaints.map((c) => {
    const t = c.triageResult;
    return {
      'Case Number': c.caseNumber,
      'Date Received': c.dateReceived,
      'Source Channel': c.sourceChannel,
      'Patient ID': c.patientId || 'N/A',
      'Patient Name': c.patientName || 'Anonymous',
      'Department / Unit': c.submittedDepartment || 'Unspecified',
      'Original Complaint': c.complaintText,
      'Triage Status': c.status,
      'Step 1 Primary Category': t?.primaryCategory || '',
      'Step 1 Secondary Categories': t?.secondaryCategories.join(', ') || '',
      'Step 2 Severity Level': t?.severityLevel || '',
      'Step 2 Severity Justification': t?.severityJustification || '',
      'Step 3 Risk Flags': t?.riskFlags.map((r) => `${r.risk} (${r.explanation})`).join('; ') || '',
      'Step 4 Recommended Department': t?.recommendedDepartment || '',
      'Step 4 Escalation Priority': t?.escalationPriority || '',
      'Step 5 Human Review Status': t?.humanReviewStatus || '',
      'Step 6 Major Risk': t?.executiveSummary.majorRisk || '',
      'Step 6 Recommended Action': t?.executiveSummary.recommendedAction || '',
      'Step 6 Executive Summary': t?.executiveSummary.narrative || '',
      'Triage Engine': t?.triageSource || '',
      'Triaged At': t?.triagedAt || '',
      'Human Review Notes': c.humanReview?.notes || '',
      'Human Review Verified By': c.humanReview?.reviewedBy || '',
    };
  });

  const csv = Papa.unparse(exportRows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
