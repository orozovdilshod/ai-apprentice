export interface PlatformMetric {
  id: string;
  label: string;
  value: string;
  change: string;
  positive: boolean;
  subtext: string;
}

export interface ObservationSession {
  id: string;
  title: string;
  expertName: string;
  expertRole: string;
  department: "Data & Analytics" | "Customer Operations" | "Finance & Billing" | "Product";
  duration: string;
  date: string;
  status: "Completed" | "In Progress" | "Analyzing" | "Draft";
  heuristicsCount: number;
  stepsExtracted: number;
  confidenceScore: number;
}

export interface LiveTranscriptItem {
  id: string;
  timestamp: string;
  speaker: "Expert" | "AI Apprentice" | "System";
  content: string;
  type: "speech" | "action" | "heuristic" | "decision";
  metadata?: {
    actionType?: string;
    targetApp?: string;
    confidence?: number;
  };
}

export interface HeuristicItem {
  id: string;
  title: string;
  category: "Shortcut" | "Edge Case" | "Unwritten Rule" | "Mental Model";
  description: string;
  detectedAt: string;
  confidence: number;
}

export interface WorkMapNode {
  id: string;
  title: string;
  type: "trigger" | "action" | "decision" | "fallback" | "resolution";
  department: string;
  description: string;
  appsUsed: string[];
  durationMinutes: number;
  confidence: number;
  commonPitfalls: string[];
  expertTips: string;
  status: "verified" | "review_needed" | "synthesizing";
  connections: string[];
}

export interface WorkMapProcess {
  id: string;
  title: string;
  description: string;
  department: string;
  complexity: "Beginner" | "Intermediate" | "Advanced";
  estimatedMinutes: number;
  totalSteps: number;
  lastUpdated: string;
  verifiedByExpert: boolean;
  nodes: WorkMapNode[];
}

export interface TrainingScenario {
  id: string;
  title: string;
  role: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  durationMinutes: number;
  description: string;
  aiPersona: {
    name: string;
    voice: string;
    temperament: string;
    background: string;
  };
  learningGoals: string[];
  dialogueHistory: {
    speaker: "trainee" | "ai_customer" | "coach";
    message: string;
    timestamp: string;
    critique?: string;
  }[];
  evaluationRubric: {
    category: string;
    score: number;
    feedback: string;
  }[];
}

// ---------------------------------------------------------------------------
// CONSISTENT DEMO DATASETS (Scenario: Sarah Chen - Revenue Anomaly Investigation)
// ---------------------------------------------------------------------------

export const MOCK_METRICS: PlatformMetric[] = [
  {
    id: "workflows-captured",
    label: "Workflows Captured",
    value: "18",
    change: "+3 this week",
    positive: true,
    subtext: "Across data analytics & revenue operations teams",
  },
  {
    id: "observation-hours",
    label: "Expert Hours Observed",
    value: "34.5h",
    change: "+8.5h",
    positive: true,
    subtext: "Passive audio & screen capture analyzed",
  },
  {
    id: "heuristics-extracted",
    label: "Tribal Heuristics Extracted",
    value: "86",
    change: "98% verified",
    positive: true,
    subtext: "Unwritten analyst heuristics converted to SOPs",
  },
  {
    id: "training-readiness",
    label: "Voice Training Readiness",
    value: "95%",
    change: "+4%",
    positive: true,
    subtext: "6 voice roleplay drills synthesized",
  },
];

export const MOCK_OBSERVATIONS: ObservationSession[] = [
  {
    id: "obs-sarah-revenue",
    title: "Revenue Anomaly Investigation",
    expertName: "Sarah Chen",
    expertRole: "Senior Data Analyst",
    department: "Data & Analytics",
    duration: "24m 15s",
    date: "2026-10-03T14:30:00Z",
    status: "Completed",
    heuristicsCount: 5,
    stepsExtracted: 6,
    confidenceScore: 98,
  },
  {
    id: "obs-102",
    title: "Monthly Churn Attribution & Cohort Discrepancy",
    expertName: "Sarah Chen",
    expertRole: "Senior Data Analyst",
    department: "Data & Analytics",
    duration: "32m 10s",
    date: "2026-10-02T11:15:00Z",
    status: "Completed",
    heuristicsCount: 4,
    stepsExtracted: 7,
    confidenceScore: 94,
  },
  {
    id: "obs-103",
    title: "Multi-Currency Fraud Dispute Arbitrage",
    expertName: "Elena Rostova",
    expertRole: "Senior Risk Analyst",
    department: "Finance & Billing",
    duration: "55m 45s",
    date: "2026-10-01T16:00:00Z",
    status: "Completed",
    heuristicsCount: 8,
    stepsExtracted: 12,
    confidenceScore: 92,
  },
  {
    id: "obs-104",
    title: "Enterprise Billing Tier Migration Reconciliation",
    expertName: "Marcus Vance",
    expertRole: "Operations Lead",
    department: "Customer Operations",
    duration: "18m 40s",
    date: "2026-10-01T09:45:00Z",
    status: "Completed",
    heuristicsCount: 3,
    stepsExtracted: 5,
    confidenceScore: 91,
  },
];

