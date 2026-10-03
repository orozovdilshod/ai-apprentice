import { NextRequest, NextResponse } from "next/server";
import {
  evaluateTraineeAnswerWithClaude,
  TraineeEvaluationInput,
} from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      scenario,
      traineeAnswer,
      rule,
      exception,
      guardrail,
      expertEvidence,
      isFollowUp,
      drillNumber,
    } = body || {};

    if (!scenario || !traineeAnswer || typeof traineeAnswer !== "string") {
      return NextResponse.json(
        { error: "Both 'scenario' and 'traineeAnswer' are required." },
        { status: 400 }
      );
    }

    const input: TraineeEvaluationInput = {
      scenario: scenario.trim(),
      traineeAnswer: traineeAnswer.trim(),
      rule: (rule || "").trim(),
      exception: (exception || "Not stated by expert").trim(),
      guardrail: (guardrail || "").trim(),
      expertEvidence: (expertEvidence || "").trim(),
      isFollowUp: Boolean(isFollowUp),
      drillNumber: typeof drillNumber === "number" ? drillNumber : undefined,
    };

    const evaluation = await evaluateTraineeAnswerWithClaude(input);

    return NextResponse.json(evaluation, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Evaluation failed";
    console.error("Error in /api/train/evaluate:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
