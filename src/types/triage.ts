export type ComplaintCategory =
  | 'Communication'
  | 'Scheduling'
  | 'Wait Time'
  | 'Technology / Patient Portal'
  | 'Billing'
  | 'Clinical Care'
  | 'Discharge and Follow-Up'
  | 'Accessibility and Equity'
  | 'Patient Safety'
  | 'Privacy or Security'
  | 'Staff Conduct'
  | 'Other';

export type SeverityLevel =
  | 'LEVEL 1 – Low'
  | 'LEVEL 2 – Moderate'
  | 'LEVEL 3 – High'
  | 'LEVEL 4 – Critical';

export type RiskFlag =
  | 'Patient Safety Risk'
  | 'Clinical Risk'
  | 'Compliance Risk'
  | 'Privacy Risk'
  | 'Accessibility Risk'
  | 'Equity Risk'
  | 'Reputational Risk'
  | 'Operational Risk';

export type RoutingDepartment =
  | 'Patient Experience Team'
  | 'Nursing Leadership'
  | 'Physician Leadership'
  | 'Quality Improvement Team'
  | 'Compliance Office'
  | 'Information Technology'
  | 'Revenue Cycle / Billing'
  | 'Accessibility Coordinator'
  | 'Risk Management'
  | 'Executive Review';

export type EscalationPriority = 'Routine' | 'Priority' | 'Immediate';

export type HumanReviewStatus =
  | 'AI Review Only'
  | 'Human Review Recommended'
  | 'Human Review Required';

export interface RiskItem {
  risk: RiskFlag;
  explanation: string;
}

export interface TriageResult {
  // Step 1: Complaint Category
  primaryCategory: ComplaintCategory;
  secondaryCategories: ComplaintCategory[];

  // Step 2: Severity Assessment
  severityLevel: SeverityLevel;
  severityJustification: string;

  // Step 3: Risk Detection
  riskFlags: RiskItem[];

  // Step 4: Escalation Recommendation
  recommendedDepartment: RoutingDepartment;
  escalationPriority: EscalationPriority;

  // Step 5: Human Review Requirement
  humanReviewStatus: HumanReviewStatus;
  humanReviewTriggers?: string[];

  // Step 6: Executive Summary
  executiveSummary: {
    category: ComplaintCategory;
    severityLevel: SeverityLevel;
    majorRisk: string;
    recommendedAction: string;
    narrative: string;
  };

  // Raw Prompt Output Format
  formattedOutput: string;
  triageSource: 'gemini' | 'heuristic';
  triagedAt: string;
}

export interface HumanReviewOverride {
  reviewedBy: string;
  reviewedAt: string;
  status: 'Pending Review' | 'Verified & Approved' | 'Modified / Overridden';
  notes?: string;
  overrideCategory?: ComplaintCategory;
  overrideSeverity?: SeverityLevel;
  overrideDepartment?: RoutingDepartment;
  overridePriority?: EscalationPriority;
}

export interface ComplaintRecord {
  id: string;
  caseNumber: string;
  dateReceived: string;
  sourceChannel:
    | 'Patient Portal Message'
    | 'Formal Grievance Report'
    | 'Post-Discharge Survey'
    | 'Online Review / Feedback'
    | 'Telephone Transcript'
    | 'In-Person Submission'
    | 'Email / Letter';
  patientId?: string;
  patientName?: string;
  submittedDepartment?: string;
  complaintText: string;
  status: 'Unprocessed' | 'Triaging' | 'Triaged' | 'Under Investigation' | 'Resolved';
  triageResult?: TriageResult;
  humanReview?: HumanReviewOverride;
}

export interface TriageFilterOptions {
  searchQuery: string;
  severityFilter: string;
  categoryFilter: string;
  departmentFilter: string;
  priorityFilter: string;
  humanReviewFilter: string;
  sourceFilter: string;
  statusFilter: string;
}
