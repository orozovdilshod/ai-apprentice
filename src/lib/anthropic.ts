/**
 * Anthropic Claude API Client
 * 
 * SERVER-SIDE ONLY: Never import this file into Client Components ("use client").
 */

export interface ObservationAnalysisInput {
  expertAction: string;
  expertTranscript: string;
  context?: string;
  whyQuestion?: string;
  expertResponse?: string;
}

export interface GroundedKnowledgeItem {
  item: string;
  sourceSentence: string;
}

export interface GroundedInferenceItem {
  inference: string;
  groundedIn: string;
}

export interface ExpertResponseAnalysis {
  revealedCategory:
    | "new_rule"
    | "exception"
    | "guardrail"
    | "additional_reasoning"
    | "no_new_knowledge";
  revealedCategoryLabel: string;
  summary: string;
  groundedEvidence: string;
}

export interface ObservationAnalysisOutput {
  shouldAskWhy: boolean;
  questionPriority: "low" | "medium" | "high";
  triggerReason: string;
  isDecisionPoint: boolean;
  confidence: number;
  whyQuestion: string;
  reasoning: string;
  reasoningEvidence: string;
  rule: string;
  ruleEvidence: string;
  exception: string;
  exceptionEvidence: string;
  guardrail: string;
  guardrailEvidence: string;
  explicitKnowledge: GroundedKnowledgeItem[];
  reasonableInferences: GroundedInferenceItem[];
  unknownOrNotStated: string[];
  expertResponseAnalysis?: ExpertResponseAnalysis | null;
}

export async function analyzeExpertObservation(
  input: ObservationAnalysisInput
): Promise<ObservationAnalysisOutput> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

  if (!apiKey || apiKey === "your_anthropic_api_key_here") {
    throw new Error("ANTHROPIC_API_KEY is missing or unconfigured in .env.local");
  }

  const hasExpertResponse = Boolean(input.expertResponse && input.expertResponse.trim());

  const systemPrompt = `You are a rigorous, evidence-grounded expert-observation analyst for AI Apprentice.
Your objective is to extract ONLY tacit heuristics and knowledge that are directly supported by the provided expert transcript, observed system actions, and expert probe responses.

CRITICAL NON-NEGOTIABLE ANTI-HALLUCINATION RULES:
1. Grounding: You MUST NOT invent rules, exceptions, guardrails, actions, thresholds, tools, or expert knowledge that is not explicitly supported by the provided expert transcript, observed system action, or expert response.
2. Evidence Citation: For EVERY extracted item (rule, reasoning, exception, guardrail), you must provide the exact supporting source sentence/evidence from the transcript, action, or expert response.
3. Fallback for Insufficient Evidence: If an exception or guardrail is NOT explicitly stated or demonstrated by the expert, you MUST return "Not stated by expert" for both the item and its evidence. Do NOT guess or hallucinate plausible exceptions or guardrails.
4. No Technical Inventing: Do NOT infer specific technical actions, tools, partition strategies, SQL clauses, or communication channels (such as Snowflake partition scans, Slack executive alerts) that the expert never explicitly performed or stated.
5. No Domain Bloat: Do NOT convert general industry domain knowledge into "expert knowledge".
6. Explicit Separation: Clearly separate:
   - "explicitKnowledge": knowledge and rules directly stated or performed by the expert, with exact source sentences.
   - "reasonableInferences": conservative logical deductions strictly tethered to the observation, stating what it is grounded in.
   - "unknownOrNotStated": critical details left unsaid, unverified, or unspecified by the expert.
7. Confidence must be a decimal number between 0 and 1 strictly reflecting the degree of direct evidence support.
8. ${hasExpertResponse ? "Since the expert has answered the targeted probe question, formulate the next probe question or leave whyQuestion empty if the key unknown is resolved." : "Generate ONE concise natural 'why' question to probe the expert deeper on an unstated threshold or nuance only if useful."}

AI OBSERVER "WHY?" PROBE CRITERIA:
You must autonomously evaluate whether an AI Apprentice observer should interrupt to ask a "Why?" question:
1. "shouldAskWhy": boolean
   - Routine action (e.g. opening a dashboard, logging in, standard navigation without branching) -> MUST be false.
   - Merely noticing an anomaly before choosing an action (decision point recognized, but awaiting action) -> MUST be false (set isDecisionPoint = true, shouldAskWhy = false).
   - Meaningful decision point, unusual deviation from normal workflow, or new unwritten rule/guardrail (e.g. bypassing standard business investigation to query raw transaction records upon variance) -> MUST be true.
   - Insufficient evidence -> MUST be false.
2. "questionPriority": "low" | "medium" | "high"
   - "high": High-impact decision point, counter-intuitive workflow deviation, or unwritten heuristic.
   - "medium": Decision detected or developing anomaly without an unexpected action yet.
   - "low": Routine operational action or low-significance step.
3. "triggerReason": string
   - A concise, factual statement (1-2 sentences) explaining why a "Why?" question should or should not be asked.
   - MUST be strictly grounded ONLY in the supplied expert action, transcript, and context.

${hasExpertResponse ? `EXPERT RESPONSE ANALYSIS INSTRUCTIONS:
The user has provided an expert response to the probe question.
Analyze whether the expert response reveals:
- "new_rule": Introduces an explicit heuristic, specific threshold (e.g., variance threshold), or operational rule.
- "exception": Identifies an explicit condition where standard procedure is bypassed.
- "guardrail": Establishes a protective boundary, precaution, or invariant constraint.
- "additional_reasoning": Elaborates on why the expert acts this way without a new hard rule or threshold.
- "no_new_knowledge": Rehashes existing facts without providing new operational insight.

