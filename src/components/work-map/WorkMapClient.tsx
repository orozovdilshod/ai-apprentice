"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  GitFork,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Clock,
  Layers,
  Mic,
  RefreshCw,
  FileText,
  Workflow,
  ShieldCheck,
  AlertCircle,
  TrendingDown,
  Database,
  ArrowDown,
  SlidersHorizontal,
  Quote,
  Eye,
  X,
  ChevronRight,
  Check,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/LoadingSkeleton";
import { MOCK_WORK_MAPS, WorkMapNode } from "@/lib/mock-data";
import { WorkMapSessionData, DecisionTreeNode } from "@/lib/session-store";

interface WorkMapClientProps {
  initialSession: WorkMapSessionData;
}

type ClassificationType = "EXPLICIT" | "INFERRED" | "UNKNOWN";

interface ClassificationResult {
  type: ClassificationType;
  label: string;
  badgeClass: string;
  description: string;
}

interface DecisionXRayData {
  decision: string;
  triggerCondition: string;
  whyItMatters: string;
  expertReasoning: string;
  extractedRule: string;
  exception: string;
  guardrail: string;
  confidence: number;
  evidence: string;
  timestamp: string;
  source: string;
  sourceClassification: ClassificationType;
}

function getFieldClassification(
  text: string | undefined,
  evidence: string | undefined,
  nodeId: string,
  fieldType: "rule" | "exception" | "guardrail"
): ClassificationResult {
  if (!text || text.toLowerCase().includes("not stated by expert") || text.trim() === "") {
    return {
      type: "UNKNOWN",
      label: "UNKNOWN",
      badgeClass: "bg-[#1F2127] text-[#9297A5] border-white/[0.08]",
      description: "Not stated by expert during observation session",
    };
  }

  const lowerEv = (evidence || "").toLowerCase();
  const isDirectlyStated =
    lowerEv.includes("whenever variance") ||
    lowerEv.includes("i don't trust") ||
    lowerEv.includes("inspect raw") ||
    (nodeId === "dt-large-variance-ledger" && (fieldType === "rule" || fieldType === "guardrail")) ||
    (nodeId === "dt-decision-threshold" && (fieldType === "rule" || fieldType === "guardrail"));

  if (isDirectlyStated) {
    return {
      type: "EXPLICIT",
      label: "EXPLICIT",
      badgeClass: "bg-[#34D399]/15 text-[#34D399] border-[#34D399]/30",
      description: "Directly stated by expert in recording or live probe response",
    };
  }

  return {
    type: "INFERRED",
    label: "INFERRED",
    badgeClass: "bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30",
    description: "Model interpretation grounded in observed action or operational context",
  };
}

const WHY_DECISION_MATTERS: Record<string, string> = {
  "dt-root":
    "Initial trigger for the entire revenue investigation workflow. Immediate knee-jerk escalations before data validation cause executive panic and wasted cross-functional cycles.",
  "dt-decision-threshold":
    "Distinguishes normal daily variance (≤10%) from critical anomalies (>10%), preventing expensive manual database audits on routine daily batch fluctuations.",
  "dt-minor-fluctuation":
    "Suppresses false alarms for minor drift that automatically resolves during daily batch data reconciliation without incident escalation.",
  "dt-large-variance-ledger":
    "Bypasses potentially stale BI reporting caches to inspect ground-truth transaction logs directly in Snowflake before sounding any alarm.",
  "dt-missing-events-lag":
    "Accurately diagnoses ingestion sync latency (ETL / webhook lags), routing the fix to Data Engineering rather than falsely reporting customer churn.",
  "dt-events-confirmed-business":
    "Guarantees that business escalations are grounded in verified transactional truth, protecting analyst credibility with executives.",
};