/**
 * Clean 5-step scenario workflow for Sarah Chen:
 * 1. Sarah opens revenue dashboard.
 * 2. She notices an 18% revenue drop.
 * 3. She does NOT immediately investigate the business cause.
 * 4. She opens raw transaction data to verify whether the dashboard number is real.
 * 5. She explains why she does this.
 */
export const MOCK_LIVE_TRANSCRIPT: LiveTranscriptItem[] = [
  {
    id: "evt-step-1-open-dash",
    timestamp: "00:00:15",
    speaker: "System",
    content: "Opened Executive Revenue Dashboard (Looker / Stripe Ingestion Pipeline)",
    type: "action",
    metadata: { targetApp: "Looker", actionType: "view_dashboard" },
  },
  {
    id: "evt-step-2-notice-drop",
    timestamp: "00:00:38",
    speaker: "Expert",
    content: "I'm looking at our headline numbers. There is an 18% revenue drop showing in EMEA week-over-week.",
    type: "speech",
  },
  {
    id: "evt-step-3-hold-business",
    timestamp: "00:01:05",
    speaker: "Expert",
    content: "I'm not going to start checking churn logs or asking marketing if a campaign failed yet.",
    type: "speech",
    metadata: { actionType: "suppress_premature_action" },
  },
  {
    id: "evt-step-4-open-raw",
    timestamp: "00:01:22",
    speaker: "System",
    content: "Switched active window to Snowflake SQL Editor: Querying raw_events.stripe_transactions directly",
    type: "action",
    metadata: { targetApp: "Snowflake", actionType: "source_data_query" },
  },
  {
    id: "evt-step-5-explain-why",
    timestamp: "00:01:45",
    speaker: "Expert",
    content: "I don't trust the dashboard number when the variance is this large, so I verify the raw transactions first.",
    type: "speech",
  },
];

export const MOCK_LIVE_HEURISTICS: HeuristicItem[] = [
  {
    id: "h-sarah-rule-1",
    title: "Large Revenue Variance Source Verification",
    category: "Mental Model",
    description: "When an 18% revenue drop appears, verify raw transaction data first before investigating business causes.",
    detectedAt: "00:01:45",
    confidence: 98,
  },
  {
    id: "h-sarah-rule-2",
    title: "Suppress Premature Business Speculation",
    category: "Unwritten Rule",
    description: "The expert does not immediately investigate business causes (like churn or marketing campaigns) before validating the number.",
    detectedAt: "00:01:05",
    confidence: 96,
  },
];

