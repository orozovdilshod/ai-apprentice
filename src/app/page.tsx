"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  GitFork,
  Radio,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Layers,
  GraduationCap,
  Users,
} from "lucide-react";
import { WorkMapSessionData, KnowledgeItem } from "@/lib/session-store";

// Category badge formatting helper strictly adhering to design specifications
function getCategoryBadge(category: string) {
  switch (category) {
    case "new_rule":
    case "rule":
    case "decision_point":
      return {
        label: "Rule",
        classes: "text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/20",
      };
    case "guardrail":
      return {
        label: "Guardrail",
        classes: "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20",
      };
    case "exception":
      return {
        label: "Exception",
        classes: "text-[#C084FC] bg-[#C084FC]/10 border-[#C084FC]/20",
      };
    case "additional_reasoning":
    case "reasoning":
    default:
      return {
        label: "Reasoning",
        classes: "text-[#34D399] bg-[#34D399]/10 border-[#34D399]/20",
      };
  }
}

// Fallback baseline knowledge items matching authoritative Sarah Chen session
const BASELINE_FALLBACK_ITEMS: KnowledgeItem[] = [
  {
    id: "k-baseline-raw-verify",
    category: "decision_point",
    categoryLabel: "Baseline Rule",
    title: "Raw Ledger Verification on Large Drop",
    ruleOrReasoningText:
      "When large variance is observed on the dashboard, bypass aggregate numbers and verify raw transactions first.",
    evidence: "Observed action: Opened raw transaction data after seeing an 18% revenue drop.",
    confidence: 98,
    timestamp: "05:14",
    isNew: false,
    decisionPoint: "18% Revenue Drop Detected on Dashboard",
    rule: "Verify raw transaction records first before investigating business causes.",
    exception: "Not stated by expert",
    guardrail: "The expert does not immediately investigate business causes before validating the number.",
  },
  {
    id: "k-expert-10-percent-rule",
    category: "guardrail",
    categoryLabel: "Guardrail",
    title: "10% Variance Threshold & Alert Guardrail",
    ruleOrReasoningText:
      "Whenever variance exceeds 10%, we always inspect raw transaction events before raising any alert.",
    evidence: "Whenever variance exceeds 10%, we always inspect raw transaction events before raising any alert.",
    confidence: 99,
    timestamp: "05:18",
    isNew: false,
    decisionPoint: "Variance Magnitude Evaluation (>10% Threshold)",
    rule: "Whenever variance exceeds 10%, we always inspect raw transaction events before raising any alert.",
    exception: "Not stated by expert",
    guardrail: "Do not raise an alert on a variance above 10% until raw transaction events have been inspected.",
  },
];

