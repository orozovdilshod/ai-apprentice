import fs from "fs";
import path from "path";

export interface KnowledgeItem {
  id: string;
  category: "new_rule" | "exception" | "guardrail" | "additional_reasoning" | "decision_point" | "no_new_knowledge";
  categoryLabel: string;
  title: string;
  ruleOrReasoningText: string;
  evidence: string;
  confidence: number;
  timestamp: string;
  isNew: boolean;
  decisionPoint: string;
  rule: string;
  exception: string;
  guardrail: string;
}

export interface DecisionTreeNode {
  id: string;
  title: string;
  type: "root" | "decision" | "action" | "guardrail" | "fallback" | "resolution";
  condition?: string;
  description: string;
  rule?: string;
  exception?: string;
  guardrail?: string;
  evidence?: string;
  confidence?: number;
  timestamp?: string;
  isNew?: boolean;
  children?: string[]; // IDs of children nodes
}

export interface WorkMapSessionData {
  sessionId: string;
  scenario: string;
  expert: string;
  lastUpdated: string;
  knowledgeItems: KnowledgeItem[];
  decisionTree: DecisionTreeNode[];
}

const SESSION_FILE_PATH = path.join(process.cwd(), ".next", "workmap-session.json");

const BASELINE_KNOWLEDGE_ITEMS: KnowledgeItem[] = [
  {
    id: "k-baseline-raw-verify",
    category: "decision_point",
    categoryLabel: "Baseline Rule",
    title: "Raw Ledger Verification on Large Drop",
    ruleOrReasoningText: "When large variance is observed on the dashboard, bypass aggregate numbers and verify raw transactions first.",
    evidence: "Observed action: Opened raw transaction data after seeing an 18% revenue drop.",
    confidence: 98,
    timestamp: "05:14",
    isNew: false,
    decisionPoint: "18% Revenue Drop Detected on Dashboard",
    rule: "Verify raw transaction records first before investigating business causes.",
    exception: "Not stated by expert",
    guardrail: "The expert does not immediately investigate business causes before validating the number.",
  },
];

const BASELINE_DECISION_TREE: DecisionTreeNode[] = [
  {
    id: "dt-root",
    title: "18% Revenue Drop Flagged on Executive Dashboard",
    type: "root",
    description: "Executive revenue dashboard shows an unexpected 18% drop. Normal reflex is to call churn or incident meetings.",
    children: ["dt-decision-threshold"],
  },
  {
    id: "dt-decision-threshold",
    title: "Decision Point: Variance Magnitude Evaluation",
    type: "decision",
    condition: "Check Variance %",
    description: "Determine whether variance is a routine daily fluctuation or exceeds the expert's investigation threshold.",
    rule: "Bypass aggregate dashboards if variance is significant.",
    exception: "Not stated by expert",
    guardrail: "Do not speculate on business causes before validating raw numbers.",
    evidence: "I do not trust the dashboard number when the variance is this large.",
    confidence: 95,
    timestamp: "05:14",
    isNew: false,
    children: ["dt-minor-fluctuation", "dt-large-variance-ledger"],
  },
  {
    id: "dt-minor-fluctuation",
    title: "Variance ≤ 10%: Standard Daily Reconciliation",
    type: "action",
    condition: "Variance ≤ 10%",
    description: "Standard daily variance reconciliation within expected margin. Await scheduled batch sync without urgent escalation.",
    rule: "Continue regular monitoring cycle.",
    exception: "Not stated by expert",
    guardrail: "Standard operational procedure.",
    evidence: "Baseline operating procedure.",
    confidence: 92,
    timestamp: "05:14",
    isNew: false,
    children: [],
  },
  {
    id: "dt-large-variance-ledger",
    title: "Variance > 10%: Direct Raw Transaction Verification",
    type: "guardrail",
    condition: "Variance > 10%",
    description: "Bypass aggregate Looker dashboards. Query PostgreSQL/Snowflake raw transaction event table to confirm settled transactions.",
    rule: "If variance exceeds 10%, inspect raw transaction events before raising any alert.",
    exception: "Not stated by expert",
    guardrail: "Do not raise an alert on a variance above 10% until raw transaction events have been inspected.",
    evidence: "Whenever variance exceeds 10%, we always inspect raw transaction events before raising any alert.",
    confidence: 99,
    timestamp: "05:18",
    isNew: false, // Initially false; toggled to true when expert answers
    children: ["dt-missing-events-lag", "dt-events-confirmed-business"],
  },
  {
    id: "dt-missing-events-lag",
    title: "Raw Records Missing: Report Ingestion Sync Delay",
    type: "fallback",
    condition: "Raw records show gap",
    description: "Transaction records are missing in warehouse -> Root cause is ingestion sync lag (Fivetran/webhook). Suppress churn alerts.",
    rule: "Flag data pipeline lag to Data Engineering.",
    exception: "Not stated by expert",
    guardrail: "Do not alarm executive team over an ETL pipeline delay.",
    evidence: "Baseline data analyst heuristic.",
    confidence: 96,
    timestamp: "05:18",
    isNew: false,
    children: [],
  },
  {
    id: "dt-events-confirmed-business",
    title: "Raw Records Complete: Investigate True Churn / Business Cause",
    type: "resolution",
    condition: "Raw records verified",
    description: "Raw transactions confirm real 18% decline. Now proceed with confidence to cohort churn breakdown.",
    rule: "Escalate to business leadership with validated transaction numbers.",
    exception: "Not stated by expert",
    guardrail: "Only investigate churn after raw verification succeeds.",
    evidence: "Verified raw numbers eliminate false alarms.",
    confidence: 98,
    timestamp: "05:18",
    isNew: false,
    children: [],
  },
];

