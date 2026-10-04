"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Eye,
  Radio,
  Square,
  Play,
  Pause,
  BookmarkPlus,
  Sparkles,
  Layers,
  Terminal,
  Cpu,
  Monitor,
  Volume2,
  CheckCircle2,
  ArrowRight,
  Filter,
  ShieldAlert,
  HelpCircle,
  AlertCircle,
  ShieldCheck,
  Loader2,
  Mic,
  RotateCcw,
  ChevronRight,
  Database,
  BarChart3,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { WaveformVisualizer } from "@/components/ui/WaveformVisualizer";
import {
  MOCK_LIVE_TRANSCRIPT,
  MOCK_LIVE_HEURISTICS,
  LiveTranscriptItem,
  HeuristicItem,
} from "@/lib/mock-data";

interface GroundedKnowledgeItem {
  item: string;
  sourceSentence: string;
}

interface GroundedInferenceItem {
  inference: string;
  groundedIn: string;
}

interface ExpertResponseAnalysis {
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

interface ClaudeAnalysis {
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

interface ScenarioEvent {
  id: string;
  shortLabel: string;
  name: string;
  action: string;
  transcript: string;
  context: string;
}

const SCENARIO_EVENTS: ScenarioEvent[] = [
  {
    id: "event-open-dash",
    shortLabel: "1. Open Dash",
    name: "Opening Dashboard (Looker)",
    action: "Opened Executive Revenue Dashboard in Looker",
    transcript: "Starting my morning review by opening the Looker revenue overview dashboard.",
    context: "Revenue anomaly investigation - routine morning review",
  },
  {
    id: "event-notice-drop",
    shortLabel: "2. 18% Drop",
    name: "Seeing 18% Drop",
    action: "Noticed an unexpected 18% drop in weekly recurring revenue on the overview chart.",
    transcript:
      "Wait, that's strange. The revenue graph shows an 18% drop this week compared to baseline. I'm not going to start checking churn logs or asking marketing if a campaign failed yet.",
    context: "Revenue anomaly investigation",
  },
  {
    id: "event-open-raw",
    shortLabel: "3. Open Raw SQL",
    name: "Opening Raw SQL (Decision Point)",
    action: "Opened raw transaction data after seeing an 18% revenue drop.",
    transcript:
      "I don't trust the dashboard number when the variance is this large, so I verify the raw transactions first.",
    context: "Revenue anomaly investigation",
  },
];

interface TimelineStep {
  id: string;
  timeSec: number;
  timeFormatted: string;
  title: string;
  description: string;
  targetApp: string;
  aiStatus: AiObserverStatus;
  screenFocus: "Looker" | "Snowflake";
  events: LiveTranscriptItem[];
}

const TIMELINE_STEPS: TimelineStep[] = [
  {
    id: "step-0",
    timeSec: 0,
    timeFormatted: "00:00",
    title: "Open Dashboard",
    description: "Sarah opens the Looker Executive Revenue Dashboard for morning review.",
    targetApp: "Looker",
    aiStatus: "Observing",
    screenFocus: "Looker",
    events: [
      {
        id: "evt-step-1-open-dash",
        timestamp: "00:00:00",
        speaker: "System",
        content: "Opened Executive Revenue Dashboard (Looker / Stripe Ingestion Pipeline)",
        type: "action",
        metadata: { targetApp: "Looker", actionType: "view_dashboard" },
      },
    ],
  },
  {
    id: "step-1",
    timeSec: 4,
    timeFormatted: "00:04",
    title: "18% Drop Detected",
    description: "Sarah spots an unexpected 18% weekly revenue variance in EMEA.",
    targetApp: "Looker",
    aiStatus: "Decision detected",
    screenFocus: "Looker",
    events: [
      {
        id: "evt-step-2-notice-drop",
        timestamp: "00:00:04",
        speaker: "Expert",
        content:
          "I'm looking at our headline numbers. There is an 18% revenue drop showing in EMEA week-over-week.",
        type: "speech",
      },
    ],
  },
  {
    id: "step-2",
    timeSec: 8,
    timeFormatted: "00:08",
    title: "Suppress Premature Inquiry",
    description: "Expert decides not to speculate on business or marketing causes yet.",
    targetApp: "Looker",
    aiStatus: "Decision detected",
    screenFocus: "Looker",
    events: [
      {
        id: "evt-step-3-hold-business",
        timestamp: "00:00:08",
        speaker: "Expert",
        content:
          "I'm not going to start checking churn logs or asking marketing if a campaign failed yet.",
        type: "speech",
        metadata: { actionType: "suppress_premature_action" },
      },
    ],
  },
  {
    id: "step-3",
    timeSec: 12,
    timeFormatted: "00:12",
    title: "Open Raw SQL",
    description:
      "Bypasses aggregated dashboard to audit raw transaction events directly in Snowflake.",
    targetApp: "Snowflake",
    aiStatus: "Decision detected",
    screenFocus: "Snowflake",
    events: [
      {
        id: "evt-step-4-open-raw",
        timestamp: "00:00:12",
        speaker: "System",
        content:
          "Switched active window to Snowflake SQL Editor: Querying raw_events.stripe_transactions directly",
        type: "action",
        metadata: { targetApp: "Snowflake", actionType: "source_data_query" },
      },
      {
        id: "evt-step-5-explain-why",
        timestamp: "00:00:12",
        speaker: "Expert",
        content:
          "I don't trust the dashboard number when the variance is this large, so I verify the raw transactions first.",
        type: "speech",
      },
    ],
  },
  {
    id: "step-4",
    timeSec: 13,
    timeFormatted: "00:13",
    title: "Claude Evaluates Nuance",
    description: "AI evaluates deviation, formulates probe question, and updates tribal heuristics.",
    targetApp: "AI Apprentice",
    aiStatus: "Why question ready",
    screenFocus: "Snowflake",
    events: [],
  },
];

type AiObserverStatus = "Observing" | "Decision detected" | "Why question ready";

export default function ObservePage() {
  const [isRecording, setIsRecording] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(314); // 05:14
  const [heuristics, setHeuristics] = useState<HeuristicItem[]>(MOCK_LIVE_HEURISTICS);
  const [transcript, setTranscript] = useState<LiveTranscriptItem[]>(MOCK_LIVE_TRANSCRIPT);

  const [aiObserverStatus, setAiObserverStatus] = useState<AiObserverStatus>("Observing");
  const [selectedEventId, setSelectedEventId] = useState<string>("event-open-raw");

  const [simState, setSimState] = useState<"idle" | "running" | "paused" | "completed">("idle");
  const [simSeconds, setSimSeconds] = useState(0);
  const [currentTimelineStepIndex, setCurrentTimelineStepIndex] = useState(-1);
  const [activeScreenFocus, setActiveScreenFocus] = useState<"Looker" | "Snowflake">("Looker");
  const analyzedStepRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [liveAnalysis, setLiveAnalysis] = useState<ClaudeAnalysis | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "generating" | "playing" | "error">(
    "idle"
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [micStatus, setMicStatus] = useState<
    "ready" | "recording" | "transcribing" | "complete" | "error"
  >("ready");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [expertResponse, setExpertResponse] = useState<string>("");
  const [micError, setMicError] = useState<string | null>(null);
  const [isAnalyzingResponse, setIsAnalyzingResponse] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const handleSpeakWhyQuestion = async () => {
    if (!liveAnalysis?.whyQuestion) return;
    if (voiceStatus === "generating" || voiceStatus === "playing") return;

    setVoiceStatus("generating");

    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const res = await fetch("/api/voice/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: liveAnalysis.whyQuestion }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate speech");
      }

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setVoiceStatus("playing");
      };

      audio.onended = () => {
        setVoiceStatus("idle");
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setVoiceStatus("error");
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      await audio.play();
    } catch (err) {
      console.error("Voice synthesis failed:", err);
      setVoiceStatus("error");
    }
  };

