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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { WaveformVisualizer } from "@/components/ui/WaveformVisualizer";
import { Skeleton } from "@/components/ui/LoadingSkeleton";
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
    transcript: "Wait, that's strange. The revenue graph shows an 18% drop this week compared to baseline. I'm not going to start checking churn logs or asking marketing if a campaign failed yet.",
    context: "Revenue anomaly investigation",
  },
  {
    id: "event-open-raw",
    shortLabel: "3. Open Raw SQL",
    name: "Opening Raw SQL (Decision Point)",
    action: "Opened raw transaction data after seeing an 18% revenue drop.",
    transcript: "I don't trust the dashboard number when the variance is this large, so I verify the raw transactions first.",
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
        content: "I'm looking at our headline numbers. There is an 18% revenue drop showing in EMEA week-over-week.",
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
        content: "I'm not going to start checking churn logs or asking marketing if a campaign failed yet.",
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
    description: "Bypasses aggregated dashboard to audit raw transaction events directly in Snowflake.",
    targetApp: "Snowflake",
    aiStatus: "Decision detected",
    screenFocus: "Snowflake",
    events: [
      {
        id: "evt-step-4-open-raw",
        timestamp: "00:00:12",
        speaker: "System",
        content: "Switched active window to Snowflake SQL Editor: Querying raw_events.stripe_transactions directly",
        type: "action",
        metadata: { targetApp: "Snowflake", actionType: "source_data_query" },
      },
      {
        id: "evt-step-5-explain-why",
        timestamp: "00:00:12",
        speaker: "Expert",
        content: "I don't trust the dashboard number when the variance is this large, so I verify the raw transactions first.",
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
  const [activeTab, setActiveTab] = useState<"stream" | "heuristics">("stream");
  const [heuristics, setHeuristics] = useState<HeuristicItem[]>(MOCK_LIVE_HEURISTICS);
  const [transcript, setTranscript] = useState<LiveTranscriptItem[]>(MOCK_LIVE_TRANSCRIPT);
  const [viewMode, setViewMode] = useState<"normal" | "empty" | "loading">("normal");

  const [aiObserverStatus, setAiObserverStatus] = useState<AiObserverStatus>("Observing");
  const [selectedEventId, setSelectedEventId] = useState<string>("event-open-raw");

  const [simState, setSimState] = useState<"idle" | "running" | "paused" | "completed">("idle");
  const [simSeconds, setSimSeconds] = useState(0);
  const [currentTimelineStepIndex, setCurrentTimelineStepIndex] = useState(-1);
  const [activeScreenFocus, setActiveScreenFocus] = useState<"Looker" | "Snowflake">("Looker");
  const analyzedStepRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isRecording || viewMode !== "normal") return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording, viewMode]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [liveAnalysis, setLiveAnalysis] = useState<ClaudeAnalysis | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "generating" | "playing" | "error">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [micStatus, setMicStatus] = useState<"ready" | "recording" | "transcribing" | "complete" | "error">("ready");
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
          : (err.message || "Could not access microphone.")
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
      expertTranscript: "I don't trust the dashboard number when the variance is this large, so I verify the raw transactions first.",
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

      // Autonomous AI Observer Status mapping
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

    const event = overrideEvent || SCENARIO_EVENTS.find((e) => e.id === selectedEventId) || SCENARIO_EVENTS[2];

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

      // Autonomous AI Observer Status mapping
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

      // 1. Deduplicate Action Feed: update existing or append once
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
          metadata: { confidence: Math.round(data.confidence * 100), actionType: "rule_extraction" },
        };

        const existingIdx = prev.findIndex((item) => item.id === STABLE_AI_EVENT_ID);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = aiItem;
          return updated;
        }
        return [...prev, aiItem];
      });

      // 2. Extracted Tribal Knowledge: update if rule is meaningful
      if (data.rule && data.rule !== "Not stated by expert") {
        setHeuristics((prev) => {
          const newHeuristic: HeuristicItem = {
            id: STABLE_HEURISTIC_ID,
            title: data.isDecisionPoint ? "Source Verification on Large Variance" : "Operational Observation",
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
    <div className="space-y-6 pb-12">
      {/* Page Header & Live Session Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0E1522]/90 border border-white/10 shadow-xl backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Passive Expert Observation Mode
            </h1>
            <Badge
              variant={isRecording ? "success" : "warning"}
              dot
              className="text-[11px]"
            >
              {isRecording ? "Live Recording" : "Paused"}
            </Badge>

            {/* AI Observer Status Indicator */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 border border-white/10 text-xs">
              <span className="text-slate-400 text-[11px]">AI Observer:</span>
              <span className={`font-semibold text-xs flex items-center gap-1.5 ${
                aiObserverStatus === "Why question ready"
                  ? "text-accent-cyan"
                  : aiObserverStatus === "Decision detected"
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  aiObserverStatus === "Why question ready"
                    ? "bg-accent-cyan animate-pulse"
                    : aiObserverStatus === "Decision detected"
                    ? "bg-amber-400 animate-ping"
                    : "bg-emerald-400"
                }`} />
                {aiObserverStatus}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Observing: <span className="text-slate-200 font-medium">Sarah Chen (Senior Data Analyst)</span> • Session: Revenue Anomaly Investigation
          </p>
        </div>

        {/* Live Simulation Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/50 border border-white/10 font-mono text-xs text-slate-300">
            <Radio className={`w-3.5 h-3.5 ${simState === "running" ? "text-accent-rose animate-pulse" : "text-slate-500"}`} />
            <span>{simState === "running" || simState === "paused" || simState === "completed" ? `${formatTimer(simSeconds)} / 00:13` : formatTimer(timerSeconds)}</span>
          </div>

          {/* Primary Simulation Controls */}
          {simState === "idle" && (
            <Button
              variant="glow"
              size="sm"
              onClick={handleStartObservation}
              className="shadow-brand-500/25"
            >
              <Play className="w-3.5 h-3.5 fill-current text-white" />
              <span>Start Observation</span>
            </Button>
          )}

          {simState === "running" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePauseObservation}
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </Button>
          )}

          {simState === "paused" && (
            <Button
              variant="glow"
              size="sm"
              onClick={handleResumeObservation}
            >
              <Play className="w-3.5 h-3.5 fill-current text-white" />
              <span>Resume</span>
            </Button>
          )}

          {simState === "completed" && (
            <Button
              variant="glow"
              size="sm"
              onClick={handleStartObservation}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Replay Session</span>
            </Button>
          )}

          {/* Reset Button */}
          {simState !== "idle" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetObservation}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleAddQuickHeuristic}
            className="hidden sm:inline-flex"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-accent-cyan" />
            <span>Pin Shortcut</span>
          </Button>

          <Button
            variant="glow"
            size="sm"
            onClick={() => handleAnalyzeObservation()}
            isLoading={isAnalyzing}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Analyze Observation</span>
          </Button>
        </div>
      </div>

      {/* Verification state and Scenario Test Event selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span>Simulation View:</span>
            <div className="inline-flex p-0.5 rounded-lg bg-black/40 border border-white/10">
              <button
                onClick={() => setViewMode("normal")}
                className={`px-2.5 py-1 rounded text-xs ${
                  viewMode === "normal" ? "bg-brand-600 text-white font-medium" : "text-slate-400 hover:text-white"
                }`}
              >
                Active Stream
              </button>
              <button
                onClick={() => setViewMode("loading")}
                className={`px-2.5 py-1 rounded text-xs ${
                  viewMode === "loading" ? "bg-brand-600 text-white font-medium" : "text-slate-400 hover:text-white"
                }`}
              >
                Synthesizing Skeleton
              </button>
              <button
                onClick={() => setViewMode("empty")}
                className={`px-2.5 py-1 rounded text-xs ${
                  viewMode === "empty" ? "bg-brand-600 text-white font-medium" : "text-slate-400 hover:text-white"
                }`}
              >
                Empty Session
              </button>
            </div>
          </div>

          {/* Test Event Selector for Sarah Chen Scenario */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Scenario Event:</span>
            <div className="inline-flex p-0.5 rounded-lg bg-black/40 border border-white/10">
              {SCENARIO_EVENTS.map((event) => (
                <button
                  key={event.id}
                  onClick={() => {
                    setSelectedEventId(event.id);
                    handleAnalyzeObservation(event);
                  }}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    selectedEventId === event.id
                      ? "bg-brand-600 text-white font-medium shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title={event.name}
                >
                  {event.shortLabel}
                </button>
              ))}
            </div>
          </div>
        </div>

        <span className="text-[11px] text-slate-400">
          Autonomous decision detection &amp; grounded heuristics
        </span>
      </div>

      {/* Observation Timeline Bar */}
      <div className="p-4 rounded-2xl bg-[#0E1522]/90 border border-white/10 shadow-xl backdrop-blur-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent-cyan" />
              Continuous Observation Timeline
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              simState === "running"
                ? "bg-brand-500/20 text-brand-300 border-brand-500/40 animate-pulse"
                : simState === "paused"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : simState === "completed"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-white/5 text-slate-400 border-white/10"
            }`}>
              {simState === "running"
                ? `Playing: ${simSeconds}s / 13s`
                : simState === "paused"
                ? `Paused at ${simSeconds}s`
                : simState === "completed"
                ? "Session Completed (13s)"
                : "Ready to Observe"}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            0s (Looker) &rarr; 4s (18% drop) &rarr; 8s (hold spec) &rarr; 12s (Snowflake SQL) &rarr; 13s (AI Evaluation)
          </span>
        </div>

        {/* Step Progress Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
          {TIMELINE_STEPS.map((step, idx) => {
            const isPast = (simSeconds > step.timeSec && simState !== "idle") || (simState === "completed" && idx <= 4);
            const isCurrent = currentTimelineStepIndex === idx && simState === "running";
            return (
              <div
                key={step.id}
                className={`p-2.5 rounded-xl border transition-all duration-300 text-xs space-y-1 ${
                  isCurrent
                    ? "bg-brand-500/20 border-brand-500/70 shadow-lg shadow-brand-500/20 ring-1 ring-brand-500/50"
                    : isPast
                    ? "bg-white/[0.03] border-emerald-500/30 text-slate-300"
                    : "bg-white/[0.01] border-white/5 opacity-50 text-slate-500"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className={isCurrent ? "text-accent-cyan font-bold" : isPast ? "text-emerald-400" : "text-slate-500"}>
                    {step.timeFormatted}
                  </span>
                  {isCurrent && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-cyan opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-cyan" />
                    </span>
                  )}
                  {isPast && !isCurrent && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </div>
                <p className={`font-semibold leading-tight truncate text-xs ${
                  isCurrent ? "text-white" : isPast ? "text-slate-200" : "text-slate-400"
                }`}>
                  {step.title}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {step.targetApp} • {step.aiStatus}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Live Screen/Audio Stream + Deconstructed Stream + Heuristics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Simulated Video Feed & Live Stream Log */}
        <div className="lg:col-span-7 space-y-6">
          {/* Simulated Workspace Feed & Voice Visualizer */}
          <Card className="overflow-hidden">
            <CardHeader className="py-3 px-4 bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                  <Monitor className="w-3.5 h-3.5 text-accent-cyan" />
                  <span>Display Capture 1: {activeScreenFocus === "Looker" ? "Looker Executive Revenue Dashboard" : "Snowflake SQL Console"}</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  1080p • 60 FPS
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* Mock Screen Surface */}
              <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black/80 aspect-video flex flex-col justify-between p-4">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="ml-2 text-slate-400">sarah@analytics-workstation: ~/revenue-anomaly</span>
                  </div>
                  <Badge variant={activeScreenFocus === "Looker" ? "warning" : "cyan"} className="text-[10px]">
                    Active Focus: {activeScreenFocus === "Looker" ? "Looker BI Dashboard" : "Snowflake SQL"}
                  </Badge>
                </div>

                {activeScreenFocus === "Looker" ? (
                  <div className="font-mono text-xs text-slate-300 space-y-1 my-auto">
                    <p className="text-slate-400">-- Sarah Chen: Executive Revenue Overview (EMEA Week-over-Week)</p>
                    <p className="text-amber-400 font-semibold">Looker Tile: EMEA Weekly Recurring Revenue (7d Trend)</p>
                    <p className="text-rose-400 font-mono">Variance Detected: -18.2% WoW ($1.42M &rarr; $1.16M)</p>
                    <p className="text-slate-400">Pipeline Status: Daily Looker sync completed at 06:00 UTC</p>
                    <p className="text-brand-400 mt-2">
                      &gt; AI Observer: Monitoring visual anomaly detection and cursor navigation
                    </p>
                  </div>
                ) : (
                  <div className="font-mono text-xs text-slate-300 space-y-1 my-auto">
                    <p className="text-slate-400">-- Sarah Chen: Revenue Variance Verification</p>
                    <p className="text-emerald-400">SELECT date_trunc(&apos;day&apos;, created_at) AS date,</p>
                    <p className="text-emerald-400">       sum(amount)/100 AS gross_revenue_usd, count(*) AS settled_count</p>
                    <p className="text-emerald-400">FROM raw_events.stripe_transactions WHERE status = &apos;succeeded&apos;</p>
                    <p className="text-emerald-400">GROUP BY 1 ORDER BY 1 DESC LIMIT 7;</p>
                    <p className="text-brand-400 mt-2">
                      &gt; AI Observer: Bypassed Looker aggregate cache to audit raw Stripe transaction pipeline
                    </p>
                  </div>
                )}

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-accent-cyan" />
                    Microphone Input: Sennheiser Profile (Active)
                  </span>
                  <span>Audio Level: -14 dB</span>
                </div>
              </div>

              {/* Audio Waveform Stream */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Voice Ambient Stream</span>
                  <span className="text-[10px] text-accent-cyan">AI Intent Extraction Active</span>
                </div>
                <WaveformVisualizer isActive={isRecording && viewMode === "normal"} color="brand" />
              </div>
            </CardContent>
          </Card>

          {/* Live Transcript & Intent Stream */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Deconstructed Action Feed</CardTitle>
                  <CardDescription>
                    Real-time transcription and semantic action tags
                  </CardDescription>
                </div>
                <Badge variant="brand" className="text-[10px]">
                  5 events logged
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {viewMode === "loading" ? (
                <div className="p-4 space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : viewMode === "empty" ? (
                <EmptyState
                  icon={<Eye className="w-6 h-6" />}
                  title="Awaiting Expert Activity"
                  description="When the expert begins speaking or executing commands, actions will populate here automatically."
                />
              ) : (
                <div className="divide-y divide-white/5 max-h-[380px] overflow-y-auto">
                  {transcript.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 flex items-start gap-3 hover:bg-white/[0.01] transition-colors"
                    >
                      <span className="text-[10px] font-mono text-slate-400 pt-0.5 whitespace-nowrap">
                        {item.timestamp}
                      </span>

                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-semibold ${
                              item.speaker === "Expert"
                                ? "text-slate-200"
                                : item.speaker === "AI Apprentice"
                                ? "text-accent-cyan"
                                : "text-amber-400"
                            }`}
                          >
                            {item.speaker}
                          </span>
                          <span
                            className={`text-[9px] uppercase px-1.5 py-0.2 rounded border font-mono ${
                              item.type === "heuristic"
                                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                                : item.type === "action"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : item.type === "decision"
                                ? "bg-brand-500/10 text-brand-400 border-brand-500/20"
                                : "bg-white/5 text-slate-400 border-white/10"
                            }`}
                          >
                            {item.type}
                          </span>
                          {item.metadata?.confidence && (
                            <span className="text-[10px] text-slate-400">
                              {item.metadata.confidence}% conf
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {item.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (5 cols): Captured Tribal Heuristics & Shortcuts */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Loading Card for Claude Analysis */}
          {isAnalyzing && (
            <Card className="border-brand-500/40 p-4 space-y-3 animate-pulse bg-brand-500/5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-brand-300 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-accent-cyan" />
                  Claude Analyzing Expert Action &amp; Transcript...
                </span>
                <Badge variant="brand" className="text-[10px]">
                  Processing
                </Badge>
              </div>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-16 w-full" />
            </Card>
          )}

          {/* Analysis Error Alert */}
          {analysisError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <div>
                <span className="font-semibold block">Analysis Failed:</span>
                <span>{analysisError}</span>
              </div>
            </div>
          )}

          {/* Live Anthropic Claude Real-time Analysis Card */}
          {liveAnalysis && (
            <Card className="border-brand-500/50 bg-gradient-to-b from-[#131B2E] via-[#0E1522] to-[#0A0E17] shadow-2xl shadow-brand-500/10">
              <CardHeader className="pb-3 border-b border-brand-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-brand-400 animate-pulse" />
                    <span className="text-xs font-semibold text-white">
                      Anthropic Claude Analysis
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant={liveAnalysis.isDecisionPoint ? "cyan" : "default"}
                      dot
                      className="text-[10px]"
                    >
                      {liveAnalysis.isDecisionPoint
                        ? "Decision Point: Yes"
                        : "Decision Point: No"}
                    </Badge>
                    <span className="text-[11px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {Math.round(liveAnalysis.confidence * 100)}% Conf
                    </span>
                  </div>
                </div>

                {/* Extracted Rule & Evidence */}
                <div className="mt-2 space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-accent-cyan block">
                    Extracted Operational Rule
                  </span>
                  <CardTitle className="text-sm text-slate-100 leading-snug">
                    {liveAnalysis.rule}
                  </CardTitle>
                  <div className="p-2 rounded bg-black/40 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-emerald-400" />
                    <span>
                      <strong className="text-emerald-200">Source Evidence:</strong> &quot;{liveAnalysis.ruleEvidence}&quot;
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3.5 pt-3 text-xs">
                {/* 1. Explicit Expert Knowledge */}
                {liveAnalysis.explicitKnowledge && liveAnalysis.explicitKnowledge.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block">
                      Explicit Expert Knowledge (Directly Stated)
                    </span>
                    <div className="space-y-1.5">
                      {liveAnalysis.explicitKnowledge.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-0.5"
                        >
                          <p className="text-slate-200 font-medium text-xs">
                            {item.item}
                          </p>
                          <p className="text-[11px] text-slate-400 italic">
                            Evidence: &quot;{item.sourceSentence}&quot;
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Reasonable Inferences */}
                {liveAnalysis.reasonableInferences && liveAnalysis.reasonableInferences.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold text-accent-cyan uppercase tracking-wider block">
                      Reasonable Inferences (Grounded in Action)
                    </span>
                    <div className="space-y-1.5">
                      {liveAnalysis.reasonableInferences.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/20 space-y-0.5"
                        >
                          <p className="text-slate-200 font-medium text-xs">
                            {item.inference}
                          </p>
                          <p className="text-[11px] text-slate-400 italic">
                            Grounded in: &quot;{item.groundedIn}&quot;
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Exception & Guardrail Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-semibold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Exception</span>
                    </div>
                    <p className="text-xs text-slate-200 font-medium">
                      {liveAnalysis.exception}
                    </p>
                    <p className="text-[10px] text-slate-400 italic">
                      Source: &quot;{liveAnalysis.exceptionEvidence}&quot;
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 space-y-1">
                    <div className="flex items-center gap-1.5 text-rose-400 text-[11px] font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Guardrail</span>
                    </div>
                    <p className="text-xs text-slate-200 font-medium">
                      {liveAnalysis.guardrail}
                    </p>
                    <p className="text-[10px] text-slate-400 italic">
                      Source: &quot;{liveAnalysis.guardrailEvidence}&quot;
                    </p>
                  </div>
                </div>

                {/* 4. Unknown / Not Stated by Expert */}
                {liveAnalysis.unknownOrNotStated && liveAnalysis.unknownOrNotStated.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Unknown / Not Stated by Expert
                    </span>
                    <ul className="p-2.5 rounded-lg bg-black/30 border border-white/5 space-y-1 text-[11px] text-slate-400">
                      {liveAnalysis.unknownOrNotStated.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-slate-500 leading-none mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 5. Targeted "Why" Question / Autonomous Decision Point */}
                {liveAnalysis.whyQuestion && liveAnalysis.whyQuestion !== "Not stated by expert" && (
                  <div
                    className={`p-3.5 rounded-xl border space-y-3 transition-all duration-300 ${
                      liveAnalysis.shouldAskWhy
                        ? "bg-gradient-to-r from-amber-500/15 via-brand-500/10 to-emerald-500/10 border-amber-500/50 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/30"
                        : "bg-brand-500/10 border-brand-500/30"
                    }`}
                  >
                    {/* Visual Highlight Banner when shouldAskWhy = true */}
                    {liveAnalysis.shouldAskWhy && (
                      <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
                        <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs tracking-wide">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                          </span>
                          <span>AI detected a decision point</span>
                        </div>
                        <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${
                          liveAnalysis.questionPriority === "high"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            : liveAnalysis.questionPriority === "medium"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-slate-500/10 text-slate-400 border-slate-500/30"
                        }`}>
                          {liveAnalysis.questionPriority} priority
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <HelpCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          liveAnalysis.shouldAskWhy ? "text-amber-400" : "text-brand-400"
                        }`} />
                        <div>
                          <span className={`text-[10px] font-semibold uppercase tracking-wider block ${
                            liveAnalysis.shouldAskWhy ? "text-amber-300" : "text-brand-300"
                          }`}>
                            Targeted &quot;Why&quot; Question (For Expert Probe)
                          </span>
                          <p className="text-xs text-slate-100 mt-0.5 leading-relaxed font-medium">
                            &quot;{liveAnalysis.whyQuestion}&quot;
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center flex-shrink-0">
                        <button
                          type="button"
                          onClick={handleSpeakWhyQuestion}
                          disabled={voiceStatus === "generating" || voiceStatus === "playing"}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 shadow-sm border ${
                            voiceStatus === "generating"
                              ? "bg-brand-500/20 text-brand-200 border-brand-500/40 cursor-wait"
                              : voiceStatus === "playing"
                              ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/40 animate-pulse cursor-default"
                              : voiceStatus === "error"
                              ? "bg-rose-500/20 text-rose-200 border-rose-500/40 hover:bg-rose-500/30 cursor-pointer"
                              : "bg-brand-600 hover:bg-brand-500 text-white border-brand-500 hover:shadow-brand-500/25 cursor-pointer"
                          }`}
                        >
                          {voiceStatus === "generating" && (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-300" />
                              <span>Generating...</span>
                            </>
                          )}
                          {voiceStatus === "playing" && (
                            <>
                              <Volume2 className="w-3.5 h-3.5 animate-bounce text-emerald-400" />
                              <span>Playing...</span>
                            </>
                          )}
                          {voiceStatus === "error" && (
                            <>
                              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                              <span>Error</span>
                            </>
                          )}
                          {voiceStatus === "idle" && (
                            <>
                              <span>🔊</span>
                              <span>Ask the Expert</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Compact trigger reason */}
                    {liveAnalysis.triggerReason && (
                      <div className="px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[11px] text-slate-300 flex items-start gap-2">
                        <span className="text-amber-400 font-semibold whitespace-nowrap text-[10px] uppercase tracking-wider mt-0.5">
                          Trigger Reason:
                        </span>
                        <span className="leading-snug text-slate-300">
                          {liveAnalysis.triggerReason}
                        </span>
                      </div>
                    )}

                    {/* Microphone Control Below Targeted Why Question */}
                    <div className="pt-2.5 border-t border-brand-500/20 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-300">
                            Expert Response:
                          </span>
                          {micStatus === "ready" && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              Ready
                            </span>
                          )}
                          {micStatus === "recording" && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-[10px] font-semibold text-rose-300 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
                              Recording: {Math.floor(recordingSeconds / 60).toString().padStart(2, "0")}:{(recordingSeconds % 60).toString().padStart(2, "0")}
                            </span>
                          )}
                          {micStatus === "transcribing" && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-500/20 border border-brand-500/40 text-[10px] font-medium text-brand-300">
                              <Loader2 className="w-3 h-3 animate-spin text-brand-400" />
                              Transcribing...
                            </span>
                          )}
                          {micStatus === "complete" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-medium text-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              Complete
                            </span>
                          )}
                          {micStatus === "error" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-[10px] font-medium text-rose-300">
                              <AlertCircle className="w-3 h-3" />
                              Error
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {(micStatus === "ready" || micStatus === "complete") && (
                            <button
                              type="button"
                              onClick={startRecording}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                            >
                              <Mic className="w-3.5 h-3.5" />
                              <span>🎙 Answer</span>
                            </button>
                          )}

                          {micStatus === "recording" && (
                            <button
                              type="button"
                              onClick={stopRecording}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer animate-pulse"
                            >
                              <Square className="w-3 h-3 fill-current" />
                              <span>Stop</span>
                            </button>
                          )}

                          {micStatus === "error" && (
                            <button
                              type="button"
                              onClick={startRecording}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Mic className="w-3.5 h-3.5" />
                              <span>Retry 🎙 Answer</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {micError && (
                        <p className="text-[11px] text-rose-400 mt-1">
                          {micError}
                        </p>
                      )}

                      {/* Transcribed Text Display */}
                      {expertResponse && (
                        <div className="mt-2 p-2.5 rounded-lg bg-black/40 border border-white/10 space-y-2">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-semibold text-accent-cyan uppercase tracking-wider">
                              Expert Response
                            </span>
                            <span className="text-slate-400">
                              ElevenLabs (scribe_v2)
                            </span>
                          </div>
                          <p className="text-xs text-slate-200 italic font-medium leading-relaxed">
                            &quot;{expertResponse}&quot;
                          </p>

                          <div className="pt-1 flex items-center justify-between gap-2">
                            <Button
                              size="sm"
                              variant="glow"
                              onClick={handleAnalyzeExpertResponse}
                              disabled={isAnalyzingResponse}
                              className="text-xs h-7 px-3"
                            >
                              {isAnalyzingResponse ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                                  <span>Analyzing Expert Response...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3 h-3 mr-1.5" />
                                  <span>Analyze Expert Response</span>
                                </>
                              )}
                            </Button>

                            <button
                              type="button"
                              onClick={handleResetRecording}
                              className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Expert Response Analysis Result from Claude */}
                      {liveAnalysis.expertResponseAnalysis && (
                        <div className="mt-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  liveAnalysis.expertResponseAnalysis.revealedCategory === "no_new_knowledge"
                                    ? "default"
                                    : "success"
                                }
                                dot
                              >
                                {liveAnalysis.expertResponseAnalysis.revealedCategoryLabel}
                              </Badge>
                              <span className="text-[11px] font-semibold text-emerald-300">
                                Tacit Nuance Extracted
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed font-medium">
                            {liveAnalysis.expertResponseAnalysis.summary}
                          </p>
                          {liveAnalysis.expertResponseAnalysis.groundedEvidence && (
                            <p className="text-[11px] text-slate-400 italic">
                              Evidence: {liveAnalysis.expertResponseAnalysis.groundedEvidence}
                            </p>
                          )}

                          <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between">
                            <span className="text-[10px] text-emerald-400 font-medium">
                              ✓ Synchronized to Shared Work Map Session
                            </span>
                            <Link
                              href="/work-map"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all"
                            >
                              <span>Inspect in Work Map</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* When autonomous probe was not triggered, display clear compact status */}
                {!liveAnalysis.shouldAskWhy && (
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          liveAnalysis.isDecisionPoint ? "bg-amber-400 animate-ping" : "bg-emerald-400"
                        }`} />
                        <span className="text-[11px] font-semibold text-slate-200">
                          {liveAnalysis.isDecisionPoint ? "Decision Detected (Passive Monitoring)" : "Routine Operational Action"}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                        Autonomous Probe Not Triggered
                      </span>
                    </div>

                    {liveAnalysis.triggerReason && (
                      <div className="px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/5 text-[11px] text-slate-300 flex items-start gap-2">
                        <span className="text-slate-400 font-medium whitespace-nowrap text-[10px] uppercase tracking-wider mt-0.5">
                          Trigger Reason:
                        </span>
                        <span className="leading-snug text-slate-300">
                          {liveAnalysis.triggerReason}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="border-accent-cyan/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="cyan" dot>
                  Tacit Heuristics
                </Badge>
                <span className="text-[11px] text-slate-400">
                  {heuristics.length} Extracted
                </span>
              </div>
              <CardTitle className="mt-2 text-base">
                Extracted Tribal Knowledge
              </CardTitle>
              <CardDescription>
                Nuances and unwritten heuristics identified from the expert&apos;s behavior.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 pt-0">
              {viewMode === "loading" ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : viewMode === "empty" ? (
                <EmptyState
                  icon={<Sparkles className="w-6 h-6" />}
                  title="No Heuristics Captured"
                  description="As the AI Apprentice observes key decision pivots, tacit knowledge will be distilled here."
                />
              ) : (
                heuristics.map((h) => (
                  <div
                    key={h.id}
                    className="p-3.5 rounded-xl bg-surface-100/70 border border-white/5 hover:border-accent-cyan/30 transition-all space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-semibold text-white group-hover:text-accent-cyan transition-colors">
                        {h.title}
                      </h4>
                      <Badge
                        variant={
                          h.category === "Shortcut"
                            ? "cyan"
                            : h.category === "Mental Model"
                            ? "brand"
                            : "warning"
                        }
                        className="text-[9px] px-1.5 py-0"
                      >
                        {h.category}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {h.description}
                    </p>

                    <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-mono">Detected at {h.detectedAt}</span>
                      <span className="text-emerald-400 font-medium">
                        {h.confidence}% confidence
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* SOP Synthesis Readiness Card */}
          <Card className="bg-gradient-to-br from-[#0F172A] to-[#0A0E17]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Synthesize into Work Map</CardTitle>
              <CardDescription>
                Convert this session&apos;s heuristics into an interactive SOP decision tree.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="p-3 rounded-lg bg-black/30 border border-white/5 space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Extracted Steps:</span>
                  <span className="font-semibold text-white">5 nodes</span>
                </div>
                <div className="flex justify-between">
                  <span>Decision Points:</span>
                  <span className="font-semibold text-white">2 branches</span>
                </div>
                <div className="flex justify-between">
                  <span>Model Engine:</span>
                  <span className="font-semibold text-brand-400">Claude 3.5 Sonnet</span>
                </div>
              </div>

              <Link href="/work-map" className="block w-full">
                <Button variant="glow" size="sm" className="w-full">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Compile into Work Map</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
