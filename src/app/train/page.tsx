"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Bot,
  RotateCcw,
  Award,
  ChevronRight,
  ShieldCheck,
  Lightbulb,
  FileText,
  Workflow,
  GitFork,
  ArrowRight,
  RefreshCw,
  Quote,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { WaveformVisualizer } from "@/components/ui/WaveformVisualizer";
import { WorkMapSessionData } from "@/lib/session-store";
import { TraineeEvaluationOutput } from "@/lib/anthropic";

interface DrillScenarioItem {
  id: string;
  drillNumber: number;
  title: string;
  question: string;
  context: string;
  rule: string;
  guardrail: string;
  exception: string;
  evidence: string;
  sourceNodeId: string;
}

interface TrainingTurn {
  scenarioNumber: number;
  scenarioTitle: string;
  scenario: string;
  traineeAnswer: string;
  rawTranscript?: string;
  evaluation: TraineeEvaluationOutput;
  timestamp: string;
  knowledgeUsed: {
    rule: string;
    guardrail: string;
    exception: string;
    evidence: string;
  };
}

/**
 * Fixes obvious speech-to-text slips in the trainee's answer before showing it
 * in the final summary and session log, without modifying the raw transcript.
 */
function cleanDisplayedAnswer(text: string): string {
  if (!text) return "";
  let cleaned = text;

  // 1. Common leading stutter / filler artifacts: "the I would" -> "I would"
  cleaned = cleaned.replace(/\bthe\s+I\s+would\b/gi, "I would");
  cleaned = cleaned.replace(/\bthe\s+I\s+will\b/gi, "I will");
  cleaned = cleaned.replace(/\bthe\s+I'd\b/gi, "I'd");
  cleaned = cleaned.replace(/\bthe\s+I\s+think\b/gi, "I think");
  cleaned = cleaned.replace(/\bthe\s+I\s+should\b/gi, "I should");

  // 2. Phonetic misrecognitions: "transition events" -> "transaction events"
  cleaned = cleaned.replace(/\btransition\s+events\b/gi, "transaction events");
  cleaned = cleaned.replace(/\btransition\s+event\b/gi, "transaction event");
  cleaned = cleaned.replace(/\btransitions\s+events\b/gi, "transaction events");
  cleaned = cleaned.replace(/\btransition\s+records\b/gi, "transaction records");
  cleaned = cleaned.replace(/\btransition\s+data\b/gi, "transaction data");
  cleaned = cleaned.replace(/\btransition\s+table\b/gi, "transaction table");
  cleaned = cleaned.replace(/\btransition\s+log\b/gi, "transaction log");
  cleaned = cleaned.replace(/\braw\s+transition\b/gi, "raw transaction");
  cleaned = cleaned.replace(/\braw\s+transitions\b/gi, "raw transactions");
  cleaned = cleaned.replace(/\btrans\s+action\b/gi, "transaction");
  cleaned = cleaned.replace(/\btrans\s+actions\b/gi, "transactions");

  return cleaned.replace(/\s{2,}/g, " ").trim();
}

/**
 * Generates progressive training scenarios dynamically from captured session store knowledge.
 * Adheres strictly to:
 * - Drill 1: 18% revenue anomaly & raw verification rule
 * - Drill 2: 10% threshold condition check (3% variance scenario)
 * - Drill 3: Escalation pressure guardrail (14% variance under immediate reporting request)
 */
function generateDynamicScenarios(session: WorkMapSessionData | null): DrillScenarioItem[] {
  const tree = session?.decisionTree || [];
  const knowledge = session?.knowledgeItems || [];

  // 1. Drill 1: Primary High-Variance Anomaly (Grounded in dt-large-variance-ledger)
  const largeVarNode = tree.find((n) => n.id === "dt-large-variance-ledger");
  const drill1Rule =
    largeVarNode?.rule ||
    knowledge.find((k) => k.category === "new_rule")?.rule ||
    "When variance exceeds 10%, inspect raw transaction events before raising any alert.";
  const drill1Guardrail =
    largeVarNode?.guardrail ||
    "Do not raise an alert on a variance above 10% until raw transaction events have been inspected.";
  const drill1Evidence =
    largeVarNode?.evidence?.replace(/^"+|"+$/g, "").trim() ||
    "Whenever variance exceeds 10%, we always inspect raw transaction events before raising any alert.";

  const drill1: DrillScenarioItem = {
    id: "drill-1-high-variance",
    drillNumber: 1,
    title: "High Variance Anomaly (18%)",
    question: "Revenue dropped 18% week-over-week. What would you do first?",
    context: "Looker Executive Revenue Dashboard reports an unexpected 18% drop in EMEA week-over-week.",
    rule: drill1Rule,
    guardrail: drill1Guardrail,
    exception: largeVarNode?.exception || "Not stated by expert",
    evidence: drill1Evidence,
    sourceNodeId: "dt-large-variance-ledger",
  };

  // 2. Drill 2: 3% Variance Scenario (Grounded strictly in Sarah's captured rule)
  const drill2: DrillScenarioItem = {
    id: "drill-2-low-variance-threshold",
    drillNumber: 2,
    title: "Threshold Condition (3% Variance)",
    question: "The revenue variance is only 3%. Would you still verify the raw transaction events first? Why or why not?",
    context: "A Looker dashboard check shows an APAC revenue variance of 3% week-over-week.",
    rule: drill1Rule,
    guardrail: "Sarah's captured rule is triggered when variance exceeds 10%, so a 3% variance does not meet that condition.",
    exception: "Not stated by expert",
    evidence: drill1Evidence,
    sourceNodeId: "dt-large-variance-ledger",
  };

  // 3. Drill 3: Escalation Pressure Guardrail (Grounded in dt-large-variance-ledger)
  const drill3: DrillScenarioItem = {
    id: "drill-3-escalation-guardrail",
    drillNumber: 3,
    title: "Escalation Pressure (14% Variance)",
    question: "The dashboard shows a 14% revenue drop. Your manager asks you to immediately report the anomaly. Based on Sarah's captured rule, what should you do before raising the alert?",
    context: "A dashboard notification indicates a 14% revenue drop. Management requests an immediate incident report.",
    rule: drill1Rule,
    guardrail: drill1Guardrail,
    exception: "Not stated by expert",
    evidence: drill1Evidence,
    sourceNodeId: "dt-large-variance-ledger",
  };

  return [drill1, drill2, drill3];
}

export default function TrainPage() {
  // Session data from Work Map
  const [sessionData, setSessionData] = useState<WorkMapSessionData | null>(null);
  const [, setIsLoadingSession] = useState(true);

  // Active drill progression: 1, 2, 3 (drills) or 4 (completed)
  const [currentDrillNumber, setCurrentDrillNumber] = useState<1 | 2 | 3 | 4>(1);

  // Trainee Input states
  const [traineeAnswer, setTraineeAnswer] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Microphone / STT states
  const [micStatus, setMicStatus] = useState<"idle" | "recording" | "transcribing" | "complete" | "error">("idle");
  const [micError, setMicError] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Voice Tutor / TTS states
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "generating" | "playing" | "error">("idle");

  // Latest Evaluation & Training Turn History
  const [latestEvaluation, setLatestEvaluation] = useState<TraineeEvaluationOutput | null>(null);
  const [trainingHistory, setTrainingHistory] = useState<TrainingTurn[]>([]);

  // Refs for audio handling
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Fetch real Work Map session data
  const fetchSession = async () => {
    try {
      setIsLoadingSession(true);
      const res = await fetch("/api/work-map/session");
      if (res.ok) {
        const data: WorkMapSessionData = await res.json();
        setSessionData(data);
      }
    } catch (err) {
      console.error("Failed to load work map session:", err);
    } finally {
      setIsLoadingSession(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  // Generate dynamic scenarios strictly from session knowledge
  const dynamicScenarios = useMemo(() => {
    return generateDynamicScenarios(sessionData);
  }, [sessionData]);

  // Current active scenario item (1, 2, or 3)
  const activeScenario = useMemo(() => {
    const idx = Math.min(Math.max(currentDrillNumber - 1, 0), 2);
    return dynamicScenarios[idx] || dynamicScenarios[0];
  }, [dynamicScenarios, currentDrillNumber]);

  // Audio Playback with ElevenLabs TTS
  const speakVoiceTutorFeedback = async (feedbackText: string) => {
    if (!feedbackText || !feedbackText.trim()) return;

    try {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }

      setVoiceStatus("generating");

      const res = await fetch("/api/voice/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: feedbackText }),
      });

      if (!res.ok) {
        throw new Error("Failed to synthesize feedback speech with ElevenLabs");
      }

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioPlayerRef.current = audio;

      audio.onplay = () => setVoiceStatus("playing");
      audio.onended = () => {
        setVoiceStatus("idle");
        URL.revokeObjectURL(audioUrl);
        audioPlayerRef.current = null;
      };
      audio.onerror = () => {
        setVoiceStatus("error");
        URL.revokeObjectURL(audioUrl);
        audioPlayerRef.current = null;
      };

      await audio.play();
    } catch (err) {
      console.error("Voice tutor playback error:", err);
      setVoiceStatus("error");
    }
  };

  // Microphone Recording using MediaRecorder
  const startRecording = async () => {
    setMicError(null);
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone API is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let options: MediaRecorderOptions | undefined = undefined;
      if (typeof MediaRecorder !== "undefined" && typeof MediaRecorder.isTypeSupported === "function") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          options = { mimeType: "audio/webm;codecs=opus" };
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
          options = { mimeType: "audio/webm" };
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          options = { mimeType: "audio/mp4" };
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (recordTimerRef.current) {
          clearInterval(recordTimerRef.current);
          recordTimerRef.current = null;
        }

        const mime = mediaRecorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mime });

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        if (audioBlob.size === 0) {
          setMicStatus("error");
          setMicError("No audio was recorded. Please try again.");
          return;
        }

        setMicStatus("transcribing");

        try {
          const extension = mime.includes("mp4") ? "mp4" : "webm";
          const formData = new FormData();
          formData.append("file", audioBlob, `trainee-answer.${extension}`);

          const res = await fetch("/api/voice/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Failed to transcribe audio with ElevenLabs scribe_v2");
          }

          const data = await res.json();
          setTraineeAnswer(data.text || "");
          setMicStatus("complete");
        } catch (err: any) {
          console.error("Transcription error:", err);
          setMicError(err.message || "Failed to transcribe audio");
          setMicStatus("error");
        }
      };

      mediaRecorder.start(250);
      setMicStatus("recording");
      setRecordingSeconds(0);

      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Microphone recording error:", err);
      setMicError(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Microphone access was denied. Please allow microphone permissions."
          : err.message || "Could not access microphone."
      );
      setMicStatus("error");
    }
  };

  const stopRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  // Submit Answer to Claude for strict expert rule evaluation & advance drill progression
  const handleSubmitAnswer = async () => {
    if (!traineeAnswer.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const drillNumberBeingEvaluated = currentDrillNumber;
    const scenarioBeingEvaluated = activeScenario;

    try {
      const res = await fetch("/api/train/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: scenarioBeingEvaluated.question,
          traineeAnswer: traineeAnswer.trim(),
          rule: scenarioBeingEvaluated.rule,
          exception: scenarioBeingEvaluated.exception,
          guardrail: scenarioBeingEvaluated.guardrail,
          expertEvidence: scenarioBeingEvaluated.evidence,
          drillNumber: drillNumberBeingEvaluated,
          isFollowUp: drillNumberBeingEvaluated > 1,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to evaluate trainee response with Claude");
      }

      const evaluation: TraineeEvaluationOutput = await res.json();

      const rawTranscript = traineeAnswer.trim();
      const cleanedAnswer = cleanDisplayedAnswer(rawTranscript);

      // 1. Record completed turn in training history
      const completedTurn: TrainingTurn = {
        scenarioNumber: drillNumberBeingEvaluated,
        scenarioTitle: scenarioBeingEvaluated.title,
        scenario: scenarioBeingEvaluated.question,
        traineeAnswer: cleanedAnswer,
        rawTranscript: rawTranscript,
        evaluation,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        knowledgeUsed: {
          rule: scenarioBeingEvaluated.rule,
          guardrail: scenarioBeingEvaluated.guardrail,
          exception: scenarioBeingEvaluated.exception,
          evidence: scenarioBeingEvaluated.evidence,
        },
      };

      setTrainingHistory((prev) => [...prev, completedTurn]);
      setLatestEvaluation(evaluation);

      // 2. Play ElevenLabs spoken feedback automatically
      speakVoiceTutorFeedback(evaluation.feedback);

      // 3. Reset trainee input & mic state for the new drill
      setTraineeAnswer("");
      setMicStatus("idle");
      setMicError(null);

      // 4. Progress to the next drill!
      if (drillNumberBeingEvaluated < 3) {
        setCurrentDrillNumber((prev) => (prev + 1) as 1 | 2 | 3);
      } else {
        setCurrentDrillNumber(4); // All 3 drills completed
      }
    } catch (err: any) {
      console.error("Evaluation error:", err);
      setSubmitError(err.message || "Evaluation failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset drill session
  const handleResetTraining = () => {
    setCurrentDrillNumber(1);
    setTraineeAnswer("");
    setLatestEvaluation(null);
    setTrainingHistory([]);
    setMicStatus("idle");
    setSubmitError(null);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    setVoiceStatus("idle");
  };

  // Calculate cumulative score
  const cumulativeScore = useMemo(() => {
    if (trainingHistory.length === 0) return 0;
    const total = trainingHistory.reduce((sum, item) => sum + item.evaluation.score, 0);
    return Math.round(total / trainingHistory.length);
  }, [trainingHistory]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 pb-16 bg-grid-pattern -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-screen text-[#EEEFF2] relative">
      {/* ═══════════════════════════════════════════════════════════════
          1. TRAIN HEADER
          ═══════════════════════════════════════════════════════════════ */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08] animate-fade-in-up">
        <div className="space-y-1">
          <div className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-[#646977]">
            REVENUE ANOMALY · MODULE 1
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#EEEFF2] tracking-tight">
            New Hire Voice Training
          </h1>
          <p className="text-xs text-[#9297A5]">
            Learner · New Hire <span className="text-[#646977]">•</span> Interactive drills compiled from{" "}
            <strong>{sessionData?.expert || "Sarah Chen"}</strong>&apos;s observation session
          </p>
        </div>

        {/* Right side: 3-segment progress indicator & reset */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 p-2.5 px-3.5 rounded-xl bg-[#181A1F] border border-white/[0.08]">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-[10px] font-mono">
                <span className="text-[#646977] uppercase tracking-wider">Progress</span>
                <span className="text-[#EEEFF2] font-semibold">
                  {currentDrillNumber <= 3 ? `${currentDrillNumber} / 3` : "3 / 3"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map((num) => {
                  const isCompleted = trainingHistory.some((t) => t.scenarioNumber === num);
                  const isActive = currentDrillNumber === num;
                  return (
                    <div
                      key={num}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        isCompleted
                          ? "w-8 bg-[#34D399]"
                          : isActive
                          ? "w-8 bg-[#38BDF8] shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                          : "w-6 bg-[#1F2127] border border-white/[0.08]"
                      }`}
                      title={`Drill ${num}: ${isCompleted ? "Completed" : isActive ? "Active" : "Upcoming"}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <button
            onClick={handleResetTraining}
            title="Reset training session"
            className="p-2.5 rounded-xl bg-[#181A1F] border border-white/[0.08] hover:bg-[#292B34] text-[#9297A5] hover:text-[#EEEFF2] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
          2. MAIN PRACTICE STUDIO (DESKTOP: 2-COLUMNS, MOBILE: ORDERED)
          ═══════════════════════════════════════════════════════════════ */}
      {currentDrillNumber <= 3 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in-up">
          {/* ────────────────────────────────────────────────────────
              LEFT COLUMN — SCENARIO & INPUT STUDIO (~1.3fr / 7 cols)
              ──────────────────────────────────────────────────────── */}
          <div className="lg:col-span-7 space-y-5">
            {/* Scenario Card */}
            <div className="p-6 rounded-2xl bg-[#181A1F] border border-white/[0.08] shadow-xl space-y-4">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30">
                    SCENARIO {currentDrillNumber}
                  </span>
                  <span className="text-[11px] font-mono text-[#9297A5]">
                    Voice drill
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#646977]">
                  Target: {activeScenario.sourceNodeId}
                </span>
              </div>

              {/* Strongest Visual Element: Real Training Question */}
              <div className="space-y-2">
                <h2 className="text-lg sm:text-xl font-medium text-[#EEEFF2] leading-snug">
                  &ldquo;{activeScenario.question}&rdquo;
                </h2>
                <p className="text-xs text-[#9297A5] leading-relaxed">
                  {activeScenario.context}
                </p>
              </div>

              {/* ────────────────────────────────────────────────────
                  MICROPHONE INTERACTION STUDIO
                  ──────────────────────────────────────────────────── */}
              <div className="pt-4 border-t border-white/[0.08] flex flex-col items-center justify-center space-y-4">
                {/* Centered ~112px Microphone Orb */}
                <div className="relative flex items-center justify-center">
                  {/* Subtle animated recording ring */}
                  {micStatus === "recording" && (
                    <>
                      <div className="absolute -inset-3 rounded-full border border-[#EF4444]/60 animate-ping pointer-events-none" />
                      <div className="absolute -inset-1.5 rounded-full border border-[#EF4444]/40 animate-pulse pointer-events-none" />
                    </>
                  )}

                  <button
                    type="button"
                    onClick={micStatus === "recording" ? stopRecording : startRecording}
                    disabled={micStatus === "transcribing" || isSubmitting}
                    aria-label={micStatus === "recording" ? "Stop recording" : "Record answer"}
                    className={`w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-200 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#38BDF8] ${
                      micStatus === "recording"
                        ? "bg-[#EF4444]/20 border-2 border-[#EF4444] text-[#EF4444] shadow-[0_0_35px_rgba(239,68,68,0.4)] scale-105"
                        : micStatus === "transcribing"
                        ? "bg-[#38BDF8]/15 border-2 border-[#38BDF8]/60 text-[#38BDF8] animate-pulse"
                        : micStatus === "complete"
                        ? "bg-[#34D399]/15 border-2 border-[#34D399]/60 text-[#34D399]"
                        : "bg-[#1F2127] border-2 border-white/[0.08] text-[#EEEFF2] hover:border-[#38BDF8]/40 hover:bg-[#292B34] hover:shadow-[0_0_20px_rgba(56,189,248,0.2)]"
                    }`}
                  >
                    {micStatus === "recording" ? (
                      <>
                        <MicOff className="w-8 h-8 text-[#EF4444] mb-1" />
                        <span className="text-[10px] font-mono font-bold text-[#EF4444]">
                          {formatTimer(recordingSeconds)}
                        </span>
                      </>
                    ) : micStatus === "transcribing" ? (
                      <>
                        <RefreshCw className="w-8 h-8 text-[#38BDF8] animate-spin mb-1" />
                        <span className="text-[9.5px] font-mono font-semibold">STT...</span>
                      </>
                    ) : micStatus === "complete" ? (
                      <>
                        <CheckCircle2 className="w-8 h-8 text-[#34D399] mb-1" />
                        <span className="text-[9.5px] font-mono font-semibold text-[#34D399]">Done</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-8 h-8 text-[#38BDF8] mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-[9.5px] font-mono uppercase tracking-wider text-[#9297A5]">
                          Record
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {/* State Text & Waveform */}
                <div className="w-full flex flex-col items-center space-y-2">
                  <span className="text-xs font-mono font-semibold tracking-wide">
                    {micStatus === "recording" && (
                      <span className="text-[#EF4444] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
                        Listening... ({formatTimer(recordingSeconds)})
                      </span>
                    )}
                    {micStatus === "transcribing" && (
                      <span className="text-[#38BDF8] flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Transcribing with ElevenLabs scribe_v2...
                      </span>
                    )}
                    {micStatus === "complete" && (
                      <span className="text-[#34D399] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Transcription Complete • Ready to Analyze
                      </span>
                    )}
                    {micStatus === "idle" && (
                      <span className="text-[#9297A5]">
                        Click microphone to answer with voice
                      </span>
                    )}
                    {micStatus === "error" && (
                      <span className="text-[#EF4444] flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Recording Error • Click to Retry
                      </span>
                    )}
                  </span>

                  {/* Waveform Visualizer */}
                  <div className="w-full max-w-xs">
                    <WaveformVisualizer
                      isActive={micStatus === "recording"}
                      color={micStatus === "recording" ? "cyan" : "brand"}
                      barCount={28}
                      className="h-10 bg-[#131417] border-white/[0.06]"
                    />
                  </div>
                </div>

                {micError && (
                  <div className="w-full p-2.5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs text-center">
                    {micError}
                  </div>
                )}
              </div>

              {/* ────────────────────────────────────────────────────
                  EXPERT RESPONSE (TRAINEE ANSWER) & SUBMISSION
                  ──────────────────────────────────────────────────── */}
              <div className="pt-4 border-t border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#646977] font-semibold">
                    YOUR ANSWER / EXPERT RESPONSE
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowTextInput((prev) => !prev)}
                    className="text-[11px] font-mono text-[#38BDF8] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Answer with Text</span>
                    {showTextInput ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {/* Text Fallback Textarea */}
                {showTextInput && (
                  <div className="space-y-2 animate-fade-in-up">
                    <textarea
                      rows={3}
                      value={traineeAnswer}
                      onChange={(e) => setTraineeAnswer(e.target.value)}
                      placeholder={`Type your spoken response for Drill ${currentDrillNumber}...`}
                      className="w-full p-3.5 rounded-xl bg-[#131417] border border-white/[0.08] text-[#EEEFF2] text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#38BDF8] focus:border-[#38BDF8] placeholder:text-[#646977]"
                    />
                  </div>
                )}

                {/* Displayed Trainee Transcription / Answer */}
                {traineeAnswer && !showTextInput && (
                  <div className="p-3.5 rounded-xl bg-[#131417] border border-white/[0.08] space-y-1.5 animate-fade-in-up">
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#646977]">
                      <span>Captured Response</span>
                      <button
                        onClick={() => setTraineeAnswer("")}
                        className="text-[#EF4444] hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                    <p className="text-xs text-[#EEEFF2] font-medium leading-relaxed italic">
                      &ldquo;{traineeAnswer}&rdquo;
                    </p>
                  </div>
                )}

                {/* Quick Test Demo Fills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10.5px]">
                  <span className="text-[#646977] font-mono text-[10px]">Test fills:</span>
                  {currentDrillNumber === 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setTraineeAnswer(
                            "I would verify raw transaction events first before raising any alert or investigating business causes, because the variance exceeds 10%."
                          )
                        }
                        className="px-2 py-0.5 rounded bg-[#34D399]/10 text-[#34D399] border border-[#34D399]/30 hover:bg-[#34D399]/20 transition-colors cursor-pointer"
                      >
                        + Correct: Raw Ledger Check
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setTraineeAnswer(
                            "I would immediately call the sales team and churn meetings to find out why customers canceled."
                          )
                        }
                        className="px-2 py-0.5 rounded bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 hover:bg-[#EF4444]/20 transition-colors cursor-pointer"
                      >
                        + Incorrect: Churn Panic
                      </button>
                    </>
                  )}

                  {currentDrillNumber === 2 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setTraineeAnswer(
                            "No, I would not query raw transaction events. Sarah's captured rule is only triggered when variance exceeds 10%, so a 3% variance does not meet that condition."
                          )
                        }
                        className="px-2 py-0.5 rounded bg-[#34D399]/10 text-[#34D399] border border-[#34D399]/30 hover:bg-[#34D399]/20 transition-colors cursor-pointer"
                      >
                        + Correct: 3% Does Not Meet 10%
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setTraineeAnswer(
                            "Yes, I would always query raw transaction events for any variance, even if it is only 3%."
                          )
                        }
                        className="px-2 py-0.5 rounded bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 hover:bg-[#EF4444]/20 transition-colors cursor-pointer"
                      >
                        + Incorrect: Always Query
                      </button>
                    </>
                  )}

                  {currentDrillNumber === 3 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setTraineeAnswer(
                            "Even though my manager asked for an immediate report, a 14% drop exceeds the 10% threshold. Sarah's captured rule and guardrail strictly require inspecting raw transaction events first before raising any alert."
                          )
                        }
                        className="px-2 py-0.5 rounded bg-[#34D399]/10 text-[#34D399] border border-[#34D399]/30 hover:bg-[#34D399]/20 transition-colors cursor-pointer"
                      >
                        + Correct: Guardrail Adherence
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setTraineeAnswer(
                            "I would immediately report the anomaly and file an incident report to leadership as requested by the manager."
                          )
                        }
                        className="px-2 py-0.5 rounded bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 hover:bg-[#EF4444]/20 transition-colors cursor-pointer"
                      >
                        + Incorrect: Alert Prematurely
                      </button>
                    </>
                  )}
                </div>

                {submitError && (
                  <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs">
                    {submitError}
                  </div>
                )}

                {/* Primary Ivory Submit Button */}
                <div className="pt-2 flex items-center justify-between gap-3">
                  <span className="text-[10px] font-mono text-[#646977]">
                    Claude 3.5 Sonnet Grounded Evaluator
                  </span>

                  <button
                    type="button"
                    onClick={handleSubmitAnswer}
                    disabled={!traineeAnswer.trim() || isSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F5EFE6] text-[#16171B] hover:bg-white text-xs font-semibold shadow-md transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Evaluating with Claude...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-[#16171B]" />
                        <span>Analyze / Submit Answer</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────
              RIGHT COLUMN — EVALUATION, EVIDENCE & VOICE TUTOR (~1fr / 5 cols)
              ──────────────────────────────────────────────────────── */}
          <div className="lg:col-span-5 space-y-5">
            {/* 1. AI EVALUATION CARD */}
            {latestEvaluation ? (
              <div className="p-5 rounded-2xl bg-[#181A1F] border border-white/[0.08] shadow-2xl space-y-4 animate-fade-in-up">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-[#38BDF8]" />
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#38BDF8]">
                      AI Evaluation
                    </span>
                  </div>

                  {/* Classification Badge */}
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                      latestEvaluation.classification === "correct"
                        ? "bg-[#34D399]/15 text-[#34D399] border-[#34D399]/30"
                        : latestEvaluation.classification === "partially_correct"
                        ? "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30"
                        : latestEvaluation.classification === "incorrect"
                        ? "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30"
                        : "bg-[#1F2127] text-[#9297A5] border-white/[0.08]"
                    }`}
                  >
                    {latestEvaluation.classification.replace("_", " ")}
                  </span>
                </div>

                {/* Score & Status */}
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl sm:text-4xl font-mono font-bold text-[#EEEFF2]">
                      {latestEvaluation.score}
                    </span>
                    <span className="text-sm font-mono text-[#646977] ml-1">/ 100</span>
                  </div>
                  <span className="text-[10.5px] font-mono text-[#646977]">
                    Grounded in captured expert knowledge
                  </span>
                </div>

                {/* Feedback */}
                <div className="p-3.5 rounded-xl bg-[#1F2127] border border-white/[0.08] space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#9297A5] block">
                    Feedback
                  </span>
                  <p className="text-xs text-[#EEEFF2] leading-relaxed">
                    {latestEvaluation.feedback}
                  </p>
                </div>

                {/* Missing Knowledge if applicable */}
                {latestEvaluation.missing_knowledge &&
                  !latestEvaluation.missing_knowledge.toLowerCase().includes("none") && (
                    <div className="p-3 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 space-y-1 text-xs">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#F59E0B] block font-semibold">
                        Knowledge Gap
                      </span>
                      <p className="text-[#EEEFF2] leading-relaxed">
                        {latestEvaluation.missing_knowledge}
                      </p>
                    </div>
                  )}

                {/* Advance notification banner */}
                <div className="p-3 rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/20 flex items-center gap-2 text-xs text-[#38BDF8]">
                  <ArrowRight className="w-4 h-4 shrink-0" />
                  <span>
                    Advancing to <strong>Drill {currentDrillNumber} of 3</strong>: &ldquo;{activeScenario.title}&rdquo;
                  </span>
                </div>
              </div>
            ) : (
              /* Idle state dashed panel */
              <div className="p-8 rounded-2xl border border-dashed border-white/[0.12] bg-[#181A1F]/50 text-center space-y-2">
                <Bot className="w-7 h-7 text-[#646977] mx-auto" />
                <h3 className="text-xs font-semibold text-[#EEEFF2]">
                  Evaluation Awaiting Response
                </h3>
                <p className="text-xs text-[#9297A5] max-w-xs mx-auto">
                  Your evaluation will appear here after you answer.
                </p>
              </div>
            )}

            {/* 2. VOICE TUTOR CARD */}
            <div className="p-5 rounded-2xl bg-[#181A1F] border border-white/[0.08] shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#38BDF8]" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#38BDF8]">
                    Voice Tutor
                  </span>
                </div>

                {latestEvaluation && (
                  <button
                    type="button"
                    onClick={() => speakVoiceTutorFeedback(latestEvaluation.feedback)}
                    disabled={voiceStatus === "generating" || voiceStatus === "playing"}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[#38BDF8] hover:bg-[#38BDF8]/25 text-xs font-mono font-semibold cursor-pointer transition-colors"
                  >
                    <Volume2 className={voiceStatus === "playing" ? "w-3 h-3 animate-pulse" : "w-3 h-3"} />
                    <span>{voiceStatus === "playing" ? "Speaking..." : "Replay"}</span>
                  </button>
                )}
              </div>

              <p className="text-xs text-[#9297A5] leading-relaxed italic">
                {latestEvaluation
                  ? `"${latestEvaluation.feedback}"`
                  : "Voice Tutor will provide spoken feedback using Sarah Chen's voice model once an answer is submitted."}
              </p>

              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-[#646977]">
                <span>ElevenLabs TTS Profile</span>
                <span className="text-[#38BDF8]">Sarah Chen</span>
              </div>
            </div>

            {/* 3. EXPERT EVIDENCE CARD (Lilac Accent #C084FC) */}
            <div className="p-5 rounded-2xl border border-[#C084FC]/30 bg-gradient-to-br from-[#C084FC]/10 via-[#181A1F] to-[#1F2127] shadow-[0_0_25px_rgba(192,132,252,0.1)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Quote className="w-3.5 h-3.5 text-[#C084FC]" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#C084FC]">
                    EXPERT EVIDENCE
                  </span>
                </div>
                <span className="px-1.5 py-0.2 rounded bg-[#34D399]/15 text-[#34D399] text-[9px] font-mono font-bold border border-[#34D399]/30">
                  EXPLICIT
                </span>
              </div>

              <blockquote className="text-xs sm:text-sm font-medium text-[#EEEFF2] italic tracking-wide leading-relaxed pl-3 border-l-2 border-[#C084FC]">
                &quot;{activeScenario.evidence}&quot;
              </blockquote>

              <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono text-[#9297A5]">
                <span>Speaker: <strong>Sarah Chen</strong></span>
                <span className="text-[#C084FC]">05:18 · Grounded Observation</span>
              </div>
            </div>

            {/* 4. KNOWLEDGE USED CARD */}
            <div className="p-5 rounded-2xl bg-[#181A1F] border border-white/[0.08] shadow-xl space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#34D399]">
                    KNOWLEDGE USED
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#646977]">
                  Work Map Heuristics
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-[#1F2127] border border-white/[0.06] space-y-1">
                  <span className="text-[10px] font-mono font-semibold uppercase text-[#38BDF8] flex items-center gap-1">
                    <Lightbulb className="w-3 h-3 text-[#38BDF8]" />
                    Target Rule:
                  </span>
                  <p className="text-[#EEEFF2] leading-relaxed">
                    {activeScenario.rule}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#1F2127] border border-white/[0.06] space-y-1">
                  <span className="text-[10px] font-mono font-semibold uppercase text-[#34D399] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#34D399]" />
                    Safety Guardrail:
                  </span>
                  <p className="text-[#9297A5] leading-relaxed">
                    {activeScenario.guardrail}
                  </p>
                </div>

                {activeScenario.exception && activeScenario.exception !== "Not stated by expert" && (
                  <div className="p-3 rounded-xl bg-[#1F2127] border border-white/[0.06] space-y-1">
                    <span className="text-[10px] font-mono font-semibold uppercase text-[#F59E0B] flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-[#F59E0B]" />
                      Exception:
                    </span>
                    <p className="text-[#9297A5] leading-relaxed">
                      {activeScenario.exception}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ═════════════════════════════════════════════════════════════
           COMPLETED SCORECARD VIEW (ALL 3 DRILLS FINISHED)
           ═════════════════════════════════════════════════════════════ */
        <div className="p-8 rounded-2xl bg-[#181A1F] border border-white/[0.08] shadow-2xl text-center space-y-6 max-w-3xl mx-auto animate-fade-in-up">
          <div className="w-16 h-16 rounded-full bg-[#34D399]/15 border border-[#34D399]/30 flex items-center justify-center mx-auto text-[#34D399]">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-[#EEEFF2] tracking-tight">
              All 3 Training Scenarios Completed!
            </h2>
            <p className="text-xs text-[#9297A5] max-w-md mx-auto">
              You have completed the entire new hire voice training curriculum compiled directly from Sarah Chen&apos;s observation session.
            </p>
          </div>

          {/* Metric Pills */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-[#131417] border border-white/[0.08] font-mono">
            <div>
              <span className="text-[10px] text-[#646977] uppercase block">Total Drills</span>
              <span className="text-xl font-bold text-[#EEEFF2]">3 / 3</span>
            </div>
            <div>
              <span className="text-[10px] text-[#646977] uppercase block">Average Score</span>
              <span className="text-xl font-bold text-[#34D399]">{cumulativeScore} / 100</span>
            </div>
            <div>
              <span className="text-[10px] text-[#646977] uppercase block">Heuristics Mastered</span>
              <span className="text-xl font-bold text-[#38BDF8]">3 Rules</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleResetTraining}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1F2127] border border-white/[0.08] hover:bg-[#292B34] text-xs font-medium text-[#EEEFF2] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-[#9297A5]" />
              <span>Retry Training Session</span>
            </button>
            <Link href="/work-map">
              <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F5EFE6] text-[#16171B] hover:bg-white text-xs font-semibold shadow-md transition-all cursor-pointer">
                <GitFork className="w-4 h-4 text-[#16171B]" />
                <span>Return to Expert Work Map</span>
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          3. CLEAN TRAINING SESSION LOG
          ═══════════════════════════════════════════════════════════════ */}
      <div className="p-5 rounded-2xl bg-[#181A1F] border border-white/[0.08] shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#38BDF8]" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#EEEFF2]">
              Training Session Log ({dynamicScenarios.length} Scenarios)
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#646977]">
            Sarah Chen Heuristic Validation
          </span>
        </div>

        <div className="space-y-3">
          {dynamicScenarios.map((sc) => {
            const drillNum = sc.drillNumber;
            const completedTurn = trainingHistory.find((t) => t.scenarioNumber === drillNum);
            const isCompleted = Boolean(completedTurn);
            const isActive = currentDrillNumber === drillNum;

            return (
              <div
                key={sc.id}
                className={`p-4 rounded-xl border transition-all text-xs space-y-2.5 ${
                  isActive
                    ? "bg-[#292B34] border-[#38BDF8]/40 shadow-sm"
                    : isCompleted
                    ? "bg-[#181A1F] border-white/[0.08]"
                    : "bg-[#131417] border-white/[0.04] text-[#646977]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        isActive
                          ? "bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30"
                          : isCompleted
                          ? "bg-[#34D399]/15 text-[#34D399] border border-[#34D399]/30"
                          : "bg-[#1F2127] text-[#646977]"
                      }`}
                    >
                      {isActive
                        ? `Drill ${drillNum} • ACTIVE`
                        : isCompleted
                        ? `Drill ${drillNum} • COMPLETED`
                        : `Drill ${drillNum} • UPCOMING`}
                    </span>
                    <span className="font-semibold text-[#EEEFF2]">
                      {sc.title}
                    </span>
                  </div>

                  {isCompleted && completedTurn && (
                    <span className="font-mono text-[#34D399] font-bold">
                      Score: {completedTurn.evaluation.score} / 100
                    </span>
                  )}

                  {isActive && (
                    <span className="text-[11px] text-[#38BDF8] font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-pulse" />
                      In Progress
                    </span>
                  )}
                </div>

                <p className="text-[#9297A5] font-medium leading-relaxed">
                  &ldquo;{sc.question}&rdquo;
                </p>

                {isCompleted && completedTurn && (
                  <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
                    <div className="text-[#EEEFF2]">
                      <span className="text-[#646977] font-mono text-[10px] uppercase">Your Answer: </span>
                      &ldquo;{completedTurn.traineeAnswer}&rdquo;
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#9297A5]">
                      <span>
                        <strong className="text-[#38BDF8] font-mono">Feedback: </strong>
                        {completedTurn.evaluation.feedback}
                      </span>
                      <button
                        onClick={() => speakVoiceTutorFeedback(completedTurn.evaluation.feedback)}
                        className="text-[#38BDF8] hover:text-white flex items-center gap-1 font-mono text-[10.5px] cursor-pointer"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Replay Audio</span>
                      </button>
                    </div>
                  </div>
                )}

                {isActive && (
                  <div className="pt-1 text-[11px] text-[#646977] font-mono">
                    Status: Awaiting trainee answer via microphone or text fallback.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