  const startRecording = async () => {
    setMicError(null);
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone API (getUserMedia) is not supported in this browser");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let options: MediaRecorderOptions | undefined = undefined;
      if (
        typeof MediaRecorder !== "undefined" &&
        typeof MediaRecorder.isTypeSupported === "function"
      ) {
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
          formData.append("file", audioBlob, `expert-response.${extension}`);

          const res = await fetch("/api/voice/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Failed to transcribe audio with ElevenLabs");
          }

          const data = await res.json();
          setExpertResponse(data.text || "");
          setMicStatus("complete");
        } catch (err: any) {
          console.error("Transcription error:", err);
          setMicError(err.message || "Failed to transcribe voice response");
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
          ? "Microphone access was denied. Please allow microphone permissions in your browser."
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

  const handleResetRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setMicStatus("ready");
    setExpertResponse("");
    setMicError(null);
    setRecordingSeconds(0);
  };

  const handleAnalyzeExpertResponse = async () => {
    if (!liveAnalysis || !expertResponse || isAnalyzingResponse) return;
    setIsAnalyzingResponse(true);
    setAnalysisError(null);

    const payload = {
      expertAction: "Opened raw transaction data after seeing an 18% revenue drop.",
      expertTranscript:
        "I don't trust the dashboard number when the variance is this large, so I verify the raw transactions first.",
      context: "Revenue anomaly investigation",
      whyQuestion: liveAnalysis.whyQuestion,
      expertResponse: expertResponse,
    };

    try {
      const res = await fetch("/api/observe/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.details || err.error || "Failed to analyze expert response");
      }

      const data: ClaudeAnalysis = await res.json();
      setLiveAnalysis(data);

      if (data.shouldAskWhy) {
        setAiObserverStatus("Why question ready");
      } else if (data.isDecisionPoint) {
        setAiObserverStatus("Decision detected");
      } else {
        setAiObserverStatus("Observing");
      }

      const STABLE_HEURISTIC_ID = "h-claude-rule-revenue-verification";
      const now = formatTimer(timerSeconds);

      setHeuristics((prev) => {
        const updatedHeuristic: HeuristicItem = {
          id: STABLE_HEURISTIC_ID,
          title: data.expertResponseAnalysis
            ? `Grounded: ${data.expertResponseAnalysis.revealedCategoryLabel}`
            : "Source Verification on Large Variance",
          category: "Mental Model",
          description: data.rule,
          detectedAt: now,
          confidence: Math.round(data.confidence * 100),
        };

        const existingIdx = prev.findIndex((h) => h.id === STABLE_HEURISTIC_ID);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = updatedHeuristic;
          return updated;
        }
        return [updatedHeuristic, ...prev];
      });
    } catch (err: any) {
      console.error("Error analyzing expert response:", err);
      setAnalysisError(err.message || "Failed to analyze expert response with Claude");
    } finally {
      setIsAnalyzingResponse(false);
    }
  };