export const MOCK_WORK_MAPS: WorkMapProcess[] = [
  {
    id: "proc-revenue-audit",
    title: "Revenue Anomaly Investigation & Data Integrity SOP",
    description: "Standard operating procedure synthesized from Sarah Chen's expert revenue anomaly investigations.",
    department: "Data & Analytics",
    complexity: "Intermediate",
    estimatedMinutes: 20,
    totalSteps: 5,
    lastUpdated: "2026-10-03",
    verifiedByExpert: true,
    nodes: [
      {
        id: "node-rev-1",
        title: "1. Headline Revenue Metric Drop Flagged",
        type: "trigger",
        department: "Data & Analytics",
        description: "An unexpected variance (e.g. 18% drop) appears on the executive revenue dashboard.",
        appsUsed: ["Looker", "Slack #rev-ops"],
        durationMinutes: 2,
        confidence: 99,
        commonPitfalls: ["Alerting executive team before validating if the drop is real", "Assuming an immediate business or market cause"],
        expertTips: "Check the dashboard last-refreshed timestamp before investigating numbers.",
        status: "verified",
        connections: ["node-rev-2"],
      },
      {
        id: "node-rev-2",
        title: "2. Raw Transaction Data Verification",
        type: "action",
        department: "Data & Analytics",
        description: "Bypass aggregate dashboards. Run a direct query on raw transaction tables in Snowflake/BigQuery to inspect recent record timestamps.",
        appsUsed: ["Snowflake SQL", "Stripe Dashboard"],
        durationMinutes: 4,
        confidence: 98,
        commonPitfalls: ["Trusting aggregated data warehouse views during active sync windows", "Looking only at total sums rather than event counts"],
        expertTips: "Sarah Chen's rule: When variance is large (>15%), always inspect raw transactions first.",
        status: "verified",
        connections: ["node-rev-3"],
      },
      {
        id: "node-rev-3",
        title: "3. Decision: Ingestion Lag vs True Business Anomaly",
        type: "decision",
        department: "Data & Analytics",
        description: "If raw transactions show missing hours -> report ETL sync delay. If raw transactions are complete -> proceed to customer cohort/churn breakdown.",
        appsUsed: ["Fivetran", "Airflow / dbt"],
        durationMinutes: 5,
        confidence: 96,
        commonPitfalls: ["Initiating deep cohort analysis when the root cause was a delayed webhook"],
        expertTips: "Check Fivetran sync delay status before tearing apart customer segments.",
        status: "verified",
        connections: ["node-rev-4", "node-rev-5"],
      },
      {
        id: "node-rev-4",
        title: "4. Fallback: Direct Payment Gateway Reconciliation",
        type: "fallback",
        department: "Data & Analytics",
        description: "If warehouse sync is stalled, log into Stripe / Adyen directly to verify live settled amounts.",
        appsUsed: ["Stripe Dashboard", "Adyen Portal"],
        durationMinutes: 4,
        confidence: 92,
        commonPitfalls: ["Overlooking currency conversion timezone offsets"],
        expertTips: "Export settled volume for the last 24 hours in UTC.",
        status: "verified",
        connections: ["node-rev-5"],
      },
      {
        id: "node-rev-5",
        title: "5. Resolution: Stakeholder Summary & Root Cause Documentation",
        type: "resolution",
        department: "Data & Analytics",
        description: "Publish verified root cause (ETL delay vs legitimate churn) to finance leadership with supporting transaction evidence.",
        appsUsed: ["Slack", "Notion SOP Wiki"],
        durationMinutes: 5,
        confidence: 99,
        commonPitfalls: ["Sending technical jargon to finance stakeholders without clear revenue impact"],
        expertTips: "State clearly whether actual cash flow was affected.",
        status: "verified",
        connections: [],
      },
    ],
  },
  {
    id: "proc-2",
    title: "Enterprise VIP Escalation & Refund Authority Protocol",
    description: "Operational decision tree for handling $10k+ enterprise billing discrepancies with retention preservation.",
    department: "Customer Operations",
    complexity: "Intermediate",
    estimatedMinutes: 15,
    totalSteps: 4,
    lastUpdated: "2026-10-01",
    verifiedByExpert: true,
    nodes: [
      {
        id: "node-201",
        title: "1. VIP Account Identification & ARR Check",
        type: "trigger",
        department: "Customer Operations",
        description: "Check Salesforce ARR tier and account executive history before answering ticket.",
        appsUsed: ["Salesforce", "Zendesk"],
        durationMinutes: 2,
        confidence: 97,
        commonPitfalls: ["Quoting generic refund terms to tier-1 enterprise accounts"],
        expertTips: "Accounts over $50k ARR have custom SLA clauses that override default refund windows.",
        status: "verified",
        connections: ["node-202"],
      },
      {
        id: "node-202",
        title: "2. Usage Audit in Stripe & Snowflake",
        type: "action",
        department: "Customer Operations",
        description: "Cross-reference claimed downtime against billed usage metrics in Stripe Billing.",
        appsUsed: ["Stripe Dashboard", "Snowflake"],
        durationMinutes: 5,
        confidence: 93,
        commonPitfalls: ["Looking only at monthly aggregates instead of hourly spikes"],
        expertTips: "Export the raw CSV and filter by 5xx HTTP response codes.",
        status: "verified",
        connections: ["node-203"],
      },
      {
        id: "node-203",
        title: "3. Discretionary Credit vs. Executive Approval",
        type: "decision",
        department: "Customer Operations",
        description: "Under $2,500 apply direct goodwill credit; above $2,500 tag Finance Director via Slack.",
        appsUsed: ["Slack", "Stripe"],
        durationMinutes: 3,
        confidence: 99,
        commonPitfalls: ["Issuing cash refund instead of platform credit balance"],
        expertTips: "Always offer 120% in platform usage credit before offering monetary refund.",
        status: "verified",
        connections: ["node-204"],
      },
      {
        id: "node-204",
        title: "4. Follow-up Retention Call Booking",
        type: "resolution",
        department: "Customer Operations",
        description: "Send personalized post-incident calibration note with Customer Success Manager CC'd.",
        appsUsed: ["ChiliPiper", "Gmail"],
        durationMinutes: 5,
        confidence: 95,
        commonPitfalls: ["Not scheduling a follow-up check within 14 days"],
        expertTips: "Include an invitation to meet product engineering.",
        status: "verified",
        connections: [],
      },
    ],
  },
];