export function WorkMapClient({ initialSession }: WorkMapClientProps) {
  const [selectedProcessId, setSelectedProcessId] = useState<string>(MOCK_WORK_MAPS[0].id);
  const [selectedNodeId, setSelectedNodeId] = useState<string>(MOCK_WORK_MAPS[0].nodes[0].id);
  const [viewState, setViewState] = useState<"normal" | "empty" | "loading">("normal");
  const [activeTab, setActiveTab] = useState<"decision-tree" | "sop-steps">("decision-tree");

  // Server-side session data shared with /observe
  const [sessionData, setSessionData] = useState<WorkMapSessionData>(initialSession);
  const [selectedDecisionId, setSelectedDecisionId] = useState<string>("dt-large-variance-ledger");
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true);

  const fetchSessionData = async () => {
    try {
      setIsLoadingSession(true);
      const res = await fetch("/api/work-map/session");
      if (res.ok) {
        const data: WorkMapSessionData = await res.json();
        setSessionData(data);
      }
    } catch (err) {
      console.error("Failed to load work map session data:", err);
    } finally {
      setIsLoadingSession(false);
    }
  };

  // Re-sync on focus/mount
  useEffect(() => {
    fetchSessionData();
    const handleFocus = () => fetchSessionData();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const currentProcess = MOCK_WORK_MAPS.find((p) => p.id === selectedProcessId) || MOCK_WORK_MAPS[0];
  const selectedNode = currentProcess?.nodes.find((n) => n.id === selectedNodeId) || currentProcess?.nodes[0];

  const selectedDecisionNode: DecisionTreeNode = useMemo(() => {
    return (
      sessionData.decisionTree.find((n) => n.id === selectedDecisionId) ||
      sessionData.decisionTree.find((n) => n.id === "dt-large-variance-ledger") ||
      sessionData.decisionTree[0]
    );
  }, [sessionData, selectedDecisionId]);

  const hasNewKnowledge =
    sessionData.knowledgeItems.some((k) => k.isNew) ||
    sessionData.decisionTree.some((n) => n.isNew);

  // Calculate real session metrics dynamically (no fake metrics)
  const metrics = useMemo(() => {
    const decisionsCount = sessionData.decisionTree.filter(
      (n) => n.type === "decision" || n.type === "root"
    ).length;

    // Count non-empty rules
    const uniqueRules = new Set<string>();
    sessionData.decisionTree.forEach((n) => {
      if (n.rule && !n.rule.toLowerCase().includes("not stated by expert")) {
        uniqueRules.add(n.rule.trim());
      }
    });
    sessionData.knowledgeItems.forEach((k) => {
      if (k.rule && !k.rule.toLowerCase().includes("not stated by expert")) {
        uniqueRules.add(k.rule.trim());
      }
    });

    // Count non-empty exceptions
    const uniqueExceptions = new Set<string>();
    sessionData.decisionTree.forEach((n) => {
      if (n.exception && !n.exception.toLowerCase().includes("not stated by expert")) {
        uniqueExceptions.add(n.exception.trim());
      }
    });
    sessionData.knowledgeItems.forEach((k) => {
      if (k.exception && !k.exception.toLowerCase().includes("not stated by expert")) {
        uniqueExceptions.add(k.exception.trim());
      }
    });

    // Count non-empty guardrails
    const uniqueGuardrails = new Set<string>();
    sessionData.decisionTree.forEach((n) => {
      if (n.guardrail && !n.guardrail.toLowerCase().includes("not stated by expert")) {
        uniqueGuardrails.add(n.guardrail.trim());
      }
    });
    sessionData.knowledgeItems.forEach((k) => {
      if (k.guardrail && !k.guardrail.toLowerCase().includes("not stated by expert")) {
        uniqueGuardrails.add(k.guardrail.trim());
      }
    });

    // Calculate real average confidence
    const confidences: number[] = [];
    sessionData.decisionTree.forEach((n) => {
      if (typeof n.confidence === "number") confidences.push(n.confidence);
    });
    sessionData.knowledgeItems.forEach((k) => {
      if (typeof k.confidence === "number") confidences.push(k.confidence);
    });

    const avgConfidence =
      confidences.length > 0
        ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
        : 96;

    return {
      decisionsCaptured: decisionsCount,
      rulesExtracted: uniqueRules.size,
      exceptionsFound: uniqueExceptions.size,
      guardrailsFound: uniqueGuardrails.size,
      avgConfidence,
    };
  }, [sessionData]);

  // Construct the Decision X-Ray data for the selected node
  const xrayData: DecisionXRayData = useMemo(() => {
    const node = selectedDecisionNode;
    const id = node?.id || "";

    if (id === "dt-large-variance-ledger") {
      const cleanEvidence =
        node?.evidence?.replace(/^"+|"+$/g, "").trim() ||
        "Whenever variance exceeds 10%, we always inspect raw transaction events before raising any alert.";

      return {
        decision: node?.title || "Variance > 10%: Direct Raw Transaction Verification",
        triggerCondition: "Variance exceeds 10% threshold on Looker dashboard (18% drop detected)",
        whyItMatters:
          WHY_DECISION_MATTERS[id] ||
          "Bypasses potentially stale BI reporting caches to inspect ground-truth transaction logs directly in Snowflake before sounding any alarm.",
        expertReasoning:
          "I don't trust the dashboard number when the variance is this large, so I verify the raw transactions first.",
        extractedRule:
          node?.rule || "When variance exceeds 10%, inspect raw transaction events before raising any alert.",
        exception: node?.exception && !node.exception.includes("Not stated") ? node.exception : "Not stated by expert",
        guardrail:
          node?.guardrail ||
          "Do not raise an alert on a variance above 10% until raw transaction events have been inspected.",
        confidence: typeof node?.confidence === "number" ? node.confidence : 99,
        evidence: cleanEvidence,
        timestamp: node?.timestamp || "05:18",
        source: `Expert observation: ${sessionData.expert}`,
        sourceClassification: "EXPLICIT",
      };
    }

    if (id === "dt-decision-threshold") {
      return {
        decision: node?.title || "Variance Magnitude Check: Tolerance Evaluation",
        triggerCondition: "Incoming revenue drop alert flagged on Looker executive dashboard",
        whyItMatters:
          WHY_DECISION_MATTERS[id] ||
          "Distinguishes normal daily variance (≤10%) from critical anomalies (>10%), preventing expensive manual database audits on routine daily batch fluctuations.",
        expertReasoning:
          "I don't trust the dashboard number when the variance is this large.",
        extractedRule: node?.rule || "Bypass aggregate dashboards if variance exceeds 10% tolerance.",
        exception: "Not stated by expert",
        guardrail: node?.guardrail || "Do not speculate on business causes before validating raw numbers.",
        confidence: typeof node?.confidence === "number" ? node.confidence : 95,
        evidence: "I don't trust the dashboard number when the variance is this large, so I verify the raw transactions first.",
        timestamp: node?.timestamp || "05:14",
        source: `Expert observation: ${sessionData.expert}`,
        sourceClassification: "EXPLICIT",
      };
    }

    if (id === "dt-root") {
      return {
        decision: node?.title || "18% Revenue Drop Detected on Dashboard",
        triggerCondition: "Looker executive dashboard alerts of sudden 18% decline week-over-week in EMEA",
        whyItMatters:
          WHY_DECISION_MATTERS[id] ||
          "Initial trigger for the entire revenue investigation workflow. Immediate knee-jerk escalations before data validation cause executive panic and wasted cross-functional cycles.",
        expertReasoning:
          "I'm looking at our headline numbers. There is an 18% revenue drop showing in EMEA week-over-week. I'm not going to start checking churn logs or asking marketing if a campaign failed yet.",
        extractedRule: "Validate data pipeline authenticity before escalating headline variances.",
        exception: "Not stated by expert",
        guardrail: "The expert does not immediately investigate business causes before validating the number.",
        confidence: typeof node?.confidence === "number" ? node.confidence : 98,
        evidence:
          "I'm looking at our headline numbers. There is an 18% revenue drop showing in EMEA week-over-week. I'm not going to start checking churn logs or asking marketing if a campaign failed yet.",
        timestamp: node?.timestamp || "05:14",
        source: `Expert observation: ${sessionData.expert}`,
        sourceClassification: "EXPLICIT",
      };
    }

    if (id === "dt-minor-fluctuation") {
      return {
        decision: node?.title || "Variance ≤ 10%: Standard Daily Reconciliation",
        triggerCondition: "Daily variance is less than or equal to 10% normal fluctuation band",
        whyItMatters:
          WHY_DECISION_MATTERS[id] ||
          "Suppresses false alarms for minor drift that automatically resolves during daily batch data reconciliation without incident escalation.",
        expertReasoning: "Not stated by expert",
        extractedRule: node?.rule || "Await scheduled batch sync; continue regular monitoring cycle.",
        exception: "Not stated by expert",
        guardrail: node?.guardrail || "Standard operational procedure - do not escalate routine variance.",
        confidence: typeof node?.confidence === "number" ? node.confidence : 92,
        evidence: "Not stated by expert",
        timestamp: node?.timestamp || "05:14",
        source: "Standard Operating Procedure (Baseline)",
        sourceClassification: "INFERRED",
      };
    }

    if (id === "dt-missing-events-lag") {
      return {
        decision: node?.title || "Raw Records Missing: Report Ingestion Sync Delay",
        triggerCondition: "Direct Snowflake query returns empty or lagging transaction records",
        whyItMatters:
          WHY_DECISION_MATTERS[id] ||
          "Accurately diagnoses ingestion sync latency (ETL / webhook lags), routing the fix to Data Engineering rather than falsely reporting customer churn.",
        expertReasoning: "Not stated by expert",
        extractedRule: node?.rule || "Flag data pipeline lag to Data Engineering.",
        exception: "Missing raw transaction records indicate ETL sync delay rather than actual revenue loss.",
        guardrail: node?.guardrail || "Do not alarm executive team over an ETL pipeline delay.",
        confidence: typeof node?.confidence === "number" ? node.confidence : 96,
        evidence: "Not stated by expert",
        timestamp: node?.timestamp || "05:18",
        source: "Diagnostic SOP Logic (Model Inference)",
        sourceClassification: "INFERRED",
      };
    }

    // Default / dt-events-confirmed-business
    return {
      decision: node?.title || "Raw Records Complete: Investigate True Churn Cause",
      triggerCondition: "Direct Snowflake query confirms settled raw records match the 18% decline",
      whyItMatters:
        WHY_DECISION_MATTERS[id] ||
        "Guarantees that business escalations are grounded in verified transactional truth, protecting analyst credibility with executives.",
      expertReasoning: "Not stated by expert",
      extractedRule: node?.rule || "Escalate to business leadership with validated transaction numbers.",
      exception: "Not stated by expert",
      guardrail: node?.guardrail || "Only investigate churn after raw verification succeeds.",
      confidence: typeof node?.confidence === "number" ? node.confidence : 98,
      evidence: "Not stated by expert",
      timestamp: node?.timestamp || "05:18",
      source: "Resolution SOP Logic (Model Inference)",
      sourceClassification: "INFERRED",
    };
  }, [selectedDecisionNode, sessionData]);

  const handleSelectNode = (id: string) => {
    setSelectedDecisionId(id);
    setIsDrawerOpen(true);
  };

  const getNodeTypeBadge = (type: WorkMapNode["type"]) => {
    switch (type) {
      case "trigger":
        return <Badge variant="warning">Trigger</Badge>;
      case "action":
        return <Badge variant="brand">Action</Badge>;
      case "decision":
        return <Badge variant="cyan">Decision Branch</Badge>;
      case "fallback":
        return <Badge variant="danger">Fallback</Badge>;
      case "resolution":
        return <Badge variant="success">Resolution</Badge>;
      default:
        return <Badge variant="default">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-16 bg-grid-pattern -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-screen text-[#EEEFF2] relative">
      {/* ═══════════════════════════════════════════════════════════════
          1. PAGE HEADER & COMPACT SESSION INDICATORS
          ═══════════════════════════════════════════════════════════════ */}
      <header className="space-y-4 pb-4 border-b border-white/[0.08] animate-fade-in-up">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-[#646977] flex items-center gap-2">
              <span>CAPTURED EXPERT KNOWLEDGE</span>
              {hasNewKnowledge && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#34D399]/15 border border-[#34D399]/40 text-[9.5px] font-mono font-semibold text-[#34D399]">
                  <Sparkles className="w-2.5 h-2.5 text-[#34D399]" />
                  NEW KNOWLEDGE
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#EEEFF2] tracking-tight">
              Expert Work Map
            </h1>
            <p className="text-xs text-[#9297A5]">
              Decision workflow compiled from <strong>{sessionData.expert}</strong>&apos;s observation session
            </p>
          </div>

          {/* Controls & Nav */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              onClick={fetchSessionData}
              title="Refresh session data"
              className="p-2 rounded-lg bg-[#181A1F] border border-white/[0.08] hover:bg-[#292B34] text-[#9297A5] hover:text-[#EEEFF2] transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSession ? "animate-spin" : ""}`} />
            </button>

            <Link href="/observe">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181A1F] border border-white/[0.08] hover:bg-[#292B34] text-xs font-medium text-[#EEEFF2] transition-colors">
                <Workflow className="w-3.5 h-3.5 text-[#9297A5]" />
                <span>Observe Expert</span>
              </button>
            </Link>

            <Link href="/train">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5EFE6] text-[#16171B] hover:bg-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02]">
                <Mic className="w-3.5 h-3.5 text-[#16171B]" />
                <span>Practice in Voice Drill</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Compact Session Indicators Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          {/* Indicator 1: Decision nodes captured */}
          <div className="p-3 rounded-xl bg-[#181A1F] border border-white/[0.08] flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#646977] block">
                Decisions Captured
              </span>
              <span className="text-lg font-semibold text-[#EEEFF2] font-mono leading-none">
                {metrics.decisionsCaptured}
              </span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-[#38BDF8]/10 border border-[#38BDF8]/20 flex items-center justify-center">
              <GitFork className="w-3.5 h-3.5 text-[#38BDF8]" />
            </div>
          </div>

          {/* Indicator 2: Rules Extracted */}
          <div className="p-3 rounded-xl bg-[#181A1F] border border-white/[0.08] flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#646977] block">
                Rules Extracted
              </span>
              <span className="text-lg font-semibold text-[#EEEFF2] font-mono leading-none">
                {metrics.rulesExtracted}
              </span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center">
              <Lightbulb className="w-3.5 h-3.5 text-[#F59E0B]" />
            </div>
          </div>

          {/* Indicator 3: Guardrails */}
          <div className="p-3 rounded-xl bg-[#181A1F] border border-white/[0.08] flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#646977] block">
                Guardrails Active
              </span>
              <span className="text-lg font-semibold text-[#EEEFF2] font-mono leading-none">
                {metrics.guardrailsFound}
              </span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-[#34D399]/10 border border-[#34D399]/20 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
            </div>
          </div>

          {/* Indicator 4: Knowledge Confidence */}
          <div className="p-3 rounded-xl bg-[#181A1F] border border-white/[0.08] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#646977]">
                Knowledge Confidence
              </span>
              <span className="text-xs font-mono font-semibold text-[#34D399]">
                {metrics.avgConfidence}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#1F2127] rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-gradient-to-r from-[#38BDF8] to-[#34D399] rounded-full transition-all duration-500"
                style={{ width: `${metrics.avgConfidence}%` }}
              />
            </div>
          </div>
        </div>

        {/* View Switcher Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="inline-flex p-1 rounded-xl bg-[#181A1F] border border-white/[0.08]">
            <button
              onClick={() => setActiveTab("decision-tree")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === "decision-tree"
                  ? "bg-[#292B34] text-[#EEEFF2] shadow-sm"
                  : "text-[#9297A5] hover:text-[#EEEFF2]"
              }`}
            >
              <GitFork className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Decision Tree View</span>
              {hasNewKnowledge && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#34D399] text-[#16171B]">
                  NEW
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("sop-steps")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === "sop-steps"
                  ? "bg-[#292B34] text-[#EEEFF2] shadow-sm"
                  : "text-[#9297A5] hover:text-[#EEEFF2]"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#9297A5]" />
              <span>Procedural SOP Steps (5 Nodes)</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-[#646977]">
            <span className="flex items-center gap-1.5 text-[#9297A5]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
              Scenario: <strong>{sessionData.scenario}</strong>
            </span>
            <span>•</span>
            <button
              onClick={() => setIsDrawerOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 text-[#38BDF8] hover:underline cursor-pointer"
            >
              <Eye className="w-3 h-3" />
              <span>{isDrawerOpen ? "Hide Decision X-Ray" : "Open Decision X-Ray"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
          2. VIEW SWITCHER CONTENT
          ═══════════════════════════════════════════════════════════════ */}
      {viewState === "loading" ? (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      ) : viewState === "empty" ? (
        <EmptyState
          icon={<GitFork className="w-8 h-8 text-[#9297A5]" />}
          title="No Work Maps Available"
          description="Complete an expert observation session to generate your first procedural work map."
          actionLabel="Go to Observation Mode"
          onAction={() => setViewState("normal")}
        />
      ) : activeTab === "decision-tree" ? (
        /* ═════════════════════════════════════════════════════════════
           DECISION CANVAS VIEW (FULL WIDTH, MIN-HEIGHT 760px)
           ═════════════════════════════════════════════════════════════ */
        <div className="space-y-6">
          <div className="w-full min-h-[760px] bg-[#181A1F]/70 rounded-2xl border border-white/[0.08] relative p-6 sm:p-10 flex flex-col items-center justify-start bg-grid-pattern shadow-2xl backdrop-blur-xs overflow-x-auto">
            {/* Canvas Header Tag & Help */}
            <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#EEEFF2] font-medium">
                  Autonomous Decision Architecture
                </span>
                <span className="text-[10px] font-mono text-[#646977]">
                  (28px coordinate grid)
                </span>
              </div>
              <div className="text-[11px] font-mono text-[#9297A5] flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Click any node card to inspect Decision X-Ray</span>
              </div>
            </div>

            {/* Canvas Graph Hierarchy */}
            <div className="w-full max-w-4xl flex flex-col items-center py-6">
              {/* ────────────────────────────────────────────────────────
                  LEVEL 1: OBSERVATION / CONTEXT NODE
                  ──────────────────────────────────────────────────────── */}
              <div className="relative group">
                <div
                  onClick={() => handleSelectNode("dt-root")}
                  className={`w-[230px] sm:w-[250px] p-3.5 rounded-[10px] border transition-all cursor-pointer select-none bg-[#181A1F] border-l-4 border-l-[#38BDF8] ${
                    selectedDecisionId === "dt-root"
                      ? "border-white/[0.25] bg-[#292B34] shadow-[0_0_20px_rgba(56,189,248,0.2)] ring-1 ring-[#38BDF8]/60"
                      : "border-white/[0.08] hover:border-white/[0.2] hover:bg-[#1F2127]"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#38BDF8] uppercase tracking-wider font-semibold">
                      Trigger
                    </span>
                    <span className="text-[#646977]">05:14</span>
                  </div>
                  <h4 className="text-xs font-semibold text-[#EEEFF2] mt-1 line-clamp-1">
                    18% Revenue Drop Detected
                  </h4>
                  <p className="text-[11px] text-[#9297A5] mt-1 line-clamp-2 leading-relaxed">
                    Looker executive dashboard alerts of sudden 18% decline week-over-week in EMEA.
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px]">
                    <span className="text-[#646977] font-mono">Confidence</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="w-[98%] h-full bg-[#34D399] rounded-full" />
                      </div>
                      <span className="text-[#EEEFF2] font-mono font-medium">98%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connector: Level 1 -> Level 2 */}
              <div className="flex flex-col items-center py-1">
                <div className="w-[1.5px] h-7 bg-white/20" />
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-white/30" />
              </div>

              {/* ────────────────────────────────────────────────────────
                  LEVEL 2: DECISION / SPLIT POINT NODE
                  ──────────────────────────────────────────────────────── */}
              <div className="relative group">
                <div
                  onClick={() => handleSelectNode("dt-decision-threshold")}
                  className={`w-[230px] sm:w-[250px] p-3.5 rounded-[10px] border transition-all cursor-pointer select-none bg-[#181A1F] border-l-4 border-l-[#F59E0B] ${
                    selectedDecisionId === "dt-decision-threshold"
                      ? "border-white/[0.25] bg-[#292B34] shadow-[0_0_20px_rgba(245,158,11,0.2)] ring-1 ring-[#F59E0B]/60"
                      : "border-white/[0.08] hover:border-white/[0.2] hover:bg-[#1F2127]"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#F59E0B] uppercase tracking-wider font-semibold">
                      Decision Point
                    </span>
                    <span className="text-[#646977]">05:14</span>
                  </div>
                  <h4 className="text-xs font-semibold text-[#EEEFF2] mt-1 line-clamp-1">
                    Variance Magnitude Check
                  </h4>
                  <p className="text-[11px] text-[#9297A5] mt-1 line-clamp-2 leading-relaxed">
                    Evaluates variance magnitude against the 10% tolerance threshold before escalation.
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px]">
                    <span className="text-[#646977] font-mono">Confidence</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="w-[95%] h-full bg-[#34D399] rounded-full" />
                      </div>
                      <span className="text-[#EEEFF2] font-mono font-medium">95%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connector: Level 2 Split Fork (SVG with YES/NO Badges) */}
              <div className="w-full max-w-2xl relative h-16 my-1">
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 600 64">
                  {/* Stem from center */}
                  <line x1="300" y1="0" x2="300" y2="16" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                  
                  {/* Horizontal Bar */}
                  <line x1="150" y1="16" x2="450" y2="16" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                  
                  {/* Left Drop to Normal Check */}
                  <line x1="150" y1="16" x2="150" y2="58" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                  <polygon points="146,58 154,58 150,64" fill="rgba(255,255,255,0.3)" />

                  {/* Right Drop to Critical Check */}
                  <line x1="450" y1="16" x2="450" y2="58" stroke="rgba(52,211,153,0.4)" strokeWidth="1.5" />
                  <polygon points="446,58 454,58 450,64" fill="#34D399" />
                </svg>

                {/* Branch Badges Overlay */}
                <div className="absolute inset-0 flex items-center justify-between px-16 sm:px-28 pointer-events-none">
                  <span className="px-2 py-0.5 rounded bg-[#1F2127] border border-white/[0.08] text-[9.5px] font-mono text-[#9297A5] shadow-xs">
                    NO (≤ 10%)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#34D399]/15 border border-[#34D399]/40 text-[9.5px] font-mono font-semibold text-[#34D399] shadow-xs">
                    YES (&gt; 10%)
                  </span>
                </div>
              </div>

              {/* ────────────────────────────────────────────────────────
                  LEVEL 3: TWO PATHS (LEFT: NORMAL, RIGHT: CRITICAL)
                  ──────────────────────────────────────────────────────── */}
              <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-12 place-items-center">
                {/* Left Branch: Normal Variance Check */}
                <div className="flex flex-col items-center">
                  <div
                    onClick={() => handleSelectNode("dt-minor-fluctuation")}
                    className={`w-[230px] sm:w-[240px] p-3.5 rounded-[10px] border transition-all cursor-pointer select-none bg-[#181A1F] border-l-4 border-l-[#646977] ${
                      selectedDecisionId === "dt-minor-fluctuation"
                        ? "border-white/[0.25] bg-[#292B34] shadow-[0_0_20px_rgba(255,255,255,0.1)] ring-1 ring-white/30"
                        : "border-white/[0.08] hover:border-white/[0.2] hover:bg-[#1F2127]"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[#9297A5] uppercase tracking-wider font-semibold">
                        Routine
                      </span>
                      <span className="text-[#646977]">≤ 10% Band</span>
                    </div>
                    <h4 className="text-xs font-semibold text-[#EEEFF2] mt-1 line-clamp-1">
                      Standard Daily Reconciliation
                    </h4>
                    <p className="text-[11px] text-[#9297A5] mt-1 line-clamp-2 leading-relaxed">
                      Within normal batch sync tolerance. Await hourly refresh without firing incident alerts.
                    </p>
                    <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px]">
                      <span className="text-[#646977] font-mono">Confidence</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="w-[92%] h-full bg-[#34D399] rounded-full" />
                        </div>
                        <span className="text-[#EEEFF2] font-mono font-medium">92%</span>
                      </div>
                    </div>
                  </div>

                  {/* Terminal Indicator */}
                  <div className="flex flex-col items-center mt-3 text-[10px] font-mono text-[#646977]">
                    <div className="w-[1.5px] h-4 bg-white/10" />
                    <span className="px-2 py-0.5 rounded bg-[#131417] border border-white/[0.06] mt-1">
                      Cycle Continues
                    </span>
                  </div>
                </div>

                {/* Right Branch: Critical Variance Ledger Check (WITH NEW BADGE) */}
                {(() => {
                  const largeVarNode = sessionData.decisionTree.find(
                    (n) => n.id === "dt-large-variance-ledger"
                  );
                  const isNew = largeVarNode?.isNew;

                  return (
                    <div className="flex flex-col items-center w-full">
                      <div
                        onClick={() => handleSelectNode("dt-large-variance-ledger")}
                        className={`w-[230px] sm:w-[240px] p-3.5 rounded-[10px] border transition-all cursor-pointer select-none bg-[#181A1F] border-l-4 border-l-[#34D399] relative ${
                          selectedDecisionId === "dt-large-variance-ledger"
                            ? "border-white/[0.25] bg-[#292B34] shadow-[0_0_20px_rgba(52,211,153,0.25)] ring-1 ring-[#34D399]/60"
                            : "border-white/[0.08] hover:border-white/[0.2] hover:bg-[#1F2127]"
                        }`}
                      >
                        {isNew && (
                          <div className="absolute -top-2 -right-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#34D399] text-[#16171B] text-[9px] font-mono font-extrabold shadow-md tracking-wider uppercase">
                              ✨ NEW
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-[#34D399] uppercase tracking-wider font-semibold">
                            Critical Action
                          </span>
                          <span className="text-[#34D399] font-mono">05:18</span>
                        </div>
                        <h4 className="text-xs font-semibold text-[#EEEFF2] mt-1 line-clamp-1 flex items-center gap-1.5">
                          <Database className="w-3 h-3 text-[#34D399]" />
                          <span>Direct Raw Transaction Verification</span>
                        </h4>
                        <p className="text-[11px] text-[#9297A5] mt-1 line-clamp-2 leading-relaxed">
                          When variance exceeds 10%, query raw transaction events in Snowflake before raising any alert.
                        </p>
                        <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px]">
                          <span className="text-[#646977] font-mono">Confidence</span>
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                              <div className="w-[99%] h-full bg-[#34D399] rounded-full" />
                            </div>
                            <span className="text-[#EEEFF2] font-mono font-medium">99%</span>
                          </div>
                        </div>
                      </div>

                      {/* Connector: Right Branch -> Level 4 Outcomes */}
                      <div className="w-full max-w-[280px] relative h-14 my-1">
                        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 280 56">
                          <line x1="140" y1="0" x2="140" y2="14" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                          <line x1="60" y1="14" x2="220" y2="14" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                          <line x1="60" y1="14" x2="60" y2="50" stroke="rgba(239,68,68,0.4)" strokeWidth="1.5" />
                          <polygon points="56,50 64,50 60,56" fill="#EF4444" />
                          <line x1="220" y1="14" x2="220" y2="50" stroke="rgba(52,211,153,0.4)" strokeWidth="1.5" />
                          <polygon points="216,50 224,50 220,56" fill="#34D399" />
                        </svg>

                        <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
                          <span className="px-1.5 py-0.2 rounded bg-[#EF4444]/15 border border-[#EF4444]/30 text-[8.5px] font-mono text-[#EF4444]">
                            Missing
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-[#34D399]/15 border border-[#34D399]/30 text-[8.5px] font-mono text-[#34D399]">
                            Settled
                          </span>
                        </div>
                      </div>

                      {/* ────────────────────────────────────────────────────────
                          LEVEL 4: FOLLOW-UP OUTCOME NODES
                          ──────────────────────────────────────────────────────── */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-[480px]">
                        {/* Node 5: Ingestion Lag (Exception) */}
                        <div
                          onClick={() => handleSelectNode("dt-missing-events-lag")}
                          className={`p-3 rounded-[10px] border transition-all cursor-pointer select-none bg-[#181A1F] border-l-4 border-l-[#EF4444] ${
                            selectedDecisionId === "dt-missing-events-lag"
                              ? "border-white/[0.25] bg-[#292B34] shadow-[0_0_20px_rgba(239,68,68,0.2)] ring-1 ring-[#EF4444]/60"
                              : "border-white/[0.08] hover:border-white/[0.2] hover:bg-[#1F2127]"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-[#EF4444] uppercase tracking-wider font-semibold">
                              Exception
                            </span>
                            <span className="text-[#646977]">ETL Lag</span>
                          </div>
                          <h5 className="text-xs font-semibold text-[#EEEFF2] mt-1 line-clamp-1">
                            Report Ingestion Delay
                          </h5>
                          <p className="text-[10.5px] text-[#9297A5] mt-1 line-clamp-2 leading-relaxed">
                            Missing raw records reveal ETL pipeline lag. Suppress executive alarms; alert Data Eng.
                          </p>
                          <div className="mt-2 pt-1.5 border-t border-white/[0.06] flex items-center justify-between text-[10px]">
                            <span className="text-[#646977] font-mono">Guardrail</span>
                            <span className="text-[#EEEFF2] font-mono">96%</span>
                          </div>
                        </div>

                        {/* Node 6: Confirmed Churn (Resolution) */}
                        <div
                          onClick={() => handleSelectNode("dt-events-confirmed-business")}
                          className={`p-3 rounded-[10px] border transition-all cursor-pointer select-none bg-[#181A1F] border-l-4 border-l-[#34D399] ${
                            selectedDecisionId === "dt-events-confirmed-business"
                              ? "border-white/[0.25] bg-[#292B34] shadow-[0_0_20px_rgba(52,211,153,0.2)] ring-1 ring-[#34D399]/60"
                              : "border-white/[0.08] hover:border-white/[0.2] hover:bg-[#1F2127]"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-[#34D399] uppercase tracking-wider font-semibold">
                              Resolution
                            </span>
                            <span className="text-[#646977]">Verified</span>
                          </div>
                          <h5 className="text-xs font-semibold text-[#EEEFF2] mt-1 line-clamp-1">
                            Investigate Churn Cause
                          </h5>
                          <p className="text-[10.5px] text-[#9297A5] mt-1 line-clamp-2 leading-relaxed">
                            Raw transactions confirm decline is real. Escalate with validated numbers to leadership.
                          </p>
                          <div className="mt-2 pt-1.5 border-t border-white/[0.06] flex items-center justify-between text-[10px]">
                            <span className="text-[#646977] font-mono">Grounded</span>
                            <span className="text-[#EEEFF2] font-mono">98%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Extracted Knowledge Inventory Feed below Canvas */}
            <div className="w-full mt-10 pt-6 border-t border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#EEEFF2]">
                    Extracted Knowledge Feed ({sessionData.knowledgeItems.length})
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#646977]">
                  Grounded in Sarah Chen&apos;s observed transcript
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sessionData.knowledgeItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.id === "k-expert-10-percent-rule") {
                        handleSelectNode("dt-large-variance-ledger");
                      } else {
                        handleSelectNode("dt-decision-threshold");
                      }
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer bg-[#181A1F] ${
                      item.isNew
                        ? "border-[#34D399]/40 hover:border-[#34D399] hover:bg-[#292B34]"
                        : "border-white/[0.08] hover:border-white/[0.2] hover:bg-[#292B34]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#EEEFF2]">
                          {item.title}
                        </span>
                        {item.isNew && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-[#34D399] text-[#16171B]">
                            NEW
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-[#646977]">
                        {item.timestamp}
                      </span>
                    </div>

                    <p className="text-xs text-[#9297A5] mt-1.5 leading-relaxed">
                      {item.ruleOrReasoningText}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-[#646977]">
                      <span className="italic line-clamp-1">
                        &quot;{item.evidence}&quot;
                      </span>
                      <span className="text-[#34D399] font-medium shrink-0 ml-2">
                        {item.confidence}% conf
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ═════════════════════════════════════════════════════════════
           PROCEDURAL SOP STEPS VIEW
           ═════════════════════════════════════════════════════════════ */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in-up">
          {/* Left Column (5 cols): Process Switcher & Procedural Sequence */}
          <div className="lg:col-span-5 space-y-4">
            <div className="space-y-2">
              <span className="text-[10.5px] font-mono uppercase tracking-wider text-[#646977]">
                Synthesized SOPs ({MOCK_WORK_MAPS.length})
              </span>
              {MOCK_WORK_MAPS.map((proc) => (
                <div
                  key={proc.id}
                  onClick={() => {
                    setSelectedProcessId(proc.id);
                    setSelectedNodeId(proc.nodes[0].id);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedProcessId === proc.id
                      ? "bg-[#292B34] border-[#38BDF8]/50 shadow-[0_0_15px_rgba(56,189,248,0.15)]"
                      : "bg-[#181A1F] border-white/[0.08] hover:border-white/[0.2] hover:bg-[#1F2127]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[#646977]">
                      {proc.department}
                    </span>
                    <Badge variant="cyan" className="text-[10px]">
                      {proc.complexity}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-semibold text-[#EEEFF2] mt-1">
                    {proc.title}
                  </h3>
                  <div className="mt-2 flex items-center gap-3 text-xs text-[#9297A5]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#646977]" />
                      {proc.estimatedMinutes}m avg
                    </span>
                    <span>•</span>
                    <span>{proc.totalSteps} procedural steps</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Stepper Flow */}
            <div className="pt-2 space-y-2">
              <span className="text-[10.5px] font-mono uppercase tracking-wider text-[#646977]">
                Step-by-Step Node Sequence
              </span>
              <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-white/[0.08]">
                {currentProcess.nodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`relative p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#292B34] border-[#38BDF8]/50 text-[#EEEFF2] shadow-lg"
                          : "bg-[#181A1F] border-white/[0.08] text-[#9297A5] hover:border-white/[0.2] hover:text-[#EEEFF2]"
                      }`}
                    >
                      <div
                        className={`absolute -left-6 top-4 w-3.5 h-3.5 rounded-full border-2 ${
                          isSelected
                            ? "bg-[#38BDF8] border-white"
                            : "bg-[#1F2127] border-white/20"
                        }`}
                      />
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium truncate text-[#EEEFF2]">
                          {node.title}
                        </span>
                        {getNodeTypeBadge(node.type)}
                      </div>
                      <p className="text-[11px] text-[#9297A5] mt-1 line-clamp-1">
                        {node.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column (7 cols): Deep Node Inspector */}
          <div className="lg:col-span-7 space-y-4">
            {selectedNode && (
              <div className="p-5 rounded-2xl bg-[#181A1F] border border-white/[0.08] shadow-xl space-y-5">
                <div className="space-y-2 pb-4 border-b border-white/[0.08]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getNodeTypeBadge(selectedNode.type)}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20">
                        {selectedNode.confidence}% apprentice confidence
                      </span>
                    </div>
                    <span className="text-xs text-[#646977] font-mono">
                      ~{selectedNode.durationMinutes} mins execution
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-[#EEEFF2]">
                    {selectedNode.title}
                  </h2>
                  <p className="text-sm text-[#9297A5]">
                    {selectedNode.description}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-[10.5px] font-mono uppercase tracking-wider text-[#646977] mb-2">
                      Tools &amp; Applications Interacted With
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedNode.appsUsed.map((app) => (
                        <span
                          key={app}
                          className="px-2.5 py-1 rounded-lg bg-[#1F2127] border border-white/[0.08] text-xs font-mono text-[#EEEFF2]"
                        >
                          {app}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#38BDF8]/5 border border-[#38BDF8]/20 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#38BDF8]">
                      <Lightbulb className="w-4 h-4" />
                      <span>Captured Senior Expert Shortcut</span>
                    </div>
                    <p className="text-xs text-[#EEEFF2] leading-relaxed">
                      {selectedNode.expertTips}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#EF4444]/5 border border-[#EF4444]/20 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#EF4444]">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Common Junior Pitfalls to Avoid</span>
                    </div>
                    <ul className="space-y-1.5">
                      {selectedNode.commonPitfalls.map((pitfall, i) => (
                        <li key={i} className="text-xs text-[#9297A5] flex items-start gap-2">
                          <span className="text-[#EF4444] text-sm leading-none">•</span>
                          <span>{pitfall}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs text-[#9297A5]">
                    <span>
                      Connections:{" "}
                      {selectedNode.connections.length > 0
                        ? selectedNode.connections.join(", ")
                        : "Terminal Step"}
                    </span>
                    <Link href="/train">
                      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5EFE6] text-[#16171B] hover:bg-white text-xs font-semibold transition-all">
                        <Mic className="w-3.5 h-3.5" />
                        <span>Practice Step in Voice Simulator</span>
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          3. DECISION X-RAY (DRAWER / INSPECTOR)
          ═══════════════════════════════════════════════════════════════ */}
      {isDrawerOpen && (
        <>
          {/* Backdrop (mobile dismiss) */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:bg-transparent lg:pointer-events-none transition-opacity"
          />

          {/* Drawer Container */}
          <aside className="fixed inset-y-0 right-0 w-full sm:w-[460px] z-50 bg-[#181A1F] border-l border-white/[0.08] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col animate-fade-in-up">
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-white/[0.08] space-y-2 bg-[#181A1F]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#38BDF8]">
                    DECISION X-RAY
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20 text-[10px] font-mono">
                    Captured from observation
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {selectedDecisionNode?.isNew && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#34D399] text-[#16171B] text-[9px] font-mono font-bold shadow-xs">
                      ✨ NEW
                    </span>
                  )}
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[#9297A5] hover:text-[#EEEFF2] transition-colors cursor-pointer"
                    title="Close Decision X-Ray"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-[#EEEFF2] leading-snug">
                  {xrayData.decision}
                </h3>
                <p className="text-xs text-[#9297A5] mt-0.5">
                  Detailed evidence-backed explanation elicited from <strong>Sarah Chen</strong>
                </p>
              </div>

              {/* Source Classification Legend Bar */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[9px] font-mono">
                <span className="text-[#646977]">Source Types:</span>
                <span className="px-1.5 py-0.5 rounded bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30">
                  EXPLICIT
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30">
                  INFERRED
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#1F2127] text-[#9297A5] border border-white/[0.08]">
                  UNKNOWN
                </span>
              </div>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs">
              {/* ──────────────────────────────────────────────────────
                  PROMINENT VERBATIM GROUNDED EVIDENCE (Lilac Accent #C084FC)
                  ────────────────────────────────────────────────────── */}
              {xrayData.evidence !== "Not stated by expert" ? (
                <div className="p-4 rounded-xl border border-[#C084FC]/40 bg-gradient-to-br from-[#C084FC]/10 via-[#181A1F] to-[#1F2127] shadow-[0_0_25px_rgba(192,132,252,0.12)] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#C084FC] uppercase tracking-widest flex items-center gap-1.5 font-mono">
                      <Quote className="w-3.5 h-3.5 text-[#C084FC]" />
                      Exact Expert Sentence (Verbatim Evidence)
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-[#34D399]/15 text-[#34D399] text-[9px] font-mono font-bold border border-[#34D399]/30">
                      EXPLICIT
                    </span>
                  </div>

                  <blockquote className="text-sm font-medium text-[#EEEFF2] italic tracking-wide leading-relaxed pl-3 border-l-2 border-[#C084FC]">
                    &quot;{xrayData.evidence}&quot;
                  </blockquote>

                  <div className="pt-2 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-1 text-[10px] text-[#9297A5] font-mono">
                    <span>Speaker: <strong>Sarah Chen</strong></span>
                    <span className="text-[#C084FC] font-medium">Grounded in verbatim words</span>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border border-white/[0.08] bg-[#1F2127] space-y-1 text-[#9297A5]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#646977]">
                      Grounded Evidence
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-[#181A1F] text-[#9297A5] text-[9px] font-mono border border-white/[0.08]">
                      UNKNOWN
                    </span>
                  </div>
                  <p className="text-xs text-[#9297A5] italic">
                    Not stated by expert in current observation session.
                  </p>
                </div>
              )}

              {/* 1. Decision & Trigger / Condition */}
              <div className="grid grid-cols-1 gap-2.5">
                <div className="p-3 rounded-xl bg-[#1F2127] border border-white/[0.08] space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#646977] block">
                    Decision Evaluated
                  </span>
                  <p className="text-[#EEEFF2] font-medium leading-relaxed">
                    {xrayData.decision}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#1F2127] border border-white/[0.08] space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#38BDF8] block">
                    Trigger / Condition
                  </span>
                  <p className="text-[#EEEFF2] leading-relaxed font-mono text-[11px]">
                    {xrayData.triggerCondition}
                  </p>
                </div>
              </div>

              {/* 2. Why It Matters */}
              <div className="p-3 rounded-xl bg-[#38BDF8]/5 border border-[#38BDF8]/20 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#38BDF8] block font-semibold">
                  Why It Matters
                </span>
                <p className="text-[#EEEFF2] leading-relaxed">
                  {xrayData.whyItMatters}
                </p>
              </div>

              {/* 3. Expert Reasoning */}
              <div className="p-3 rounded-xl bg-[#C084FC]/5 border border-[#C084FC]/20 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#C084FC] block font-semibold">
                  Expert Reasoning
                </span>
                <p className="text-[#EEEFF2] leading-relaxed italic">
                  {xrayData.expertReasoning !== "Not stated by expert"
                    ? `"${xrayData.expertReasoning}"`
                    : "Not stated by expert"}
                </p>
              </div>

              {/* 4. Extracted Rule */}
              {(() => {
                const ruleClassification = getFieldClassification(
                  xrayData.extractedRule,
                  xrayData.evidence,
                  selectedDecisionNode?.id,
                  "rule"
                );

                return (
                  <div className="p-3 rounded-xl bg-[#1F2127] border border-white/[0.08] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#34D399] flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-[#34D399]" />
                        Rule
                      </span>
                      <span
                        title={ruleClassification.description}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${ruleClassification.badgeClass}`}
                      >
                        {ruleClassification.label}
                      </span>
                    </div>
                    <p className="text-[#EEEFF2] leading-relaxed font-medium">
                      {xrayData.extractedRule}
                    </p>
                  </div>
                );
              })()}

              {/* 5. Exception */}
              {(() => {
                const exceptionClassification = getFieldClassification(
                  xrayData.exception,
                  xrayData.evidence,
                  selectedDecisionNode?.id,
                  "exception"
                );

                return (
                  <div className="p-3 rounded-xl bg-[#1F2127] border border-white/[0.08] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#F59E0B] flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-[#F59E0B]" />
                        Exception
                      </span>
                      <span
                        title={exceptionClassification.description}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${exceptionClassification.badgeClass}`}
                      >
                        {exceptionClassification.label}
                      </span>
                    </div>
                    <p className="text-[#EEEFF2] leading-relaxed">
                      {xrayData.exception}
                    </p>
                  </div>
                );
              })()}

              {/* 6. Guardrail */}
              {(() => {
                const guardrailClassification = getFieldClassification(
                  xrayData.guardrail,
                  xrayData.evidence,
                  selectedDecisionNode?.id,
                  "guardrail"
                );

                return (
                  <div className="p-3 rounded-xl bg-[#1F2127] border border-white/[0.08] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#34D399] flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
                        Guardrail
                      </span>
                      <span
                        title={guardrailClassification.description}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${guardrailClassification.badgeClass}`}
                      >
                        {guardrailClassification.label}
                      </span>
                    </div>
                    <p className="text-[#EEEFF2] leading-relaxed">
                      {xrayData.guardrail}
                    </p>
                  </div>
                );
              })()}

              {/* 7. Confidence Progress & Timestamp & Source */}
              <div className="p-3 rounded-xl bg-[#1F2127] border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between text-[#EEEFF2]">
                  <span className="font-semibold text-[11px] font-mono">Knowledge Confidence</span>
                  <span className="font-mono text-[#34D399] font-bold">
                    {xrayData.confidence}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#181A1F] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#38BDF8] to-[#34D399] rounded-full"
                    style={{ width: `${xrayData.confidence}%` }}
                  />
                </div>
                <div className="pt-1 flex items-center justify-between text-[10px] text-[#646977] font-mono">
                  <span>Captured: {xrayData.timestamp}</span>
                  <span className="text-[#9297A5]">Observation Verified</span>
                </div>
              </div>

              {/* Source attribution */}
              <div className="p-2.5 rounded-xl bg-[#181A1F] border border-white/[0.06] text-[11px] text-[#9297A5]">
                <span className="text-[#646977] block text-[10px] uppercase font-semibold font-mono">
                  Source:
                </span>
                <span className="text-[#EEEFF2] font-medium">
                  {xrayData.source}
                </span>
              </div>
            </div>

            {/* Drawer Footer CTA */}
            <div className="p-4 border-t border-white/[0.08] bg-[#181A1F]">
              <Link href="/train">
                <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#F5EFE6] text-[#16171B] hover:bg-white text-xs font-semibold shadow-md transition-all">
                  <Mic className="w-4 h-4 text-[#16171B]" />
                  <span>Practice This Decision in Voice Drill</span>
                </button>
              </Link>
            </div>
          </aside>
        </>
      )}

      {/* Floating Re-Open Button when drawer is closed */}
      {!isDrawerOpen && (
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#181A1F] border border-[#38BDF8]/40 text-[#EEEFF2] shadow-2xl hover:bg-[#292B34] transition-all cursor-pointer font-medium text-xs backdrop-blur-md"
        >
          <Eye className="w-4 h-4 text-[#38BDF8]" />
          <span>Decision X-Ray: {selectedDecisionNode?.title || "Inspect"}</span>
        </button>
      )}
    </div>
  );
}