  const handleAddQuickHeuristic = () => {
    const PIN_ID = "h-manual-quick-pin";
    setHeuristics((prev) => {
      if (prev.some((h) => h.id === PIN_ID)) return prev;
      return [
        {
          id: PIN_ID,
          title: "Manual Expert Bookmark",
          category: "Shortcut",
          description: "Operator flagged this step as a critical nuance during variance checks.",
          detectedAt: formatTimer(timerSeconds),
          confidence: 99,
        },
        ...prev,
      ];
    });
  };

  const handleAnalyzeObservation = async (overrideEvent?: ScenarioEvent) => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalysisError(null);

    const event =
      overrideEvent ||
      SCENARIO_EVENTS.find((e) => e.id === selectedEventId) ||
      SCENARIO_EVENTS[2];

    const payload = {
      expertAction: event.action,
      expertTranscript: event.transcript,
      context: event.context,
    };

    try {
      const res = await fetch("/api/observe/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.details || err.error || "Failed to analyze observation");
      }

      const data: ClaudeAnalysis = await res.json();
      setLiveAnalysis(data);

      if (data.shouldAskWhy) {
        setAiObserverStatus("Why question ready");
      } else if (data.isDecisionPoint) {
        setAiObserverStatus("Decision detected");
      } else {
        setAiObserverStatus("Observing");
      }

      const now = formatTimer(timerSeconds);
      const STABLE_AI_EVENT_ID = `evt-ai-analysis-${event.id}`;
      const STABLE_HEURISTIC_ID = `h-claude-rule-${event.id}`;

      setTranscript((prev) => {
        const aiItem: LiveTranscriptItem = {
          id: STABLE_AI_EVENT_ID,
          timestamp: now,
          speaker: "AI Apprentice",
          content: data.shouldAskWhy
            ? `Decision Point Flagged (${Math.round(data.confidence * 100)}% Conf): Probe generated on "${event.name}"`
            : data.isDecisionPoint
            ? `Decision Detected (${Math.round(data.confidence * 100)}% Conf): ${data.rule || "Anomaly observed, awaiting action."}`
            : `Routine Action Logged: ${event.name} (${data.triggerReason})`,
          type: data.isDecisionPoint ? "decision" : "action",
          metadata: {
            confidence: Math.round(data.confidence * 100),
            actionType: "rule_extraction",
          },
        };

        const existingIdx = prev.findIndex((item) => item.id === STABLE_AI_EVENT_ID);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = aiItem;
          return updated;
        }
        return [...prev, aiItem];
      });