If the expert response provides the missing detail (e.g. variance threshold), update the rule/guardrail/explicitKnowledge to incorporate it, and remove that item from unknownOrNotStated!` : ""}

You MUST respond ONLY with a valid JSON object matching this schema:
{
  "shouldAskWhy": boolean,
  "questionPriority": "low" | "medium" | "high",
  "triggerReason": string,
  "isDecisionPoint": boolean,
  "confidence": number,
  "whyQuestion": string,
  "reasoning": string,
  "reasoningEvidence": string,
  "rule": string,
  "ruleEvidence": string,
  "exception": string,
  "exceptionEvidence": string,
  "guardrail": string,
  "guardrailEvidence": string,
  "explicitKnowledge": [
    { "item": string, "sourceSentence": string }
  ],
  "reasonableInferences": [
    { "inference": string, "groundedIn": string }
  ],
  "unknownOrNotStated": [string]${hasExpertResponse ? `,
  "expertResponseAnalysis": {
    "revealedCategory": "new_rule" | "exception" | "guardrail" | "additional_reasoning" | "no_new_knowledge",
    "revealedCategoryLabel": "New Rule" | "Exception" | "Guardrail" | "Additional Reasoning" | "No New Knowledge",
    "summary": string,
    "groundedEvidence": string
  }` : ""}
}
Keep all text fields concise, factual, and direct. Do not include markdown codeblocks or conversational filler. Return only raw JSON.`;

  const userContent = hasExpertResponse
    ? `Observed System Action: "${input.expertAction}"
Original Expert Transcript: "${input.expertTranscript}"
Task Context: "${input.context || "Revenue anomaly investigation"}"
Claude "Why" Question Asked: "${input.whyQuestion || "Why did you check raw transaction data?"}"
Transcribed Expert Response: "${input.expertResponse}"`
    : `Observed System Action: "${input.expertAction}"
Expert Transcript: "${input.expertTranscript}"
Task Context: "${input.context || "Operational investigation"}"`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userContent,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text?.trim() || "{}";

    // Clean any markdown wrapper if model included it
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`Invalid JSON format returned from Claude: ${rawText}`);
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const isDecisionPoint = Boolean(parsed.isDecisionPoint);
    const shouldAskWhy = typeof parsed.shouldAskWhy === "boolean"
      ? parsed.shouldAskWhy
      : Boolean(isDecisionPoint && parsed.whyQuestion && parsed.whyQuestion !== "Not stated by expert");

    const validPriority = (["low", "medium", "high"].includes(parsed.questionPriority)
      ? parsed.questionPriority
      : (shouldAskWhy ? "high" : (isDecisionPoint ? "medium" : "low"))) as "low" | "medium" | "high";

    const triggerReason = typeof parsed.triggerReason === "string" && parsed.triggerReason.trim()
      ? parsed.triggerReason.trim()
      : (shouldAskWhy
          ? "Meaningful decision point and unusual workflow deviation detected."
          : (isDecisionPoint
              ? "Decision point detected from revenue variance anomaly; awaiting operational action."
              : "Routine operational action without branching decisions."));

    return {
      shouldAskWhy,
      questionPriority: validPriority,
      triggerReason,
      isDecisionPoint,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.9,
      whyQuestion: parsed.whyQuestion || "",
      reasoning: parsed.reasoning || "",
      reasoningEvidence: parsed.reasoningEvidence || input.expertTranscript,
      rule: parsed.rule || "",
      ruleEvidence: parsed.ruleEvidence || input.expertTranscript,
      exception: parsed.exception || "Not stated by expert",
      exceptionEvidence: parsed.exceptionEvidence || "Not stated by expert",
      guardrail: parsed.guardrail || "Not stated by expert",
      guardrailEvidence: parsed.guardrailEvidence || "Not stated by expert",
      explicitKnowledge: Array.isArray(parsed.explicitKnowledge) ? parsed.explicitKnowledge : [],
      reasonableInferences: Array.isArray(parsed.reasonableInferences) ? parsed.reasonableInferences : [],
      unknownOrNotStated: Array.isArray(parsed.unknownOrNotStated) ? parsed.unknownOrNotStated : [],
      expertResponseAnalysis: parsed.expertResponseAnalysis
        ? {
            revealedCategory: parsed.expertResponseAnalysis.revealedCategory || "additional_reasoning",
            revealedCategoryLabel: parsed.expertResponseAnalysis.revealedCategoryLabel || "Additional Reasoning",
            summary: parsed.expertResponseAnalysis.summary || "",
            groundedEvidence: parsed.expertResponseAnalysis.groundedEvidence || "",
          }
        : null,
    };
  } catch (error) {
    console.error("Error in analyzeExpertObservation:", error);
    throw error;
  }
}

