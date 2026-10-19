import {
  ComplaintCategory,
  EscalationPriority,
  HumanReviewStatus,
  RiskFlag,
  RiskItem,
  RoutingDepartment,
  SeverityLevel,
  TriageResult,
} from '../types/triage';

export function formatTriageOutput(result: Omit<TriageResult, 'formattedOutput' | 'triageSource' | 'triagedAt'>): string {
  const secondary = result.secondaryCategories.length > 0 
    ? result.secondaryCategories.join(', ') 
    : 'None';
  
  const riskFlagsString = result.riskFlags.length > 0
    ? result.riskFlags.map((r) => `${r.risk} (${r.explanation})`).join('; ')
    : 'No significant risks flagged';

  return `Complaint Category: ${result.primaryCategory}
Secondary Categories: ${secondary}
Severity Level: ${result.severityLevel}
Severity Justification: ${result.severityJustification}
Risk Flags: ${riskFlagsString}
Recommended Department: ${result.recommendedDepartment}
Escalation Priority: ${result.escalationPriority}
Human Review Status: ${result.humanReviewStatus}
Executive Summary:
- Category: ${result.executiveSummary.category}
- Severity: ${result.executiveSummary.severityLevel}
- Major Risk: ${result.executiveSummary.majorRisk}
- Recommended Action: ${result.executiveSummary.recommendedAction}
- Summary: ${result.executiveSummary.narrative}`;
}

