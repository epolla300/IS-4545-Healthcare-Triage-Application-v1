import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { triageComplaintDeterministic, formatTriageOutput } from './src/utils/triageHeuristics.js';
import type { TriageResult, ComplaintCategory, SeverityLevel, RoutingDepartment, EscalationPriority, HumanReviewStatus } from './src/types/triage.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '20mb' }));

// Initialize GoogleGenAI SDK
const apiKey = process.env.GEMINI_API_KEY || '';
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const TRIAGE_SYSTEM_INSTRUCTION = `You are a Healthcare Complaint Triage Assistant.
Your purpose is to help healthcare organizations review, prioritize, and route patient complaints efficiently while maintaining patient safety, fairness, compliance, and appropriate human oversight.
Your role is NOT to resolve complaints.
Your role is to triage complaints and determine:
- What happened
- How serious it is
- Who should review it
- How quickly it should be addressed
- Whether human intervention is required

Follow these mandatory 6 steps:
STEP 1: Complaint Category
Classify into ONE primary category from:
- Communication
- Scheduling
- Wait Time
- Technology / Patient Portal
- Billing
- Clinical Care
- Discharge and Follow-Up
- Accessibility and Equity
- Patient Safety
- Privacy or Security
- Staff Conduct
- Other
Identify any secondary categories if applicable.

STEP 2: Severity Assessment
Assign a severity level:
- LEVEL 1 – Low (Minor inconvenience, routine dissatisfaction, general suggestion)
- LEVEL 2 – Moderate (Repeated service failures, significant frustration, communication breakdown)
- LEVEL 3 – High (Potential patient harm, medication-related concern, serious accessibility issue, escalated complaint)
- LEVEL 4 – Critical (Immediate patient safety risk, potential legal exposure, serious privacy violation, discrimination allegation)
Provide reasoning for the assigned severity.

STEP 3: Risk Detection
Identify applicable risks from:
- Patient Safety Risk
- Clinical Risk
- Compliance Risk
- Privacy Risk
- Accessibility Risk
- Equity Risk
- Reputational Risk
- Operational Risk
For each flagged risk, explain WHY it was flagged.

STEP 4: Escalation Recommendation
ROUTE TO one of:
- Patient Experience Team
- Nursing Leadership
- Physician Leadership
- Quality Improvement Team
- Compliance Office
- Information Technology
- Revenue Cycle / Billing
- Accessibility Coordinator
- Risk Management
- Executive Review
Indicate whether escalation priority is:
- Routine
- Priority
- Immediate

STEP 5: Human Review Requirement
Determine whether:
- AI Review Only
- Human Review Recommended
- Human Review Required
"Human Review Required" MUST be selected whenever:
- Patient safety concerns exist
- Discrimination is alleged
- Privacy concerns exist
- Legal or compliance risks are present
- The complaint is ambiguous and requires investigation

STEP 6: Executive Summary
Create a concise executive summary including:
- Complaint category
- Severity level
- Major risk
- Recommended action
- Concise narrative synthesis`;