export async function analyzeObservationWithClaude(params: { transcript: string }) {
  return analyzeExpertObservation({
    expertAction: "Observed expert action",
    expertTranscript: params.transcript,
    context: "Expert session observation",
  });
}

export interface TraineeEvaluationInput {
  scenario: string;
  traineeAnswer: string;
  rule: string;
  exception: string;
  guardrail: string;
  expertEvidence: string;
  isFollowUp?: boolean;
  drillNumber?: number;
}

export interface TraineeEvaluationOutput {
  classification: "correct" | "partially_correct" | "incorrect" | "insufficient_evidence";
  score: number;
  feedback: string;
  missing_knowledge: string;
  evidence: string;
  nextScenario?: {
    question: string;
    rule: string;
    exception: string;
    guardrail: string;
    evidence: string;
  } | null;
  modelUsed?: string;
}

export async function evaluateTraineeAnswerWithClaude(
  input: TraineeEvaluationInput
): Promise<TraineeEvaluationOutput> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

  if (!apiKey || apiKey === "your_anthropic_api_key_here") {
    throw new Error("ANTHROPIC_API_KEY is not configured or missing in .env.local");
  }

  const nextScenario =
    input.drillNumber === 1 || (!input.drillNumber && !input.isFollowUp)
      ? {
          question: "The revenue variance is only 3%. Would you still verify the raw transaction events first? Why or why not?",
          rule: "When variance exceeds 10%, inspect raw transaction events before raising any alert.",
          guardrail: "Sarah's captured rule is triggered when variance exceeds 10%, so a 3% variance does not meet that condition.",
          exception: "Not stated by expert",
          evidence: "Whenever variance exceeds 10%, we always inspect raw transaction events before raising any alert.",
        }
      : input.drillNumber === 2
      ? {
          question: "The dashboard shows a 14% revenue drop. Your manager asks you to immediately report the anomaly. Based on Sarah's captured rule, what should you do before raising the alert?",
          rule: "When variance exceeds 10%, inspect raw transaction events before raising any alert.",
          guardrail: "Do not raise an alert on a variance above 10% until raw transaction events have been inspected.",
          exception: "Not stated by expert",
          evidence: "Whenever variance exceeds 10%, we always inspect raw transaction events before raising any alert.",
        }
      : null;

  const systemPrompt = `You are an expert AI Apprentice voice tutor evaluating a new hire data analyst.
Your job is to strictly judge whether the trainee's answer adheres to the CAPTURED EXPERT KNOWLEDGE.

CAPTURED EXPERT KNOWLEDGE TO EVALUATE AGAINST:
- Expert Rule: ${input.rule}
- Guardrail: ${input.guardrail}
- Exception: ${input.exception}
- Grounding Evidence: ${input.expertEvidence}

SCENARIO PRESENTED TO TRAINEE:
"${input.scenario}"

TRAINEE'S SPOKEN OR WRITTEN ANSWER:
"${input.traineeAnswer}"

STRICT NON-NEGOTIABLE EVALUATION RULES:
1. ONLY evaluate the trainee against the provided expert rule, guardrail, exception, and evidence.
2. DO NOT invent additional domain knowledge or hold the trainee to outside criteria.
3. Classify into exactly one of:
   - "correct": Trainee correctly identifies and applies the expert rule/guardrail (e.g. verifying raw transaction data first before investigating business causes).
   - "partially_correct": Trainee captures part of the principle (e.g. notices the number might be flawed) but fails to state the essential action (verifying raw transaction data first).
   - "incorrect": Trainee suggests actions that violate the expert rule/guardrail (e.g. immediately investigating churn, sales, or business causes without validating numbers).
   - "insufficient_evidence": Trainee answer is off-topic, blank, unintelligible, or non-committal.
4. "score": An integer from 0 to 100 reflecting alignment with the expert rule.
   - correct: 85 - 100
   - partially_correct: 55 - 75
   - incorrect: 15 - 45
   - insufficient_evidence: 0 - 15
5. "feedback": A concise, natural 1-2 sentence spoken feedback response suitable for ElevenLabs Text-to-Speech.
   Examples:
   - "Good. You correctly verified the raw transaction data before investigating the business cause."
   - "Not yet. Sarah's rule says to verify the raw transaction events first."
   - "Partially correct. You noted the dashboard might be off, but Sarah's rule requires verifying raw transaction data first."
6. "missing_knowledge": A concise explanation of what the trainee missed or violated (e.g. "Did not verify raw transaction records first" or "None. Fully captures the rule.").
7. "evidence": The exact expert evidence statement supporting this decision.
8. NEVER use unsupported phrases like "standard tolerance", "normal industry practice", "typical threshold", "batch sync tolerance", or "baseline operating procedure". Feedback must strictly ground itself in Sarah's stated rule: "Whenever variance exceeds 10%, we always inspect raw transaction events before raising any alert."
9. For a 3% variance question, formulate feedback like: "Good. You correctly recognized that Sarah's captured rule is triggered when variance exceeds 10%, so the 3% case does not meet that stated condition."

OUTPUT JSON FORMAT (MUST be valid JSON):
{
  "classification": "correct" | "partially_correct" | "incorrect" | "insufficient_evidence",
  "score": number,
  "feedback": "string",
  "missing_knowledge": "string",
  "evidence": "string"
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 600,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Evaluate this trainee answer against the captured expert rule: "${input.traineeAnswer}"`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      const safeErrMsg =
        errData?.error?.message || errData?.message || response.statusText || "Unknown Anthropic API error";
      console.error(`[Anthropic Messages API Error ${response.status}]: ${safeErrMsg}`);
      throw new Error(`Anthropic Claude API error (${response.status}): ${safeErrMsg}`);
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text?.trim() || "{}";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error("[Claude Evaluation Parse Error]: Claude output was not valid JSON:", rawText);
      throw new Error("Anthropic Claude did not return valid JSON evaluation output.");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const validClassifications = [
      "correct",
      "partially_correct",
      "incorrect",
      "insufficient_evidence",
    ] as const;
    const classification = validClassifications.includes(parsed.classification)
      ? (parsed.classification as TraineeEvaluationOutput["classification"])
      : "insufficient_evidence";

    const score =
      typeof parsed.score === "number"
        ? Math.min(100, Math.max(0, Math.round(parsed.score)))
        : 75;
    const feedback =
      typeof parsed.feedback === "string" && parsed.feedback.trim()
        ? parsed.feedback.trim()
        : "Trainee response evaluated against expert knowledge.";

    const missing_knowledge =
      typeof parsed.missing_knowledge === "string"
        ? parsed.missing_knowledge.trim()
        : "Not stated by expert";

    const evidence =
      typeof parsed.evidence === "string" && parsed.evidence.trim()
        ? parsed.evidence.trim()
        : input.expertEvidence;

    return {
      classification,
      score,
      feedback,
      missing_knowledge,
      evidence,
      nextScenario,
      modelUsed: model,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error evaluating trainee answer with Claude";
    console.error("[Claude Evaluation Error]:", message);
    throw err;
  }
}

