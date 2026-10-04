"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  Play,
  RotateCcw,
  Sliders,
  Award,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  Lightbulb,
  FileText,
  Workflow,
  GitFork,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  Quote,
  Eye,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/LoadingSkeleton";
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
  traineeAnswer: string; // cleaned displayed answer
  rawTranscript?: string; // original raw audio transcript preserved intact
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
 * Example:
 *   "the I would inspect" -> "I would inspect"
 *   "transition events" -> "transaction events"
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
  // Authoritative captured rule: "When variance exceeds 10%, inspect raw transaction events before raising any alert."
  // For 3% variance, the condition (>10%) is not met, so raw verification is not triggered.
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
  // Authoritative captured rule: 14% variance exceeds 10% threshold, so raw events MUST be inspected before raising any alert.
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
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Active drill progression: 1, 2, 3 (drills) or 4 (completed)
  const [currentDrillNumber, setCurrentDrillNumber] = useState<1 | 2 | 3 | 4>(1);

  // Trainee Input states
  const [traineeAnswer, setTraineeAnswer] = useState("");
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
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* 1. Top Header & Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0B0F17]/95 border border-white/10 shadow-xl backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-white tracking-tight">
              New Hire Voice Training Simulator
            </h1>
            <Badge variant="cyan" dot className="text-[11px] font-mono">
              ElevenLabs Voice Tutor
            </Badge>
            <Badge variant="brand" className="text-[11px] font-mono">
              Claude 3.5 Evaluated
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            Interactive voice drills generated <strong>strictly</strong> from captured expert knowledge:{" "}
            <span className="text-slate-200 font-medium">Sarah Chen (Senior Data Analyst)</span>.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleResetTraining}
            title="Reset training drill"
            className="p-2 rounded-lg bg-black/40 border border-white/10 hover:border-white/20 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <Link href="/work-map">
            <Button variant="secondary" size="sm">
              <GitFork className="w-3.5 h-3.5" />
              <span>View Decision X-Ray</span>
            </Button>
          </Link>
          <Link href="/observe">
            <Button variant="secondary" size="sm" className="hidden sm:inline-flex">
              <Workflow className="w-3.5 h-3.5" />
              <span>Observation Mode</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Top Progress & Status Bar (Requirements 7 & 8) */}
      <div className="p-4 rounded-xl bg-[#0D1321]/90 border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Progress:
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/40 text-xs font-mono font-bold">
              {currentDrillNumber <= 3
                ? `Drill ${currentDrillNumber} of 3`
                : "All Drills Completed (3 of 3)"}
            </span>
          </div>

          {/* Stepper indicators */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            {dynamicScenarios.map((sc, i) => {
              const drillNum = i + 1;
              const isCompleted = trainingHistory.some((t) => t.scenarioNumber === drillNum);
              const isActive = currentDrillNumber === drillNum;

              return (
                <React.Fragment key={sc.id}>
                  {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600" />}
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] flex items-center gap-1 ${
                      isActive
                        ? "bg-brand-500/25 text-brand-300 border border-brand-500/60 font-bold ring-1 ring-brand-500/30"
                        : isCompleted
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {isCompleted && <CheckCircle className="w-3 h-3 text-emerald-400" />}
                    <span>Drill {drillNum}</span>
                  </span>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Average Score:</span>
            <span className="text-base font-bold text-emerald-400 font-mono">
              {trainingHistory.length > 0 ? `${cumulativeScore} / 100` : "--"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Voice Tutor: {voiceStatus === "playing" ? "Speaking..." : "Ready"}</span>
          </div>
        </div>
      </div>

      {currentDrillNumber <= 3 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): Active Scenario & Trainee Input */}
          <div className="lg:col-span-7 space-y-4">
            {/* Active Scenario Card */}
            <Card className="border-white/10 bg-[#0A0E17]/90 shadow-xl">
              <CardHeader className="pb-3 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 text-[10px] font-mono font-bold tracking-wider uppercase border border-brand-500/30">
                      Drill {currentDrillNumber} of 3 • Active
                    </span>
                    <span className="text-xs font-semibold text-slate-300">
                      {activeScenario.title}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Grounded in Work Map
                  </span>
                </div>
                <CardTitle className="text-lg text-white mt-2 leading-snug">
                  &ldquo;{activeScenario.question}&rdquo;
                </CardTitle>
                <CardDescription className="text-xs text-slate-300 mt-1">
                  {activeScenario.context}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                {/* Trainee Answer Input */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-cyan-400" />
                      Your Spoken or Written Answer
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Microphone (scribe_v2) or Text Fallback
                    </span>
                  </div>

                  {/* Microphone Controls */}
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {micStatus === "recording" ? (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={stopRecording}
                          className="animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                        >
                          <MicOff className="w-3.5 h-3.5 mr-1" />
                          <span>Stop &amp; Transcribe</span>
                        </Button>
                      ) : (
                        <Button
                          variant="glow"
                          size="sm"
                          onClick={startRecording}
                          disabled={micStatus === "transcribing" || isSubmitting}
                        >
                          <Mic className="w-3.5 h-3.5 mr-1" />
                          <span>🎙 Record Answer</span>
                        </Button>
                      )}

                      {micStatus === "recording" && (
                        <span className="flex items-center gap-1.5 text-xs font-mono text-rose-400">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                          <span>Recording: {formatTimer(recordingSeconds)}</span>
                        </span>
                      )}

                      {micStatus === "transcribing" && (
                        <span className="flex items-center gap-1.5 text-xs font-mono text-cyan-300 animate-pulse">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Transcribing with ElevenLabs scribe_v2...</span>
                        </span>
                      )}

                      {micStatus === "complete" && (
                        <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Transcribed</span>
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400">
                      Speak clearly into your microphone
                    </div>
                  </div>

                  {micError && (
                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                      {micError}
                    </div>
                  )}

                  {/* Text Fallback Textarea */}
                  <textarea
                    rows={4}
                    value={traineeAnswer}
                    onChange={(e) => setTraineeAnswer(e.target.value)}
                    placeholder={`Provide your answer for Drill ${currentDrillNumber}... Speak or type here.`}
                    className="w-full p-3.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 placeholder:text-slate-500"
                  />

                  {/* Quick Test Demo Fills tailored to current drill */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="text-slate-500 font-mono">Quick test fills:</span>
                    {currentDrillNumber === 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setTraineeAnswer(
                              "I would verify raw transaction events first before raising any alert or investigating business causes, because the variance exceeds 10%."
                            )
                          }
                          className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                        >
                          + Correct: Verify Raw Ledger First
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setTraineeAnswer(
                              "I would immediately call the sales team and churn meetings to find out why customers canceled."
                            )
                          }
                          className="px-2 py-1 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 transition-colors cursor-pointer"
                        >
                          + Incorrect: Jump to Churn Panic
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
                          className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                        >
                          + Correct: 3% does not meet 10% condition
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setTraineeAnswer(
                              "Yes, I would always query raw transaction events for any variance, even if it is only 3%."
                            )
                          }
                          className="px-2 py-1 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 transition-colors cursor-pointer"
                        >
                          + Incorrect: Always query raw data
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
                          className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                        >
                          + Correct: Inspect raw records before alerting
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setTraineeAnswer(
                              "I would immediately report the anomaly and file an incident report to leadership as requested by the manager."
                            )
                          }
                          className="px-2 py-1 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 transition-colors cursor-pointer"
                        >
                          + Incorrect: Immediately alert without raw check
                        </button>
                      </>
                    )}
                  </div>

                  {submitError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                      {submitError}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Evaluating against: {activeScenario.sourceNodeId}
                    </span>
                    <Button
                      variant="glow"
                      size="sm"
                      onClick={handleSubmitAnswer}
                      disabled={!traineeAnswer.trim() || isSubmitting}
                      className="cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                          <span>Evaluating with Claude...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-accent-cyan mr-1.5" />
                          <span>Submit Answer (Drill {currentDrillNumber})</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Knowledge Used Card */}
            <Card className="border-white/10 bg-[#0E1522]/70">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Knowledge Used for Evaluation (Grounded in Work Map)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Zero Hallucination Criterion
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5 pt-1 text-xs text-slate-300">
                <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                  <span className="text-[10px] font-semibold text-brand-300 uppercase block font-mono">
                    Target Rule:
                  </span>
                  <p className="text-slate-100">{activeScenario.rule}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                  <span className="text-[10px] font-semibold text-emerald-300 uppercase block font-mono">
                    Safety Guardrail:
                  </span>
                  <p className="text-slate-200">{activeScenario.guardrail}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 space-y-1">
                  <span className="text-[10px] font-semibold text-emerald-400 uppercase block font-mono">
                    Verbatim Grounding Evidence:
                  </span>
                  <p className="italic text-slate-200">&ldquo;{activeScenario.evidence}&rdquo;</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column (5 cols): AI Evaluation & Spoken Voice Tutor Feedback */}
          <div className="lg:col-span-5 space-y-4">
            {latestEvaluation ? (
              <Card className="border-white/10 bg-[#0E1522]/95 sticky top-6 shadow-2xl">
                <CardHeader className="pb-3 border-b border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-cyan-400" />
                      Latest Evaluation (Drill {currentDrillNumber - 1})
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold font-mono border ${
                        latestEvaluation.classification === "correct"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : latestEvaluation.classification === "partially_correct"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : latestEvaluation.classification === "incorrect"
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {latestEvaluation.classification.toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <CardTitle className="text-base text-white">
                      Score: {latestEvaluation.score} / 100
                    </CardTitle>
                    <span className="text-xs text-slate-400 font-mono">
                      Grounded in Sarah Chen Rule
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-3.5 text-xs">
                  {/* Spoken Voice Tutor Feedback */}
                  <div className="p-4 rounded-xl border border-cyan-500/40 bg-cyan-950/20 shadow-[0_0_20px_rgba(6,182,212,0.1)] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                        <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                        Voice Tutor Spoken Feedback
                      </span>
                      <button
                        type="button"
                        onClick={() => speakVoiceTutorFeedback(latestEvaluation.feedback)}
                        disabled={voiceStatus === "generating" || voiceStatus === "playing"}
                        className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Volume2 className={`w-3 h-3 ${voiceStatus === "playing" ? "animate-pulse" : ""}`} />
                        <span>{voiceStatus === "playing" ? "Speaking..." : "Replay"}</span>
                      </button>
                    </div>

                    <p className="text-sm font-medium text-white leading-relaxed">
                      &ldquo;{latestEvaluation.feedback}&rdquo;
                    </p>

                    <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Synthesized via ElevenLabs Text-to-Speech</span>
                      <span className="text-cyan-400">Sarah Chen Voice Profile</span>
                    </div>
                  </div>

                  {/* Missing Knowledge */}
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block font-mono">
                      Missing Knowledge / Gap:
                    </span>
                    <p className="text-slate-200 leading-relaxed font-medium">
                      {latestEvaluation.missing_knowledge}
                    </p>
                  </div>

                  {/* Grounded Evidence Cited */}
                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                    <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block font-mono">
                      Grounded Expert Evidence:
                    </span>
                    <p className="text-slate-200 italic leading-relaxed">
                      &ldquo;{latestEvaluation.evidence}&rdquo;
                    </p>
                  </div>

                  {/* Advance Notification Card */}
                  <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center gap-2 text-brand-300">
                    <ArrowRight className="w-4 h-4 text-brand-400 shrink-0" />
                    <span>
                      Advancing to <strong>Drill {currentDrillNumber} of 3</strong>: &ldquo;
                      {activeScenario.title}&rdquo;. Submit your answer on the left.
                    </span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-white/10 bg-[#0E1522]/80 sticky top-6 text-center py-12 px-6">
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto text-cyan-400 mb-3">
                  <Bot className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-white">Voice Tutor Awaiting Answer</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Record your answer using the microphone or submit via text. Claude and ElevenLabs will evaluate your adherence to the expert rule.
                </p>
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* Completed Scorecard View */
        <Card className="border-emerald-500/30 bg-[#0A0E17]/95 shadow-2xl p-6 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white tracking-tight">
              All 3 Training Scenarios Completed!
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              You have completed the entire new hire voice training curriculum compiled directly from Sarah Chen&apos;s observation session.
            </p>
          </div>

          <div className="max-w-md mx-auto p-4 rounded-xl bg-black/40 border border-white/10 flex items-center justify-around font-mono">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Total Drills</span>
              <span className="text-xl font-bold text-white">3 / 3</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Average Score</span>
              <span className="text-xl font-bold text-emerald-400">{cumulativeScore} / 100</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Heuristics Mastered</span>
              <span className="text-xl font-bold text-cyan-400">3 Rules</span>
            </div>
          </div>

          {/* Drill Breakdown Log */}
          <div className="max-w-2xl mx-auto text-left space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block font-mono">
              Drill Evaluation Summary:
            </span>

            {trainingHistory.map((turn, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl border border-white/10 bg-[#0E1522]/90 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">
                    Drill {turn.scenarioNumber}: {turn.scenarioTitle}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      turn.evaluation.classification === "correct"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    }`}
                  >
                    {turn.evaluation.score}% • {turn.evaluation.classification}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <p className="text-slate-300 italic">
                    &ldquo;{turn.traineeAnswer}&rdquo;
                  </p>
                  {turn.rawTranscript && turn.rawTranscript !== turn.traineeAnswer && (
                    <p className="text-[10px] text-slate-500 font-mono">
                      Raw transcript: &ldquo;{turn.rawTranscript}&rdquo;
                    </p>
                  )}
                </div>
                <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Feedback: {turn.evaluation.feedback}</span>
                  <button
                    onClick={() => speakVoiceTutorFeedback(turn.evaluation.feedback)}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono text-[10px] cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Play Audio</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="secondary" onClick={handleResetTraining}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              <span>Retry Training Session</span>
            </Button>
            <Link href="/work-map">
              <Button variant="glow">
                <GitFork className="w-3.5 h-3.5 mr-1" />
                <span>Return to AI Work Map</span>
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* 3. Session Log: Drill 1 -> Completed, Drill 2 -> Active (Requirement 7) */}
      {currentDrillNumber <= 3 && (
        <Card className="border-white/10 bg-[#0E1522]/90">
          <CardHeader className="pb-3 border-b border-white/5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 font-mono">
              <FileText className="w-3.5 h-3.5 text-brand-400" />
              Training Session Log ({dynamicScenarios.length} Scenarios)
            </span>
          </CardHeader>
          <CardContent className="space-y-3 pt-3">
            {dynamicScenarios.map((sc) => {
              const drillNum = sc.drillNumber;
              const completedTurn = trainingHistory.find((t) => t.scenarioNumber === drillNum);
              const isCompleted = Boolean(completedTurn);
              const isActive = currentDrillNumber === drillNum;

              return (
                <div
                  key={sc.id}
                  className={`p-3.5 rounded-xl border transition-all text-xs space-y-2 ${
                    isActive
                      ? "bg-brand-500/10 border-brand-500/40 shadow-sm"
                      : isCompleted
                      ? "bg-black/40 border-white/10"
                      : "bg-black/20 border-white/5 text-slate-500"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          isActive
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                            : isCompleted
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-slate-800 text-slate-500"
                        }`}
                      >
                        {isActive
                          ? `Drill ${drillNum} • ACTIVE`
                          : isCompleted
                          ? `Drill ${drillNum} • COMPLETED`
                          : `Drill ${drillNum} • UPCOMING`}
                      </span>
                      <span className="font-semibold text-white">
                        {sc.title}
                      </span>
                    </div>

                    {isCompleted && completedTurn && (
                      <span className="font-mono text-emerald-400 font-bold">
                        Score: {completedTurn.evaluation.score}/100
                      </span>
                    )}

                    {isActive && (
                      <span className="text-[11px] text-cyan-400 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        In Progress
                      </span>
                    )}
                  </div>

                  <p className="text-slate-300 font-medium">
                    &ldquo;{sc.question}&rdquo;
                  </p>

                  {isCompleted && completedTurn && (
                    <div className="space-y-1 pt-1 border-t border-white/5">
                      <div className="text-slate-300">
                        <span className="text-slate-500 font-mono">Your Answer: </span>
                        &ldquo;{completedTurn.traineeAnswer}&rdquo;
                        {completedTurn.rawTranscript && completedTurn.rawTranscript !== completedTurn.traineeAnswer && (
                          <span className="block text-[10px] text-slate-500 font-mono mt-0.5">
                            Raw transcript: &ldquo;{completedTurn.rawTranscript}&rdquo;
                          </span>
                        )}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        <span className="text-cyan-400 font-mono">Feedback: </span>
                        {completedTurn.evaluation.feedback}
                      </div>
                    </div>
                  )}

                  {isActive && (
                    <div className="pt-1 text-[11px] text-slate-400 font-mono">
                      Status: Awaiting trainee answer via microphone or text fallback.
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