declare global {
  // eslint-disable-next-line no-var
  var __aiApprenticeSessionData: WorkMapSessionData | undefined;
}

function getInitialSessionData(): WorkMapSessionData {
  return {
    sessionId: "sarah-chen-revenue-anomaly",
    scenario: "Revenue Anomaly Investigation",
    expert: "Sarah Chen (Senior Data Analyst)",
    lastUpdated: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    knowledgeItems: [...BASELINE_KNOWLEDGE_ITEMS],
    decisionTree: [...BASELINE_DECISION_TREE],
  };
}

export function getSessionData(): WorkMapSessionData {
  if (!globalThis.__aiApprenticeSessionData) {
    try {
      if (fs.existsSync(SESSION_FILE_PATH)) {
        const fileContent = fs.readFileSync(SESSION_FILE_PATH, "utf-8");
        globalThis.__aiApprenticeSessionData = JSON.parse(fileContent);
      } else {
        globalThis.__aiApprenticeSessionData = getInitialSessionData();
      }
    } catch {
      globalThis.__aiApprenticeSessionData = getInitialSessionData();
    }
  }

  return globalThis.__aiApprenticeSessionData!;
}

export function saveSessionData(data: WorkMapSessionData): void {
  globalThis.__aiApprenticeSessionData = data;
  try {
    const dir = path.dirname(SESSION_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SESSION_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not persist session file (in-memory will be used):", err);
  }
}

export function addOrUpdateKnowledgeItem(newItem: Partial<KnowledgeItem> & { id: string }): WorkMapSessionData {
  const current = getSessionData();
  const existingIdx = current.knowledgeItems.findIndex((k) => k.id === newItem.id);

  const mergedItem: KnowledgeItem = {
    id: newItem.id,
    category: newItem.category || "new_rule",
    categoryLabel: newItem.categoryLabel || "New Rule",
    title: newItem.title || "Extracted Tacit Rule",
    ruleOrReasoningText: newItem.ruleOrReasoningText || newItem.rule || "",
    evidence: newItem.evidence || "",
    confidence: typeof newItem.confidence === "number" ? newItem.confidence : 95,
    timestamp: newItem.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    isNew: true,
    decisionPoint: newItem.decisionPoint || "Variance Magnitude Check",
    rule: newItem.rule || newItem.ruleOrReasoningText || "",
    exception: newItem.exception || "Not stated by expert",
    guardrail: newItem.guardrail || "Not stated by expert",
  };

  const updatedKnowledgeItems = [...current.knowledgeItems];
  if (existingIdx >= 0) {
    updatedKnowledgeItems[existingIdx] = mergedItem;
  } else {
    updatedKnowledgeItems.unshift(mergedItem);
  }

  // Update the decision tree node corresponding to the 10% rule
  const updatedDecisionTree = current.decisionTree.map((node) => {
    if (node.id === "dt-large-variance-ledger") {
      return {
        ...node,
        rule: mergedItem.rule,
        guardrail: mergedItem.guardrail,
        exception: mergedItem.exception,
        evidence: mergedItem.evidence,
        confidence: mergedItem.confidence,
        timestamp: mergedItem.timestamp,
        isNew: true,
      };
    }
    return node;
  });

  const updatedSession: WorkMapSessionData = {
    ...current,
    lastUpdated: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    knowledgeItems: updatedKnowledgeItems,
    decisionTree: updatedDecisionTree,
  };

  saveSessionData(updatedSession);
  return updatedSession;
}

export function resetSession(): WorkMapSessionData {
  const initial = getInitialSessionData();
  saveSessionData(initial);
  return initial;
}