export function triageComplaintDeterministic(text: string): TriageResult {
  const lower = text.toLowerCase();

  // Pattern detection
  const isMedication = /medication|dosage|insulin|mg|pill|prescription|overdose|adverse reaction|drug allergy|pharmacy/i.test(lower);
  const isPatientSafety = /harm|fall|fell|injury|infection|sepsis|bleeding|unresponsive|choking|cardiac|wrong site|near miss|surgical error|respiratory/i.test(lower) || isMedication;
  const isImmediateDanger = /life threat|cardiac arrest|severe bleed|unconscious|anaphylaxis|active chest pain|suicid|emergency|collapsed/i.test(lower);
  const isDiscrimination = /discriminat|race|racial|ethnic|spanish|language|interpreter|transgender|gender|disability|deaf|asl|refused to translate|prejudice|bias/i.test(lower);
  const isPrivacy = /hipaa|privacy|confidential|disclosed|medical record|faxed to employer|breach|social security|ssn|unauthorized access|shared my data/i.test(lower);
  const isLegal = /lawyer|attorney|lawsuit|sue|legal action|malpractice|subpoena|regulatory report|state board/i.test(lower);
  const isAccessibility = /wheelchair|ramp|elevator broken|ada|blind|braille|accessible restroom|hearing impaired|sign language/i.test(lower);
  const isBilling = /bill|charge|insurance|overcharged|co-pay|deductible|in-network|out-of-network|unauthorized charge|billing error|balance bill|collections/i.test(lower);
  const isTechPortal = /portal|login|password|two-factor|2fa|app crashed|website down|telehealth link|video call failed|cannot reset/i.test(lower);
  const isWaitTime = /wait time|waited|hours in waiting|delay|appointment pushed back|infusion wait|er wait/i.test(lower);
  const isScheduling = /schedule|reschedule|cancel appointment|double booked|no available appointment|waitlist/i.test(lower);
  const isDischarge = /discharge|aftercare|follow-up|instructions unclear|post-op instructions|readmission|sent home too early/i.test(lower);
  const isStaffConduct = /rude|unprofessional|yelled|attitude|condescending|disrespectful|mocked|ignored me|refused to help|insulted/i.test(lower);
  const isClinicalCare = /physician|doctor|nurse|diagnosis|misdiagnosis|treatment plan|symptoms dismissed|care plan|procedure/i.test(lower);
  const isCommunication = /no one explained|lack of communication|did not answer questions|confusing|nobody called back|unclear/i.test(lower);

  // 1. Categories
  let primaryCategory: ComplaintCategory = 'Other';
  const secondaryCategories: ComplaintCategory[] = [];

  if (isImmediateDanger || (isPatientSafety && /harm|infection|wrong|error|sepsis/i.test(lower))) {
    primaryCategory = 'Patient Safety';
  } else if (isPrivacy) {
    primaryCategory = 'Privacy or Security';
  } else if (isDiscrimination || (isAccessibility && /refused|ada|rights/i.test(lower))) {
    primaryCategory = 'Accessibility and Equity';
  } else if (isClinicalCare) {
    primaryCategory = 'Clinical Care';
  } else if (isBilling) {
    primaryCategory = 'Billing';
  } else if (isDischarge) {
    primaryCategory = 'Discharge and Follow-Up';
  } else if (isTechPortal) {
    primaryCategory = 'Technology / Patient Portal';
  } else if (isWaitTime) {
    primaryCategory = 'Wait Time';
  } else if (isScheduling) {
    primaryCategory = 'Scheduling';
  } else if (isStaffConduct) {
    primaryCategory = 'Staff Conduct';
  } else if (isCommunication) {
    primaryCategory = 'Communication';
  } else {
    primaryCategory = 'Communication';
  }

  // Find secondary categories
  const testMap: [ComplaintCategory, boolean][] = [
    ['Patient Safety', isPatientSafety && primaryCategory !== 'Patient Safety'],
    ['Clinical Care', isClinicalCare && primaryCategory !== 'Clinical Care'],
    ['Privacy or Security', isPrivacy && primaryCategory !== 'Privacy or Security'],
    ['Accessibility and Equity', (isAccessibility || isDiscrimination) && primaryCategory !== 'Accessibility and Equity'],
    ['Billing', isBilling && primaryCategory !== 'Billing'],
    ['Staff Conduct', isStaffConduct && primaryCategory !== 'Staff Conduct'],
    ['Communication', isCommunication && primaryCategory !== 'Communication'],
    ['Wait Time', isWaitTime && primaryCategory !== 'Wait Time'],
    ['Scheduling', isScheduling && primaryCategory !== 'Scheduling'],
    ['Discharge and Follow-Up', isDischarge && primaryCategory !== 'Discharge and Follow-Up'],
    ['Technology / Patient Portal', isTechPortal && primaryCategory !== 'Technology / Patient Portal'],
  ];

  for (const [cat, matches] of testMap) {
    if (matches && !secondaryCategories.includes(cat)) {
      secondaryCategories.push(cat);
    }
  }

  // 2. Severity Assessment
  let severityLevel: SeverityLevel = 'LEVEL 1 – Low';
  let severityJustification = '';

  if (isImmediateDanger || /severe harm|cardiac|sepsis|wrong site surgery/i.test(lower) || (isPrivacy && /employer|public|breach/i.test(lower)) || (isDiscrimination && /refused treatment|civil rights/i.test(lower)) || isLegal) {
    severityLevel = 'LEVEL 4 – Critical';
    severityJustification = 'Immediate patient safety risk, potential regulatory/legal exposure, serious privacy violation, or systemic discrimination allegation detected.';
  } else if (isPatientSafety || isMedication || isAccessibility || isDiscrimination || /fall|bleeding|infection|escalat|unresolved|repeated failure|wrong diagnosis/i.test(lower)) {
    severityLevel = 'LEVEL 3 – High';
    severityJustification = 'Involves potential patient harm, medication-related safety concern, significant clinical failure, serious accessibility barrier, or highly escalated grievance.';
  } else if (isStaffConduct || isWaitTime || isBilling || /repeated|multiple times|frustrated|ignored|unacceptable/i.test(lower)) {
    severityLevel = 'LEVEL 2 – Moderate';
    severityJustification = 'Reflects repeated operational friction, substantial communication breakdown, financial discrepancy, or notable patient dissatisfaction requiring supervisory review.';
  } else {
    severityLevel = 'LEVEL 1 – Low';
    severityJustification = 'Represents a minor operational inconvenience, routine dissatisfaction, or general service feedback without clinical compromise.';
  }

  // 3. Risk Flags
  const riskFlags: RiskItem[] = [];

  if (isPatientSafety || isImmediateDanger) {
    riskFlags.push({
      risk: 'Patient Safety Risk',
      explanation: 'Concerns direct physical wellbeing, adverse medication events, or procedural safety.',
    });
  }
  if (isClinicalCare || isPatientSafety || /infection|symptoms|discharge/i.test(lower)) {
    riskFlags.push({
      risk: 'Clinical Risk',
      explanation: 'Involves diagnosis, medication management, clinical protocols, or continuity of clinical care.',
    });
  }
  if (isPrivacy) {
    riskFlags.push({
      risk: 'Privacy Risk',
      explanation: 'Potential unauthorized disclosure or mishandling of Protected Health Information (PHI) under HIPAA.',
    });
  }
  if (isLegal || isPrivacy || isDiscrimination || /regulatory|osha|cms|joint commission/i.test(lower)) {
    riskFlags.push({
      risk: 'Compliance Risk',
      explanation: 'Engages statutory healthcare compliance, EMTALA/HIPAA, or regulatory reporting standards.',
    });
  }
  if (isAccessibility) {
    riskFlags.push({
      risk: 'Accessibility Risk',
      explanation: 'Physical or technological barrier impinging ADA compliance or disability access.',
    });
  }
  if (isDiscrimination) {
    riskFlags.push({
      risk: 'Equity Risk',
      explanation: 'Allegation of disparate treatment, language interpreter denial, or bias in care delivery.',
    });
  }
  if (severityLevel === 'LEVEL 4 – Critical' || isStaffConduct || isLegal || /social media|press|news/i.test(lower)) {
    riskFlags.push({
      risk: 'Reputational Risk',
      explanation: 'Potential for public grievance escalation, patient defection, or organizational brand detriment.',
    });
  }
  if (isWaitTime || isScheduling || isTechPortal || isBilling) {
    riskFlags.push({
      risk: 'Operational Risk',
      explanation: 'Workflow bottleneck, billing system inaccuracy, or patient communication deficiency.',
    });
  }

  // Ensure at least one risk flag exists
  if (riskFlags.length === 0) {
    riskFlags.push({
      risk: 'Operational Risk',
      explanation: 'General service flow and patient communication review indicated.',
    });
  }

  // 4. Escalation Recommendation
  let recommendedDepartment: RoutingDepartment = 'Patient Experience Team';
  let escalationPriority: EscalationPriority = 'Routine';

  if (severityLevel === 'LEVEL 4 – Critical') {
    escalationPriority = 'Immediate';
    if (isPrivacy || isLegal) {
      recommendedDepartment = isPrivacy ? 'Compliance Office' : 'Risk Management';
    } else if (isPatientSafety) {
      recommendedDepartment = 'Risk Management';
    } else if (isDiscrimination) {
      recommendedDepartment = 'Compliance Office';
    } else {
      recommendedDepartment = 'Executive Review';
    }
  } else if (severityLevel === 'LEVEL 3 – High') {
    escalationPriority = 'Priority';
    if (isPatientSafety || isMedication) {
      recommendedDepartment = 'Quality Improvement Team';
    } else if (isClinicalCare) {
      recommendedDepartment = 'Physician Leadership';
    } else if (isAccessibility || isDiscrimination) {
      recommendedDepartment = 'Accessibility Coordinator';
    } else if (isStaffConduct) {
      recommendedDepartment = 'Nursing Leadership';
    } else {
      recommendedDepartment = 'Patient Experience Team';
    }
  } else if (severityLevel === 'LEVEL 2 – Moderate') {
    escalationPriority = /repeated|unresolved|charge/i.test(lower) ? 'Priority' : 'Routine';
    if (isBilling) {
      recommendedDepartment = 'Revenue Cycle / Billing';
    } else if (isTechPortal) {
      recommendedDepartment = 'Information Technology';
    } else if (isStaffConduct) {
      recommendedDepartment = 'Nursing Leadership';
    } else {
      recommendedDepartment = 'Patient Experience Team';
    }
  } else {
    escalationPriority = 'Routine';
    if (isBilling) {
      recommendedDepartment = 'Revenue Cycle / Billing';
    } else if (isTechPortal) {
      recommendedDepartment = 'Information Technology';
    } else {
      recommendedDepartment = 'Patient Experience Team';
    }
  }

  // 5. Human Review Requirement
  // Rule: Human Review Required should be selected whenever:
  // - Patient safety concerns exist
  // - Discrimination is alleged
  // - Privacy concerns exist
  // - Legal or compliance risks are present
  // - The complaint is ambiguous and requires investigation
  let humanReviewStatus: HumanReviewStatus = 'AI Review Only';
  const humanReviewTriggers: string[] = [];

  if (isPatientSafety || riskFlags.some((r) => r.risk === 'Patient Safety Risk')) {
    humanReviewTriggers.push('Patient safety concerns identified');
  }
  if (isDiscrimination || riskFlags.some((r) => r.risk === 'Equity Risk')) {
    humanReviewTriggers.push('Discrimination or equity concern alleged');
  }
  if (isPrivacy || riskFlags.some((r) => r.risk === 'Privacy Risk')) {
    humanReviewTriggers.push('HIPAA/privacy violation concerns exist');
  }
  if (isLegal || riskFlags.some((r) => r.risk === 'Compliance Risk')) {
    humanReviewTriggers.push('Legal exposure or regulatory compliance risks present');
  }
  if (severityLevel === 'LEVEL 4 – Critical' || severityLevel === 'LEVEL 3 – High') {
    humanReviewTriggers.push('High/Critical clinical severity requires certified human triage review');
  }

  if (humanReviewTriggers.length > 0) {
    humanReviewStatus = 'Human Review Required';
  } else if (severityLevel === 'LEVEL 2 – Moderate' || isStaffConduct || isBilling) {
    humanReviewStatus = 'Human Review Recommended';
    humanReviewTriggers.push('Service recovery or billing investigation recommended');
  } else {
    humanReviewStatus = 'AI Review Only';
  }

  // 6. Executive Summary
  const majorRisk = riskFlags[0] ? `${riskFlags[0].risk}: ${riskFlags[0].explanation}` : 'Operational Risk: Service quality monitoring';
  const recommendedAction = `Escalate on ${escalationPriority.toUpperCase()} basis to ${recommendedDepartment} (${humanReviewStatus}).`;
  
  const narrative = `Complaint classified under primary domain "${primaryCategory}" assessed at ${severityLevel}. Primary risk identified as ${riskFlags[0]?.risk || 'Operational Risk'}. Case routed to ${recommendedDepartment} with ${escalationPriority.toLowerCase()} priority dispatch. Human oversight status enforced as: ${humanReviewStatus}.`;

  const interimResult = {
    primaryCategory,
    secondaryCategories,
    severityLevel,
    severityJustification,
    riskFlags,
    recommendedDepartment,
    escalationPriority,
    humanReviewStatus,
    humanReviewTriggers,
    executiveSummary: {
      category: primaryCategory,
      severityLevel,
      majorRisk,
      recommendedAction,
      narrative,
    },
  };

  const formattedOutput = formatTriageOutput(interimResult);

  return {
    ...interimResult,
    formattedOutput,
    triageSource: 'heuristic',
    triagedAt: new Date().toISOString(),
  };
}