export const MOCK_TRAINING_SCENARIOS: TrainingScenario[] = [
  {
    id: "scen-1",
    title: "Explaining an 18% Revenue Drop to the VP of Finance",
    role: "Junior Data Analyst",
    difficulty: "Intermediate",
    durationMinutes: 10,
    description: "Simulate a high-pressure call with the VP of Finance demanding an immediate explanation for an 18% revenue drop showing on the dashboard.",
    aiPersona: {
      name: "Victoria Sterling",
      voice: "ElevenLabs - Rachel (Authoritative & Fast-Paced)",
      temperament: "Direct, analytical executive who expects rigorous verification before escalation",
      background: "VP of Finance at enterprise SaaS, reviewing weekly executive metrics.",
    },
    learningGoals: [
      "Refuse to speculate on market or churn causes before checking data integrity",
      "Explain the raw transaction verification protocol clearly",
      "Calmly communicate ingestion pipeline status vs actual lost revenue",
      "Apply Sarah Chen's unwritten rule: verify source data on large variances",
    ],
    dialogueHistory: [
      {
        speaker: "ai_customer",
        message: "The dashboard is showing an 18% revenue decline in EMEA this week. Are customers canceling, or did our pricing change backfire?",
        timestamp: "00:00:05",
      },
      {
        speaker: "trainee",
        message: "Victoria, before we speculate on customer churn or pricing changes, I'm verifying the raw transaction records in Snowflake. When we see a variance this large, we verify source data first to rule out an ingestion delay.",
        timestamp: "00:00:24",
        critique: "Superb adherence to Sarah Chen's core heuristic! Refused premature speculation.",
      },
      {
        speaker: "ai_customer",
        message: "Good instinct. Did you find anything in the raw tables, or is this an actual deficit in settled cash?",
        timestamp: "00:00:45",
      },
      {
        speaker: "trainee",
        message: "I verified the raw Stripe transaction logs. All 1,420 expected transactions are present and settled. The 18% drop was caused by a 3-hour lag in the Looker dbt rollup model. Real revenue is actually up 2%.",
        timestamp: "00:01:12",
        critique: "Flawless resolution. Validated source truth and prevented false alarm.",
      },
    ],
    evaluationRubric: [
      { category: "SOP Adherence", score: 98, feedback: "Applied Sarah Chen's source verification rule before investigating business causes." },
      { category: "Executive Communication", score: 94, feedback: "Maintained poise, avoided premature alarms, and delivered verified figures." },
      { category: "Analytical Rigor", score: 96, feedback: "Separated ETL pipeline artifacts from true business revenue performance." },
    ],
  },
  {
    id: "scen-2",
    title: "VIP Account Escalation & Discretionary Credit",
    role: "Support Operations Analyst",
    difficulty: "Beginner",
    durationMinutes: 8,
    description: "Practice handling an enterprise client requesting an immediate billing credit following a platform service disruption.",
    aiPersona: {
      name: "Arthur Pendelton",
      voice: "ElevenLabs - Antoni (Formal & Urgent)",
      temperament: "Enterprise procurement manager with strict budget limits",
      background: "Lead procurement officer at GlobalLogistics.",
    },
    learningGoals: [
      "Audit raw usage logs before committing credit amounts",
      "Apply discretionary limit rules ($2,500 threshold)",
      "Maintain customer retention alignment",
    ],
    dialogueHistory: [
      {
        speaker: "ai_customer",
        message: "We experienced downtime yesterday during our billing cycle run. I need a $3,000 credit processed on our account today.",
        timestamp: "00:00:04",
      },
      {
        speaker: "trainee",
        message: "Thank you for reaching out Arthur. Let me review your raw usage logs in Snowflake right now to reconcile the affected downtime window and calculate your credit eligibility.",
        timestamp: "00:00:20",
        critique: "Excellent adherence to audit protocol before committing funds.",
      },
    ],
    evaluationRubric: [
      { category: "Policy Compliance", score: 95, feedback: "Audited usage before offering refund." },
      { category: "Communication", score: 92, feedback: "Professional and measured." },
    ],
  },
];