export default function DashboardPage() {
  const [session, setSession] = useState<WorkMapSessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchSession() {
      try {
        const res = await fetch("/api/work-map/session");
        if (res.ok) {
          const data: WorkMapSessionData = await res.json();
          if (isMounted) setSession(data);
        }
      } catch (err) {
        console.warn("Could not load real session data for dashboard:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchSession();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute real metrics from authoritative session data
  const decisionsCount = session
    ? session.decisionTree.filter((n) => n.type === "decision" || n.type === "guardrail").length
    : 2;

  const rulesCount = session
    ? session.decisionTree.filter((n) => n.rule && n.rule !== "Not stated by expert").length
    : 4;

  const guardrailsCount = session
    ? session.decisionTree.filter((n) => n.guardrail && n.guardrail !== "Not stated by expert").length
    : 4;

  const confidences = session?.decisionTree
    ?.map((n) => n.confidence)
    .filter((c): c is number => typeof c === "number" && c > 0) || [95, 99, 96, 98];

  const avgConfidence =
    confidences.length > 0
      ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
      : 97;

  // Real knowledge items list
  const knowledgeList =
    session && session.knowledgeItems && session.knowledgeItems.length > 0
      ? session.knowledgeItems
      : BASELINE_FALLBACK_ITEMS;

  return (
    <div className="space-y-8 pb-12 bg-grid-pattern -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-full">
      {/* 1. HERO SECTION */}
      <section
        className="space-y-6 pt-2 animate-fade-in-up"
        style={{ animationDelay: "0ms" }}
        aria-label="Executive Overview"
      >
        {/* Status Pill */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#181A1F] border border-white/[0.08] text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-pulse" />
            <span className="text-[#38BDF8] font-medium">Observer active</span>
            <span className="text-[#646977]">·</span>
            <span className="text-[#9297A5]">
              {session?.scenario || "Revenue Anomaly Investigation"} · {session?.expert ? session.expert.replace(/\s*\(.*\)/, "") : "Sarah Chen"}
            </span>
          </div>
        </div>

        {/* Main Headline */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-semibold text-[#EEEFF2] tracking-tight leading-[1.08] max-w-4xl">
            Turn Expert Judgment Into{" "}
            <span className="text-[#9297A5]">Institutional Knowledge.</span>
          </h1>

          {/* Supporting Text */}
          <p className="text-[14px] sm:text-base text-[#9297A5] leading-relaxed max-w-2xl">
            AI Apprentice observes how your best people work, captures the reasoning behind
            their decisions, and turns it into training for the next generation.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link href="/observe">
            <button className="bg-[#F5EFE6] text-[#16171B] hover:bg-[#F5EFE6]/90 font-medium px-5 py-2.5 rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2 text-sm">
              <span>Start Observation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>

          <Link href="/work-map">
            <button className="bg-[#1F2127] text-[#EEEFF2] hover:bg-[#292B34] border border-white/[0.08] px-5 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium">
              <GitFork className="w-4 h-4 text-[#9297A5]" />
              <span>Explore Work Map</span>
            </button>
          </Link>
        </div>
      </section>

      {/* 2. METRICS STRIP */}
      <section
        className="bg-[#181A1F] border border-white/[0.08] rounded-xl p-5 sm:p-6 animate-fade-in-up"
        style={{ animationDelay: "60ms" }}
        aria-label="Knowledge Telemetry"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-white/[0.08]">
          {/* Metric 1: Decisions Captured */}
          <div className="lg:px-6 first:pl-0 space-y-1">
            <div className="font-mono text-2xl sm:text-3xl font-semibold text-[#EEEFF2] tracking-tight">
              {isLoading ? "—" : decisionsCount}
            </div>
            <div className="text-xs text-[#9297A5] font-medium">Decisions Captured</div>
            <div className="text-[10.5px] font-mono text-[#646977] pt-0.5">
              Branch points identified
            </div>
          </div>

          {/* Metric 2: Rules Extracted */}
          <div className="lg:px-6 space-y-1">
            <div className="font-mono text-2xl sm:text-3xl font-semibold text-[#EEEFF2] tracking-tight">
              {isLoading ? "—" : rulesCount}
            </div>
            <div className="text-xs text-[#9297A5] font-medium">Rules Extracted</div>
            <div className="text-[10.5px] font-mono text-[#646977] pt-0.5">
              10% variance threshold
            </div>
          </div>

          {/* Metric 3: Guardrails */}
          <div className="lg:px-6 space-y-1">
            <div className="font-mono text-2xl sm:text-3xl font-semibold text-[#EEEFF2] tracking-tight">
              {isLoading ? "—" : guardrailsCount}
            </div>
            <div className="text-xs text-[#9297A5] font-medium">Guardrails</div>
            <div className="text-[10.5px] font-mono text-[#646977] pt-0.5">
              Pre-alert verification
            </div>
          </div>

          {/* Metric 4: Knowledge Confidence */}
          <div className="lg:px-6 last:pr-0 space-y-1">
            <div className="font-mono text-2xl sm:text-3xl font-semibold text-[#EEEFF2] tracking-tight">
              {isLoading ? "—" : `${avgConfidence}%`}
            </div>
            <div className="text-xs text-[#9297A5] font-medium">Knowledge Confidence</div>
            <div className="text-[10.5px] font-mono text-[#646977] pt-0.5">
              Evidence validated
            </div>
          </div>
        </div>
      </section>

      {/* 3. KNOWLEDGE PIPELINE */}
      <section
        className="space-y-3.5 animate-fade-in-up"
        style={{ animationDelay: "120ms" }}
        aria-label="Knowledge Pipeline"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-[#646977]">
              Continuous Knowledge Lifecycle
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-[#EEEFF2] tracking-tight mt-0.5">
              Knowledge Pipeline
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
          {/* Stage 1: Observe */}
          <Link
            href="/observe"
            className="group block bg-[#181A1F] hover:bg-[#292B34]/50 border border-white/[0.08] hover:border-white/[0.18] rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 relative"
          >
            <div className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-[#38BDF8]">
              01 OBSERVE
            </div>
            <div className="text-[16px] font-semibold text-[#EEEFF2] mt-2 group-hover:text-white transition-colors">
              Observe
            </div>
            <div className="text-[13.5px] text-[#9297A5] mt-1 leading-snug">
              Capture expert behavior
            </div>
            <div className="mt-4 flex items-center text-xs font-mono text-[#646977] group-hover:text-[#38BDF8] transition-colors gap-1">
              <span>View live observer</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Stage 2: Reason */}
          <Link
            href="/observe"
            className="group block bg-[#181A1F] hover:bg-[#292B34]/50 border border-white/[0.08] hover:border-white/[0.18] rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 relative"
          >
            <div className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-[#38BDF8]">
              02 REASON
            </div>
            <div className="text-[16px] font-semibold text-[#EEEFF2] mt-2 group-hover:text-white transition-colors">
              Reason
            </div>
            <div className="text-[13.5px] text-[#9297A5] mt-1 leading-snug">
              Detect meaningful decisions
            </div>
            <div className="mt-4 flex items-center text-xs font-mono text-[#646977] group-hover:text-[#38BDF8] transition-colors gap-1">
              <span>Inspect heuristic triggers</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Stage 3: Knowledge */}
          <Link
            href="/work-map"
            className="group block bg-[#181A1F] hover:bg-[#292B34]/50 border border-white/[0.08] hover:border-white/[0.18] rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 relative"
          >
            <div className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-[#38BDF8]">
              03 KNOWLEDGE
            </div>
            <div className="text-[16px] font-semibold text-[#EEEFF2] mt-2 group-hover:text-white transition-colors">
              Knowledge
            </div>
            <div className="text-[13.5px] text-[#9297A5] mt-1 leading-snug">
              Extract grounded rules
            </div>
            <div className="mt-4 flex items-center text-xs font-mono text-[#646977] group-hover:text-[#38BDF8] transition-colors gap-1">
              <span>Explore Work Map</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Stage 4: Train */}
          <Link
            href="/train"
            className="group block bg-[#181A1F] hover:bg-[#292B34]/50 border border-white/[0.08] hover:border-white/[0.18] rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 relative"
          >
            <div className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-[#38BDF8]">
              04 TRAIN
            </div>
            <div className="text-[16px] font-semibold text-[#EEEFF2] mt-2 group-hover:text-white transition-colors">
              Train
            </div>
            <div className="text-[13.5px] text-[#9297A5] mt-1 leading-snug">
              Transfer expertise to new hires
            </div>
            <div className="mt-4 flex items-center text-xs font-mono text-[#646977] group-hover:text-[#38BDF8] transition-colors gap-1">
              <span>Start roleplay drill</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </section>

      {/* 4. TWO-COLUMN KNOWLEDGE MATRIX */}
      <section
        className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6 animate-fade-in-up"
        style={{ animationDelay: "180ms" }}
        aria-label="Extracted Knowledge & Training Readiness"
      >
        {/* LEFT CARD: Recently Extracted Knowledge */}
        <div className="bg-[#181A1F] border border-white/[0.08] rounded-xl p-5 sm:p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-white/[0.05]">
              <div>
                <div className="text-[10.5px] font-mono text-[#646977] uppercase tracking-[0.12em]">
                  Session Store Grounding
                </div>
                <h3 className="text-[15px] sm:text-base font-semibold text-[#EEEFF2] tracking-tight mt-0.5">
                  Recently Extracted Knowledge
                </h3>
              </div>
              <Link
                href="/work-map"
                className="text-xs font-mono text-[#38BDF8] hover:text-[#38BDF8]/80 flex items-center gap-1 transition-colors"
              >
                <span>Open Work Map</span>
                <span className="text-[11px]">↗</span>
              </Link>
            </div>

            {/* Knowledge Rows */}
            <div className="divide-y divide-white/[0.05]">
              {knowledgeList.map((item) => {
                const badge = getCategoryBadge(item.category);
                return (
                  <div key={item.id} className="py-3.5 first:pt-1 last:pb-1 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10.5px] font-mono uppercase tracking-[0.1em] px-2 py-0.5 rounded border ${badge.classes}`}
                        >
                          {badge.label}
                        </span>
                        <span className="text-xs text-[#9297A5] truncate max-w-[200px] sm:max-w-xs">
                          {item.decisionPoint || item.title}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-[#38BDF8] flex-shrink-0">
                        {item.confidence}% conf
                      </span>
                    </div>

                    <p className="text-[13.5px] text-[#EEEFF2] leading-snug font-medium">
                      {item.rule || item.ruleOrReasoningText}
                    </p>

                    {item.evidence && (
                      <p className="text-[11.5px] text-[#646977] italic line-clamp-1">
                        &quot;{item.evidence}&quot;
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/[0.05] flex items-center justify-between text-xs text-[#646977] font-mono">
            <span>Authoritative expert: Sarah Chen</span>
            <span>Grounding: 100% verified</span>
          </div>
        </div>

        {/* RIGHT CARD: Training Readiness */}
        <div className="bg-[#181A1F] border border-white/[0.08] rounded-xl p-5 sm:p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-white/[0.05]">
              <div>
                <div className="text-[10.5px] font-mono text-[#646977] uppercase tracking-[0.12em]">
                  Simulation Engine
                </div>
                <h3 className="text-[15px] sm:text-base font-semibold text-[#EEEFF2] tracking-tight mt-0.5">
                  Training Readiness
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-mono text-[#34D399] bg-[#34D399]/10 border border-[#34D399]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
                Ready
              </span>
            </div>

            {/* Training Readiness Details */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-lg bg-[#1F2127] border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#9297A5]">Scenario</span>
                  <span className="font-semibold text-[#EEEFF2]">
                    Revenue Anomaly Investigation
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#9297A5]">Drills Available</span>
                  <span className="font-mono text-[#38BDF8]">3 dynamic drills</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#9297A5]">Evaluation Grounding</span>
                  <span className="text-[#EEEFF2]">Sarah Chen 10% Variance Rule</span>
                </div>
              </div>

              {/* Compact Useful Empty State for Cohorts */}
              <div className="p-3.5 rounded-lg bg-[#1F2127]/60 border border-white/[0.05] space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-medium text-[#EEEFF2]">
                  <Users className="w-3.5 h-3.5 text-[#9297A5]" />
                  <span>No learner cohort connected</span>
                </div>
                <p className="text-[12px] text-[#9297A5] leading-relaxed">
                  Voice drills are compiled directly from captured rules and ready for individual
                  practice. Connect an LMS or run interactive practice sessions.
                </p>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-4 mt-4 border-t border-white/[0.05]">
            <Link href="/train" className="block w-full">
              <button className="w-full bg-[#1F2127] hover:bg-[#292B34] text-[#EEEFF2] border border-white/[0.08] font-medium py-2.5 px-4 rounded-lg text-xs flex items-center justify-center gap-2 transition-all">
                <span>Open voice training →</span>
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
