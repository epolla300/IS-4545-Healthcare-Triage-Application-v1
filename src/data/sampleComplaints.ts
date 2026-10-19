import { ComplaintRecord } from '../types/triage';
import { triageComplaintDeterministic } from '../utils/triageHeuristics';

export const SAMPLE_COMPLAINTS_RAW = [
  {
    id: 'rec-001',
    caseNumber: 'CASE-2026-0841',
    dateReceived: '2026-10-18T14:22:00Z',
    sourceChannel: 'Formal Grievance Report' as const,
    patientId: 'PT-98041',
    patientName: 'Eleanor Vance',
    submittedDepartment: 'Post-Surgical Care Unit',
    complaintText:
      'I was discharged yesterday after abdominal surgery. This morning my surgical incision opened up, turned bright red, and started leaking yellowish fluid. When I called the nurse triage line in tears, the triage nurse said I was overreacting, told me to just put a band-aid on it, and refused to page on-call surgery. I am now in severe pain with a 102.8F fever and had to call 911 for emergency transport.',
  },
  {
    id: 'rec-002',
    caseNumber: 'CASE-2026-0842',
    dateReceived: '2026-10-18T16:05:00Z',
    sourceChannel: 'Patient Portal Message' as const,
    patientId: 'PT-41209',
    patientName: 'Marcus Chen',
    submittedDepartment: 'Health Information Management / Records',
    complaintText:
      'URGENT PRIVACY VIOLATION: Your records department mistakenly faxed my complete confidential psychiatric evaluation, addiction therapy notes, and SSRI prescription history directly to my employer HR department instead of my disability insurance carrier! My HR director called me in this afternoon asking about my psychiatric hospitalizations. This is a catastrophic HIPAA breach and I am consulting legal counsel.',
  },
  {
    id: 'rec-003',
    caseNumber: 'CASE-2026-0843',
    dateReceived: '2026-10-17T11:40:00Z',
    sourceChannel: 'In-Person Submission' as const,
    patientId: 'PT-88312',
    patientName: 'Guadalupe Ramirez',
    submittedDepartment: 'Emergency Department',
    complaintText:
      'My elderly mother speaks only Spanish and was brought to the Emergency Department with severe chest pressure. We repeatedly requested a certified medical interpreter. The intake physician snapped that they "did not have time for an interpreter" and coerced my 13-year-old nephew to interpret medical consent documents. The physician made derogatory remarks about non-English speakers taking up hospital resources.',
  },
  {
    id: 'rec-004',
    caseNumber: 'CASE-2026-0844',
    dateReceived: '2026-10-17T09:15:00Z',
    sourceChannel: 'Post-Discharge Survey' as const,
    patientId: 'PT-33091',
    patientName: 'Robert Kowalski',
    submittedDepartment: 'Endocrinology / Inpatient Ward 4B',
    complaintText:
      'MEDICATION ERROR ALERT: Upon hospital discharge, the discharge instructions wrote my Lantus insulin dosage as 40 units twice daily instead of my normal 4 units! If my daughter had not been a licensed pharmacist who caught the 10x overdose before filling the syringe, I would have gone into severe hypoglycemic shock or coma. This near-fatal order was signed off by the resident physician without double-checking.',
  },
  {
    id: 'rec-005',
    caseNumber: 'CASE-2026-0845',
    dateReceived: '2026-10-16T15:50:00Z',
    sourceChannel: 'Online Review / Feedback' as const,
    patientId: 'PT-55280',
    patientName: 'Hannah Davies',
    submittedDepartment: 'Outpatient Specialty Clinic',
    complaintText:
      'I am an ADA wheelchair user. When I arrived for my oncology consultation on Saturday morning, the accessible wheelchair entrance ramp was padlocked and blocked by construction pallets. When I pushed the emergency intercom button, nobody answered for 35 minutes in the pouring rain. I had to miss my critical chemotherapy planning appointment.',
  },
  {
    id: 'rec-006',
    caseNumber: 'CASE-2026-0846',
    dateReceived: '2026-10-16T10:10:00Z',
    sourceChannel: 'Telephone Transcript' as const,
    patientId: 'PT-72194',
    patientName: 'David Miller',
    submittedDepartment: 'Billing & Patient Financial Services',
    complaintText:
      'I have now received my THIRD collection agency threat for $3,450 for an out-of-network assistant surgeon. Prior to my knee surgery, I verified in writing that my entire surgical team was in-network under the No Surprises Act. Your billing department admits it was an erroneous charge but keeps failing to remove it from collections, and now my credit score has dropped 80 points.',
  },
  {
    id: 'rec-007',
    caseNumber: 'CASE-2026-0847',
    dateReceived: '2026-10-15T13:30:00Z',
    sourceChannel: 'Post-Discharge Survey' as const,
    patientId: 'PT-19402',
    patientName: 'Sophia Jenkins',
    submittedDepartment: 'Chemotherapy Infusion Center',
    complaintText:
      'My scheduled chemotherapy infusion appointment was set for 10:00 AM. I was seated in an unpadded waiting chair until 2:15 PM without any clinical staff communicating the reason for the delay. The receptionist repeatedly rolled her eyes whenever patients asked for an update. Patients receiving cancer treatment should not be left without water or explanations for over four hours.',
  },
  {
    id: 'rec-008',
    caseNumber: 'CASE-2026-0848',
    dateReceived: '2026-10-15T11:00:00Z',
    sourceChannel: 'Email / Letter' as const,
    patientId: 'PT-66418',
    patientName: 'Arthur Pendelton',
    submittedDepartment: 'Front Desk & Ambulatory Registration',
    complaintText:
      'The intake receptionist at the West Pavilion clinic was loudly discussing my Medicaid coverage status across the open waiting room, making disparaging comments about "people who don\'t pay real insurance." Several other patients turned around and stared. It was profoundly humiliating and completely unprofessional behavior by hospital staff.',
  },
  {
    id: 'rec-009',
    caseNumber: 'CASE-2026-0849',
    dateReceived: '2026-10-14T17:45:00Z',
    sourceChannel: 'Patient Portal Message' as const,
    patientId: 'PT-22871',
    patientName: 'Chloe Bennett',
    submittedDepartment: 'Health IT & Digital Services',
    complaintText:
      'I have been trying to log into the MyChart patient portal to view my MRI brain scan results, but the two-factor authentication SMS codes are taking over 25 minutes to arrive on my phone, at which point the session is already expired. I have tried resetting it three times without success.',
  },
  {
    id: 'rec-010',
    caseNumber: 'CASE-2026-0850',
    dateReceived: '2026-10-14T09:20:00Z',
    sourceChannel: 'Online Review / Feedback' as const,
    patientId: 'PT-31089',
    patientName: 'Warren Hastings',
    submittedDepartment: 'Facilities & Visitor Services',
    complaintText:
      'The automated parking ticket validator at the South Garage exit gate was out of service. As a result, visitors who had already validated inside had to pay the full $25 daily rate again to exit. The intercom operator told us to take it up with billing on Monday.',
  },
  {
    id: 'rec-011',
    caseNumber: 'CASE-2026-0851',
    dateReceived: '2026-10-13T14:10:00Z',
    sourceChannel: 'Formal Grievance Report' as const,
    patientId: 'PT-77123',
    patientName: 'Diane Rogers',
    submittedDepartment: 'Day Surgery Recovery Unit',
    complaintText:
      'Following my outpatient colonoscopy, I was left alone in the recovery cubicle while still heavily sedated. When I tried to sit up, I felt extremely dizzy and nauseated. I pressed the call bell four times, but no nurse answered for 20 minutes. I fell out of the gurney onto the floor, bruising my shoulder and hip. Another patient had to shout into the hallway to get help.',
  },
  {
    id: 'rec-012',
    caseNumber: 'CASE-2026-0852',
    dateReceived: '2026-10-12T16:00:00Z',
    sourceChannel: 'Post-Discharge Survey' as const,
    patientId: 'PT-49501',
    patientName: 'Gregory Scott',
    submittedDepartment: 'Cardiology Clinic',
    complaintText:
      'The clinic provides excellent clinical care from Dr. Peterson, but getting an appointment rescheduled is nearly impossible. I called four times to move my follow-up appointment by two days, was placed on hold for an average of 35 minutes each time, and was disconnected twice without a callback.',
  },
];

export function getInitialSampleComplaints(): ComplaintRecord[] {
  return SAMPLE_COMPLAINTS_RAW.map((item) => {
    const triage = triageComplaintDeterministic(item.complaintText);
    return {
      ...item,
      status: 'Triaged',
      triageResult: triage,
    };
  });
}