// POST /api/triage
app.post('/api/triage', async (req, res) => {
  try {
    const { complaintText, caseNumber } = req.body;
    if (!complaintText || typeof complaintText !== 'string') {
      return res.status(400).json({ error: 'complaintText is required' });
    }

    // If Gemini client is available, attempt AI triage with strict schema
    if (aiClient && apiKey) {
      try {
        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Please perform clinical triage on the following healthcare complaint:\n\n"${complaintText}"`,
          config: {
            systemInstruction: TRIAGE_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                primaryCategory: {
                  type: Type.STRING,
                  description: 'Primary complaint category',
                },
                secondaryCategories: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Secondary categories',
                },
                severityLevel: {
                  type: Type.STRING,
                  description: 'Assigned severity level (e.g. LEVEL 1 – Low, LEVEL 2 – Moderate, LEVEL 3 – High, LEVEL 4 – Critical)',
                },
                severityJustification: {
                  type: Type.STRING,
                  description: 'Clinical reasoning for severity assignment',
                },
                riskFlags: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      risk: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                    },
                    required: ['risk', 'explanation'],
                  },
                  description: 'List of detected risks with clinical rationale',
                },
                recommendedDepartment: {
                  type: Type.STRING,
                  description: 'Recommended department for routing',
                },
                escalationPriority: {
                  type: Type.STRING,
                  description: 'Escalation priority: Routine, Priority, or Immediate',
                },
                humanReviewStatus: {
                  type: Type.STRING,
                  description: 'AI Review Only, Human Review Recommended, or Human Review Required',
                },
                humanReviewTriggers: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Specific reasons triggering human review',
                },
                executiveSummary: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    severityLevel: { type: Type.STRING },
                    majorRisk: { type: Type.STRING },
                    recommendedAction: { type: Type.STRING },
                    narrative: { type: Type.STRING },
                  },
                  required: ['category', 'severityLevel', 'majorRisk', 'recommendedAction', 'narrative'],
                },
              },
              required: [
                'primaryCategory',
                'secondaryCategories',
                'severityLevel',
                'severityJustification',
                'riskFlags',
                'recommendedDepartment',
                'escalationPriority',
                'humanReviewStatus',
                'executiveSummary',
              ],
            },
          },
        });

        const rawText = response.text?.trim() || '{}';
        const parsed = JSON.parse(rawText);

        const structuredResult: TriageResult = {
          primaryCategory: parsed.primaryCategory as ComplaintCategory,
          secondaryCategories: (parsed.secondaryCategories || []) as ComplaintCategory[],
          severityLevel: parsed.severityLevel as SeverityLevel,
          severityJustification: parsed.severityJustification,
          riskFlags: parsed.riskFlags || [],
          recommendedDepartment: parsed.recommendedDepartment as RoutingDepartment,
          escalationPriority: parsed.escalationPriority as EscalationPriority,
          humanReviewStatus: parsed.humanReviewStatus as HumanReviewStatus,
          humanReviewTriggers: parsed.humanReviewTriggers || [],
          executiveSummary: {
            category: parsed.executiveSummary?.category || parsed.primaryCategory,
            severityLevel: parsed.executiveSummary?.severityLevel || parsed.severityLevel,
            majorRisk: parsed.executiveSummary?.majorRisk || '',
            recommendedAction: parsed.executiveSummary?.recommendedAction || '',
            narrative: parsed.executiveSummary?.narrative || '',
          },
          formattedOutput: '',
          triageSource: 'gemini',
          triagedAt: new Date().toISOString(),
        };

        structuredResult.formattedOutput = formatTriageOutput(structuredResult);
        return res.json({ success: true, triage: structuredResult });
      } catch (geminiError: any) {
        console.warn('Gemini triage call failed or returned invalid format; fallback to deterministic clinical rules:', geminiError?.message);
      }
    }

    // Deterministic fallback
    const heuristicResult = triageComplaintDeterministic(complaintText);
    return res.json({ success: true, triage: heuristicResult });
  } catch (error: any) {
    console.error('Triage endpoint error:', error);
    res.status(500).json({ error: error?.message || 'Internal triage error' });
  }
});

// POST /api/triage/batch
app.post('/api/triage/batch', async (req, res) => {
  try {
    const { complaints } = req.body;
    if (!Array.isArray(complaints)) {
      return res.status(400).json({ error: 'complaints must be an array' });
    }

    const results = [];
    for (const item of complaints) {
      if (!item.complaintText) continue;
      const triage = triageComplaintDeterministic(item.complaintText);
      results.push({
        id: item.id,
        triageResult: triage,
      });
    }

    return res.json({ success: true, results });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Batch triage error' });
  }
});

// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    model: 'gemini-3.8-flash',
    timestamp: new Date().toISOString(),
  });
});

// Serve frontend in production or mount Vite middleware in dev
const PORT = 3000;

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Complaint Triage Agent server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