      if (data.rule && data.rule !== "Not stated by expert") {
        setHeuristics((prev) => {
          const newHeuristic: HeuristicItem = {
            id: STABLE_HEURISTIC_ID,
            title: data.isDecisionPoint
              ? "Source Verification on Large Variance"
              : "Operational Observation",
            category: "Mental Model",
            description: data.rule,
            detectedAt: now,
            confidence: Math.round(data.confidence * 100),
          };

          const existingIdx = prev.findIndex((h) => h.id === STABLE_HEURISTIC_ID);
          if (existingIdx >= 0) {
            const updated = [...prev];
            updated[existingIdx] = newHeuristic;
            return updated;
          }
          return [newHeuristic, ...prev];
        });
      }
    } catch (err: any) {
      console.error("Analysis error:", err);
      setAnalysisError(err.message || "Failed to connect to Anthropic Claude");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Automatic Simulation Clock (1s ticks up to 13s)
  useEffect(() => {
    if (simState !== "running") return;

    const interval = setInterval(() => {
      setSimSeconds((prev) => {
        if (prev >= 13) {
          clearInterval(interval);
          return 13;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [simState]);

  // Automatic Chronological Simulation Flow: 0s, 4s, 8s, 12s, 13s
  useEffect(() => {
    if (simState !== "running") return;

    if (simSeconds === 0) {
      setCurrentTimelineStepIndex(0);
      setAiObserverStatus("Observing");
      setActiveScreenFocus("Looker");
      setTranscript(TIMELINE_STEPS[0].events);
    } else if (simSeconds === 4) {
      setCurrentTimelineStepIndex(1);
      setAiObserverStatus("Decision detected");
      setTranscript((prev) => {
        if (prev.some((e) => e.id === TIMELINE_STEPS[1].events[0].id)) return prev;
        return [...prev, ...TIMELINE_STEPS[1].events];
      });
    } else if (simSeconds === 8) {
      setCurrentTimelineStepIndex(2);
      setAiObserverStatus("Decision detected");
      setTranscript((prev) => {
        if (prev.some((e) => e.id === TIMELINE_STEPS[2].events[0].id)) return prev;
        return [...prev, ...TIMELINE_STEPS[2].events];
      });
    } else if (simSeconds === 12) {
      setCurrentTimelineStepIndex(3);
      setAiObserverStatus("Decision detected");
      setActiveScreenFocus("Snowflake");
      setTranscript((prev) => {
        if (prev.some((e) => e.id === TIMELINE_STEPS[3].events[0].id)) return prev;
        return [...prev, ...TIMELINE_STEPS[3].events];
      });
    } else if (simSeconds >= 13) {
      setCurrentTimelineStepIndex(4);
      if (!analyzedStepRef.current) {
        analyzedStepRef.current = true;
        handleAnalyzeObservation(SCENARIO_EVENTS[2]).then(() => {
          setSimState("completed");
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simSeconds, simState]);

  const handleStartObservation = () => {
    analyzedStepRef.current = false;
    setTranscript(TIMELINE_STEPS[0].events);
    setHeuristics([]);
    setLiveAnalysis(null);
    setSimSeconds(0);
    setCurrentTimelineStepIndex(0);
    setAiObserverStatus("Observing");
    setActiveScreenFocus("Looker");
    setVoiceStatus("idle");
    setMicStatus("ready");
    setExpertResponse("");
    setSimState("running");
  };

  const handlePauseObservation = () => {
    setSimState("paused");
  };

  const handleResumeObservation = () => {
    setSimState("running");
  };

  const handleResetObservation = () => {
    analyzedStepRef.current = false;
    setSimState("idle");
    setSimSeconds(0);
    setCurrentTimelineStepIndex(-1);
    setAiObserverStatus("Observing");
    setActiveScreenFocus("Looker");
    setTranscript(MOCK_LIVE_TRANSCRIPT);
    setHeuristics(MOCK_LIVE_HEURISTICS);
    setLiveAnalysis(null);
    setVoiceStatus("idle");
    setMicStatus("ready");
    setExpertResponse("");
  };

  return (
    <div className="space-y-6 pb-12 bg-grid-pattern -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 min-h-full">
      {/* OBSERVE HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/[0.08] animate-fade-in-up">
        <div className="space-y-1">
          <div className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-[#646977]">
            REVENUE ANOMALY INVESTIGATION
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#EEEFF2] tracking-tight">
            Expert Observation
          </h1>
          <div className="text-xs text-[#9297A5]">
            Sarah Chen <span className="text-[#646977]">•</span> Senior Data Analyst
          </div>
        </div>

        {/* Right side: Session State, Timer, and Primary Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Recording / Session indicator */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#181A1F] border border-white/[0.08] font-mono text-xs text-[#EEEFF2]">
            <span
              className={`w-2 h-2 rounded-full ${
                simState === "running"
                  ? "bg-[#EF4444] animate-pulse"
                  : isRecording
                  ? "bg-[#34D399] animate-pulse"
                  : "bg-[#646977]"
              }`}
            />
            <span className="text-[#9297A5]">
              {simState === "running" || simState === "paused" || simState === "completed"
                ? `${formatTimer(simSeconds)} / 00:13`
                : formatTimer(timerSeconds)}
            </span>
          </div>

          {/* Primary Simulation Controls */}
          {simState === "idle" && (
            <button
              onClick={handleStartObservation}
              className="bg-[#F5EFE6] text-[#16171B] hover:bg-[#F5EFE6]/90 font-medium px-4 py-1.5 rounded-lg text-xs transition-all duration-200 flex items-center gap-1.5 shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Observation</span>
            </button>
          )}

          {simState === "running" && (
            <button
              onClick={handlePauseObservation}
              className="bg-[#1F2127] text-[#EEEFF2] hover:bg-[#292B34] border border-white/[0.08] font-medium px-4 py-1.5 rounded-lg text-xs transition-all duration-200 flex items-center gap-1.5"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          )}

          {simState === "paused" && (
            <button
              onClick={handleResumeObservation}
              className="bg-[#F5EFE6] text-[#16171B] hover:bg-[#F5EFE6]/90 font-medium px-4 py-1.5 rounded-lg text-xs transition-all duration-200 flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume</span>
            </button>
          )}

          {simState === "completed" && (
            <button
              onClick={handleStartObservation}
              className="bg-[#F5EFE6] text-[#16171B] hover:bg-[#F5EFE6]/90 font-medium px-4 py-1.5 rounded-lg text-xs transition-all duration-200 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Replay Session</span>
            </button>
          )}

          {simState !== "idle" && (
            <button
              onClick={handleResetObservation}
              className="bg-[#1F2127] text-[#9297A5] hover:text-[#EEEFF2] hover:bg-[#292B34] border border-white/[0.08] px-3 py-1.5 rounded-lg text-xs transition-all duration-200 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          {/* Quick Scenario Jump Pills for Testing */}
          <div className="hidden sm:inline-flex items-center gap-1 p-0.5 rounded-lg bg-[#181A1F] border border-white/[0.08] ml-1">
            {SCENARIO_EVENTS.map((event) => (
              <button
                key={event.id}
                onClick={() => {
                  setSelectedEventId(event.id);
                  handleAnalyzeObservation(event);
                }}
                className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                  selectedEventId === event.id
                    ? "bg-[#292B34] text-[#EEEFF2] font-semibold"
                    : "text-[#9297A5] hover:text-[#EEEFF2]"
                }`}
                title={event.name}
              >
                {event.shortLabel}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* CONTINUOUS TIMELINE STEPPER RAIL */}
      <div className="bg-[#181A1F] border border-white/[0.08] rounded-xl p-3 sm:p-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10.5px] font-mono text-[#646977] uppercase tracking-[0.12em]">
              TIMELINE SEQUENCE
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                simState === "running"
                  ? "bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/20 animate-pulse"
                  : simState === "completed"
                  ? "bg-[#34D399]/10 text-[#34D399] border-[#34D399]/20"
                  : "bg-white/[0.02] text-[#9297A5] border-white/[0.08]"
              }`}
            >
              {simState === "running"
                ? `Running (${simSeconds}s)`
                : simState === "completed"
                ? "Completed"
                : "Idle"}
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#646977] hidden sm:inline">
            0s Looker &rarr; 4s Anomaly &rarr; 8s Hold &rarr; 12s SQL &rarr; 13s AI Synthesis
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {TIMELINE_STEPS.map((step, idx) => {
            const isPast =
              (simSeconds > step.timeSec && simState !== "idle") ||
              (simState === "completed" && idx <= 4);
            const isCurrent = currentTimelineStepIndex === idx && simState === "running";

            return (
              <div
                key={step.id}
                className={`p-2.5 rounded-lg border transition-all duration-200 text-xs ${
                  isCurrent
                    ? "bg-[#292B34] border-[#38BDF8]/60 shadow-[0_0_12px_rgba(56,189,248,0.15)] ring-1 ring-[#38BDF8]/40"
                    : isPast
                    ? "bg-[#1F2127]/60 border-[#34D399]/30 text-[#EEEFF2]"
                    : "bg-[#181A1F] border-white/[0.05] opacity-60 text-[#646977]"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span
                    className={
                      isCurrent
                        ? "text-[#38BDF8] font-bold"
                        : isPast
                        ? "text-[#34D399]"
                        : "text-[#646977]"
                    }
                  >
                    {step.timeFormatted}
                  </span>
                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-ping" />
                  )}
                  {isPast && !isCurrent && (
                    <CheckCircle2 className="w-3 h-3 text-[#34D399]" />
                  )}
                </div>
                <div
                  className={`font-medium truncate text-[12.5px] mt-0.5 ${
                    isCurrent ? "text-white" : isPast ? "text-[#EEEFF2]" : "text-[#9297A5]"
                  }`}
                >
                  {step.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN LAYOUT: 3-COLUMN ASYMMETRIC WORKSPACE (Desktop: 280px left / fluid center / 340px right) */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* COLUMN 1 — ACTIVITY STREAM (~280px desktop, stacked on mobile) */}
        <section
          aria-label="Activity Stream"
          className="w-full lg:w-[280px] lg:flex-shrink-0 bg-[#181A1F] border border-white/[0.08] rounded-[10px] p-4 flex flex-col justify-between order-3 lg:order-1"
        >
          <div className="space-y-3.5">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <span className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-[#646977]">
                ACTIVITY STREAM
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-[#34D399] bg-[#34D399]/10 border border-[#34D399]/20 px-1.5 py-0.2 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
                LIVE
              </span>
            </div>

            {/* Vertical timeline rail */}
            <div className="relative border-l border-white/[0.08] ml-2 pl-3.5 space-y-4 max-h-[580px] overflow-y-auto pr-1">
              {transcript.map((item) => {
                const isDecision = item.type === "decision";
                const isHeuristic = item.type === "heuristic";

                return (
                  <div key={item.id} className="relative group text-xs space-y-1">
                    {/* Event Dot on rail */}
                    <span
                      className={`absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full border border-[#181A1F] ${
                        isDecision
                          ? "bg-[#F59E0B] ring-2 ring-[#F59E0B]/30"
                          : isHeuristic
                          ? "bg-[#38BDF8] ring-2 ring-[#38BDF8]/30"
                          : "bg-[#646977]"
                      }`}
                    />

                    <div className="flex items-center justify-between text-[10.5px] font-mono text-[#646977]">
                      <span className="text-[#9297A5] font-semibold">{item.speaker}</span>
                      <span>{item.timestamp}</span>
                    </div>

                    <p className="text-[12.5px] text-[#EEEFF2] leading-snug">
                      {item.content}
                    </p>

                    {item.metadata?.confidence && (
                      <div className="text-[10.5px] font-mono text-[#38BDF8]">
                        {item.metadata.confidence}% confidence
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-white/[0.05] flex items-center justify-between text-[11px] font-mono text-[#646977]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-pulse" />
              Listening for next action…
            </span>
          </div>
        </section>

        {/* COLUMN 2 — OBSERVED EXPERT WORKSPACE (Fluid center) */}
        <section
          aria-label="Observed Expert Workspace"
          className="w-full lg:flex-1 min-w-0 bg-[#181A1F] border border-white/[0.08] rounded-[10px] overflow-hidden flex flex-col order-2 lg:order-2"
        >
          {/* Chrome frame top bar */}
          <div className="h-10 px-4 bg-[#1F2127] border-b border-white/[0.08] flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#34D399]/80 inline-block" />
              </div>
              <span className="text-xs font-mono text-[#9297A5] ml-2">
                Observed Workspace
              </span>
            </div>

            {/* Simulated Tabs: Looker / SQL Console */}
            <div className="flex items-center gap-1 p-0.5 rounded-md bg-[#131417] border border-white/[0.05]">
              <button
                onClick={() => setActiveScreenFocus("Looker")}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  activeScreenFocus === "Looker"
                    ? "bg-[#292B34] text-[#EEEFF2] shadow-sm"
                    : "text-[#9297A5] hover:text-[#EEEFF2]"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Looker</span>
              </button>
              <button
                onClick={() => setActiveScreenFocus("Snowflake")}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  activeScreenFocus === "Snowflake"
                    ? "bg-[#292B34] text-[#EEEFF2] shadow-sm"
                    : "text-[#9297A5] hover:text-[#EEEFF2]"
                }`}
              >
                <Database className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>SQL Console</span>
              </button>
            </div>
          </div>

          {/* Workspace Body with 28px coordinate grid texture */}
          <div className="p-5 space-y-4 bg-grid-pattern min-h-[380px] flex flex-col justify-between">
            {activeScreenFocus === "Looker" ? (
              /* Looker Simulated Surface */
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-[#9297A5] font-mono border-b border-white/[0.05] pb-2">
                  <span>Looker / EMEA Recurring Revenue Executive Overview</span>
                  <span className="text-[#34D399]">Data Freshness: 06:00 UTC Batch</span>
                </div>

                {/* Simulated Revenue KPI Tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-lg bg-[#1F2127] border border-white/[0.08] space-y-1">
                    <span className="text-xs text-[#9297A5]">Global Weekly ARR</span>
                    <div className="font-mono text-xl font-semibold text-[#EEEFF2]">$8.42M</div>
                    <span className="text-[10.5px] font-mono text-[#34D399]">+2.4% WoW</span>
                  </div>

                  {/* Anomaly Highlighting Card */}
                  <div
                    className={`p-3.5 rounded-lg border transition-all duration-300 space-y-1 ${
                      simSeconds >= 4
                        ? "bg-[#EF4444]/10 border-[#EF4444]/40 shadow-lg shadow-[#EF4444]/10 ring-1 ring-[#EF4444]/30"
                        : "bg-[#1F2127] border-white/[0.08]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#9297A5]">EMEA Weekly ARR</span>
                      {simSeconds >= 4 && (
                        <span className="text-[10px] font-mono uppercase bg-[#EF4444]/20 text-[#EF4444] px-1.5 py-0.2 rounded border border-[#EF4444]/30 animate-pulse">
                          ANOMALY
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-xl font-semibold text-[#EEEFF2]">$1.16M</div>
                    <span className="text-[10.5px] font-mono text-[#EF4444] font-semibold">
                      -18.2% WoW ($1.42M &rarr; $1.16M)
                    </span>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#1F2127] border border-white/[0.08] space-y-1">
                    <span className="text-xs text-[#9297A5]">US Weekly ARR</span>
                    <div className="font-mono text-xl font-semibold text-[#EEEFF2]">$5.84M</div>
                    <span className="text-[10.5px] font-mono text-[#34D399]">+3.1% WoW</span>
                  </div>
                </div>

                {/* Anomaly Callout Box */}
                <div className="p-3.5 rounded-lg bg-[#1F2127]/80 border border-white/[0.08] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#EEEFF2] flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-[#F59E0B]" />
                      Observed Expert Behavior:
                    </span>
                    <span className="font-mono text-[10.5px] text-[#38BDF8]">
                      Timestamp 05:14
                    </span>
                  </div>
                  <p className="text-xs text-[#9297A5] leading-relaxed">
                    Sarah detected the 18% discrepancy on the EMEA overview chart. Rather than
                    submitting an immediate executive alert or querying marketing churn, she holds
                    inquiry and opens Snowflake to inspect raw transaction events.
                  </p>
                </div>
              </div>
            ) : (
              /* Snowflake SQL Console Surface */
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-[#9297A5] font-mono border-b border-white/[0.05] pb-2">
                  <span>Snowflake / raw_events.stripe_transactions</span>
                  <span className="text-[#38BDF8]">Direct Pipeline Query</span>
                </div>

                <div className="p-4 rounded-lg bg-[#131417] border border-white/[0.08] font-mono text-xs text-[#38BDF8] space-y-1">
                  <p className="text-[#646977]">-- Sarah Chen: Direct Raw Ledger Audit</p>
                  <p className="text-[#EEEFF2]">SELECT date_trunc(&apos;day&apos;, created_at) AS date,</p>
                  <p className="text-[#EEEFF2]">
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;sum(amount)/100 AS gross_revenue_usd,
                    count(*) AS settled_count
                  </p>
                  <p className="text-[#EEEFF2]">
                    FROM raw_events.stripe_transactions WHERE status = &apos;succeeded&apos;
                  </p>
                  <p className="text-[#EEEFF2]">GROUP BY 1 ORDER BY 1 DESC LIMIT 7;</p>
                </div>

                <div className="p-3.5 rounded-lg bg-[#1F2127]/80 border border-white/[0.08] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#34D399]">
                      ✓ Raw Ledger Returned 1,842 Transactions
                    </span>
                    <span className="font-mono text-[10.5px] text-[#9297A5]">Duration: 412ms</span>
                  </div>
                  <p className="text-[12px] text-[#9297A5]">
                    Raw transaction count confirms settled payments match expected baseline.
                    The 18% discrepancy was caused by an upstream Looker dashboard batch lag,
                    validating Sarah&apos;s heuristic: &quot;Always inspect raw transaction events before
                    raising any alert.&quot;
                  </p>
                </div>
              </div>
            )}

            {/* Audio Waveform Stream at Bottom of Workspace */}
            <div className="pt-3 border-t border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-[#9297A5]">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-[#38BDF8]" />
                  Microphone Input: Sennheiser Profile (Active)
                </span>
                <span className="text-[#34D399] font-mono text-[10.5px]">AI Intent Tracking</span>
              </div>
              <WaveformVisualizer
                isActive={simState === "running" || isRecording}
                color="brand"
              />
            </div>
          </div>
        </section>

        {/* COLUMN 3 — AI OBSERVER (~340px desktop, top priority on mobile) */}
        <section
          aria-label="AI Observer Panel"
          className="w-full lg:w-[340px] lg:flex-shrink-0 bg-[#181A1F] border border-white/[0.08] rounded-[10px] p-4 sm:p-5 flex flex-col justify-between order-1 lg:order-3 space-y-4"
        >
          <div className="space-y-4">
            {/* Header with 3-step state indicator */}
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
                <h2 className="text-[15px] font-semibold text-[#EEEFF2] tracking-tight">
                  AI Observer
                </h2>
              </div>

              {/* 3-Step State Indicator */}
              <div className="flex items-center gap-1">
                <span
                  title="Step 1: Observing"
                  className={`w-2 h-2 rounded-full ${
                    aiObserverStatus === "Observing"
                      ? "bg-[#38BDF8] ring-2 ring-[#38BDF8]/40"
                      : "bg-[#34D399]"
                  }`}
                />
                <span className="w-3 h-[1px] bg-white/[0.1]" />
                <span
                  title="Step 2: Decision Detected"
                  className={`w-2 h-2 rounded-full ${
                    aiObserverStatus === "Decision detected"
                      ? "bg-[#F59E0B] ring-2 ring-[#F59E0B]/40 animate-pulse"
                      : aiObserverStatus === "Why question ready"
                      ? "bg-[#34D399]"
                      : "bg-[#646977]"
                  }`}
                />
                <span className="w-3 h-[1px] bg-white/[0.1]" />
                <span
                  title="Step 3: Why Question Ready"
                  className={`w-2 h-2 rounded-full ${
                    aiObserverStatus === "Why question ready"
                      ? "bg-[#38BDF8] ring-2 ring-[#38BDF8]/40 animate-pulse"
                      : "bg-[#646977]"
                  }`}
                />
              </div>
            </div>

            {/* STATE 0: Observing (No question) */}
            {aiObserverStatus === "Observing" && (
              <div className="p-3.5 rounded-lg bg-[#1F2127] border border-white/[0.08] space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#38BDF8]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-pulse" />
                  <span>Passively Observing Expert</span>
                </div>
                <p className="text-xs text-[#9297A5] leading-relaxed">
                  AI Apprentice is actively monitoring Sarah&apos;s cursor movements, tool switches, and
                  audio stream. When an unwritten heuristic or decision pivot occurs, the observer
                  flags it.
                </p>
              </div>
            )}

            {/* STATE 1: Decision Detected (Amber highlighted card) */}
            {aiObserverStatus === "Decision detected" && (
              <div className="p-3.5 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 space-y-2 animate-fade-in-up">
                <div className="flex items-center gap-2 text-[11px] font-mono font-semibold text-[#F59E0B] uppercase tracking-wider">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>AI DETECTED A DECISION POINT</span>
                </div>
                <p className="text-xs text-[#EEEFF2] leading-relaxed font-medium">
                  {liveAnalysis?.triggerReason ||
                    "Sarah observed an 18% revenue discrepancy and bypassed executive churn escalation to query raw transaction events directly in Snowflake."}
                </p>
                <div className="text-[10.5px] font-mono text-[#9297A5] pt-1">
                  Synthesizing probe question with Claude...
                </div>
              </div>
            )}

            {/* STATE 2: Why Question Ready (High-emphasis question card) */}
            {aiObserverStatus === "Why question ready" && liveAnalysis?.whyQuestion && (
              <div className="p-4 rounded-xl bg-[#1F2127] border border-[#38BDF8]/40 space-y-3.5 shadow-lg shadow-[#38BDF8]/5 animate-fade-in-up">
                <div className="flex items-center justify-between pb-1 border-b border-white/[0.05]">
                  <span className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-[#38BDF8] font-semibold">
                    TARGETED WHY QUESTION
                  </span>
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                      liveAnalysis.questionPriority === "high"
                        ? "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20"
                        : "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20"
                    }`}
                  >
                    {liveAnalysis.questionPriority} priority
                  </span>
                </div>

                <p className="text-[14.5px] font-semibold text-[#EEEFF2] leading-snug">
                  &quot;{liveAnalysis.whyQuestion}&quot;
                </p>

                {/* Primary Ivory CTA: Ask the Expert (TTS) & Secondary: Answer (Mic) */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSpeakWhyQuestion}
                    disabled={voiceStatus === "generating" || voiceStatus === "playing"}
                    className="flex-1 bg-[#F5EFE6] text-[#16171B] hover:bg-[#F5EFE6]/90 font-medium py-2 px-3 rounded-lg text-xs transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {voiceStatus === "generating" ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Speaking...</span>
                      </>
                    ) : voiceStatus === "playing" ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5 animate-bounce text-[#16171B]" />
                        <span>Playing Voice</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Ask the Expert</span>
                      </>
                    )}
                  </button>

                  {(micStatus === "ready" || micStatus === "complete") && (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="bg-[#1F2127] text-[#EEEFF2] hover:bg-[#292B34] border border-white/[0.08] font-medium py-2 px-3 rounded-lg text-xs transition-all duration-200 flex items-center gap-1.5"
                    >
                      <Mic className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span>🎙 Answer</span>
                    </button>
                  )}

                  {micStatus === "recording" && (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="bg-[#EF4444] text-white hover:bg-[#EF4444]/90 font-medium py-2 px-3 rounded-lg text-xs transition-all duration-200 flex items-center gap-1.5 animate-pulse"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop</span>
                    </button>
                  )}
                </div>

                {/* Trigger Reason & Confidence & Evidence */}
                <div className="pt-2 border-t border-white/[0.05] space-y-2 text-xs">
                  {liveAnalysis.triggerReason && (
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#646977] block">
                        TRIGGER REASON
                      </span>
                      <p className="text-[12px] text-[#9297A5] mt-0.5">
                        {liveAnalysis.triggerReason}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-[#646977]">
                      CONFIDENCE
                    </span>
                    <span className="font-mono text-xs text-[#38BDF8] font-semibold">
                      {Math.round(liveAnalysis.confidence * 100)}%
                    </span>
                  </div>

                  {liveAnalysis.ruleEvidence && (
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#646977] block">
                        EVIDENCE
                      </span>
                      <p className="text-[11.5px] text-[#9297A5] italic mt-0.5">
                        &quot;{liveAnalysis.ruleEvidence}&quot;
                      </p>
                    </div>
                  )}
                </div>

                {/* Microphone Recording Status & Transcription */}
                {micStatus === "recording" && (
                  <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center justify-between text-xs text-[#EF4444] animate-pulse font-mono">
                    <span className="flex items-center gap-2 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-ping" />
                      Recording Answer...
                    </span>
                    <span>{formatTimer(recordingSeconds)}</span>
                  </div>
                )}

                {micStatus === "transcribing" && (
                  <div className="p-3 rounded-lg bg-[#38BDF8]/10 border border-[#38BDF8]/30 flex items-center gap-2 text-xs text-[#38BDF8] font-mono">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Transcribing with ElevenLabs scribe_v2...</span>
                  </div>
                )}

                {micError && (
                  <p className="text-xs text-[#EF4444] font-medium">{micError}</p>
                )}

                {/* Expert Response Transcription Card */}
                {expertResponse && (
                  <div className="p-3.5 rounded-lg bg-[#1F2127] border border-white/[0.08] space-y-2">
                    <div className="flex items-center justify-between text-[10.5px] font-mono">
                      <span className="text-[#38BDF8] font-semibold uppercase">
                        EXPERT RESPONSE
                      </span>
                      <span className="text-[#646977]">ElevenLabs</span>
                    </div>

                    <p className="text-xs text-[#EEEFF2] italic font-medium leading-relaxed">
                      &quot;{expertResponse}&quot;
                    </p>

                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/[0.05]">
                      <button
                        onClick={handleAnalyzeExpertResponse}
                        disabled={isAnalyzingResponse}
                        className="bg-[#38BDF8]/10 hover:bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
                      >
                        {isAnalyzingResponse ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Analyzing with Claude...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Analyze Expert Response</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleResetRecording}
                        className="text-[11px] font-mono text-[#646977] hover:text-[#EEEFF2] underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                {/* Expert Response Analysis Result from Claude */}
                {liveAnalysis.expertResponseAnalysis && (
                  <div className="p-3 rounded-lg bg-[#34D399]/10 border border-[#34D399]/30 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#34D399] font-semibold">
                        {liveAnalysis.expertResponseAnalysis.revealedCategoryLabel}
                      </span>
                      <span className="text-[10px] font-mono text-[#34D399]">✓ Captured</span>
                    </div>

                    <p className="text-[#EEEFF2] font-medium leading-relaxed">
                      {liveAnalysis.expertResponseAnalysis.summary}
                    </p>

                    <div className="pt-2 flex items-center justify-between border-t border-[#34D399]/20">
                      <span className="text-[10.5px] font-mono text-[#646977]">
                        Added to Work Map
                      </span>
                      <Link
                        href="/work-map"
                        className="text-xs font-mono text-[#34D399] hover:underline flex items-center gap-1"
                      >
                        <span>View Work Map</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Extracted Tribal Knowledge Card */}
            <div className="p-3.5 rounded-lg bg-[#1F2127]/60 border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-[#646977]">
                  CAPTURED HEURISTICS
                </span>
                <span className="font-mono text-xs text-[#38BDF8]">
                  {heuristics.length} rules
                </span>
              </div>

              <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                {heuristics.map((h) => (
                  <div
                    key={h.id}
                    className="p-2 rounded bg-[#181A1F] border border-white/[0.05] text-xs space-y-0.5"
                  >
                    <div className="font-medium text-[#EEEFF2] truncate">{h.title}</div>
                    <div className="text-[11px] text-[#9297A5] line-clamp-1">
                      {h.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Work Map Link at Bottom of Column 3 */}
          <div className="pt-3 border-t border-white/[0.08]">
            <Link href="/work-map" className="block w-full">
              <button className="w-full bg-[#1F2127] hover:bg-[#292B34] text-[#EEEFF2] border border-white/[0.08] font-medium py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all">
                <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Open Work Map Graph</span>
              </button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
