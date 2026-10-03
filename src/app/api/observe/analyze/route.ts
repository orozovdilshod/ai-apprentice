import { NextResponse } from "next/server";
import {
  analyzeExpertObservation,
  ObservationAnalysisInput,
} from "@/lib/anthropic";
import { addOrUpdateKnowledgeItem } from "@/lib/session-store";

export async function POST(request: Request) {
  try {
    const body: ObservationAnalysisInput = await request.json();

    if (!body.expertAction || !body.expertTranscript) {
      return NextResponse.json(
        {
          error:
            "Invalid input: 'expertAction' and 'expertTranscript' are required.",
        },
        { status: 400 }
      );
    }

    const result = await analyzeExpertObservation(body);

    // If an expert response was analyzed, store it in the shared server session store
    if (body.expertResponse && body.expertResponse.trim()) {
      addOrUpdateKnowledgeItem({
        id: "k-expert-10-percent-rule",
        category: result.expertResponseAnalysis?.revealedCategory || "new_rule",
        categoryLabel: result.expertResponseAnalysis?.revealedCategoryLabel || "New Rule",
        title: "10% Variance Threshold & Alert Guardrail",
        decisionPoint: "Variance Magnitude Evaluation (>10% Threshold)",
        rule: result.rule,
        ruleOrReasoningText: result.rule,
        exception: result.exception,
        guardrail: result.guardrail,
        evidence: result.expertResponseAnalysis?.groundedEvidence || result.ruleEvidence,
        confidence: Math.round(result.confidence * 100),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isNew: true,
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API /api/observe/analyze error:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze observation with Claude",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
