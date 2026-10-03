"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Eye,
  GitFork,
  Mic,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  Users,
  Compass,
  Layers,
  Activity,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCardSkeleton, TableRowSkeleton } from "@/components/ui/LoadingSkeleton";
import {
  MOCK_METRICS,
  MOCK_OBSERVATIONS,
  MOCK_WORK_MAPS,
  MOCK_TRAINING_SCENARIOS,
  ObservationSession,
} from "@/lib/mock-data";

export default function DashboardPage() {
  const [viewState, setViewState] = useState<"normal" | "loading" | "empty">("normal");

  return (
    <div className="space-y-8 pb-10">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0F172A] via-[#0E1522] to-[#0A0E17] p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-20 w-60 h-60 rounded-full bg-accent-cyan/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-accent-cyan animate-pulse" />
            <span>Autonomous Tacit Knowledge Acquisition</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Transform Expert Tribal Knowledge into Executable Voice Training
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            AI Apprentice passively watches senior operators solve complex incidents, extracts
            their unwritten heuristics into visual work maps, and generates voice simulation
            drills for junior hires.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link href="/observe">
              <Button variant="glow" size="md">
                <Eye className="w-4 h-4" />
                <span>Start Observation Mode</span>
              </Button>
            </Link>
            <Link href="/train">
              <Button variant="secondary" size="md">
                <Mic className="w-4 h-4 text-accent-cyan" />
                <span>Launch Voice Drill</span>
              </Button>
            </Link>
            <Link href="/work-map">
              <Button variant="outline" size="md">
                <GitFork className="w-4 h-4 text-slate-400" />
                <span>Browse Work Maps</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* State Switcher for hackathon demo verification */}
        <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Demo State Preview:</span>
            <div className="inline-flex p-0.5 rounded-lg bg-black/40 border border-white/10">
              <button
                onClick={() => setViewState("normal")}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  viewState === "normal"
                    ? "bg-brand-600 text-white font-medium"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Normal Data
              </button>
              <button
                onClick={() => setViewState("loading")}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  viewState === "loading"
                    ? "bg-brand-600 text-white font-medium"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Loading Skeletons
              </button>
              <button
                onClick={() => setViewState("empty")}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  viewState === "empty"
                    ? "bg-brand-600 text-white font-medium"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Empty State
              </button>
            </div>
          </div>

          <span className="text-[11px] text-slate-400 font-mono">
            Ready for Anthropic + ElevenLabs API keys
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            System Knowledge Telemetry
          </h2>
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-accent-emerald" />
            Live sync active
          </span>
        </div>

        {viewState === "loading" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MOCK_METRICS.map((metric) => (
              <Card key={metric.id} className="p-5 relative overflow-hidden group hover:border-brand-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">
                    {metric.label}
                  </span>
                  <Badge variant="brand" className="text-[10px]">
                    {metric.change}
                  </Badge>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-white">
                    {viewState === "empty" ? "0" : metric.value}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400 leading-tight">
                  {viewState === "empty"
                    ? "No sessions recorded yet."
                    : metric.subtext}
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Grid: Recent Observations & Active Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Observation Sessions */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle>Recent Expert Observations</CardTitle>
                <CardDescription>
                  Sessions recorded with audio & screen capture decomposition
                </CardDescription>
              </div>
              <Link href="/observe">
                <Button variant="ghost" size="sm" className="text-xs text-brand-400">
                  <span>New Session</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-0">
              {viewState === "loading" ? (
                <div className="p-2 space-y-2">
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                </div>
              ) : viewState === "empty" ? (
                <EmptyState
                  icon={<Eye className="w-6 h-6" />}
                  title="No Observation Sessions Yet"
                  description="Start your first passive session to observe an expert resolving a live incident or ticket."
                  actionLabel="Launch Observation Mode"
                  onAction={() => setViewState("normal")}
                />
              ) : (
                <div className="divide-y divide-white/5">
                  {MOCK_OBSERVATIONS.map((session) => (
                    <div
                      key={session.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-white truncate">
                            {session.title}
                          </h4>
                          <Badge
                            variant={
                              session.status === "Completed"
                                ? "success"
                                : session.status === "In Progress"
                                ? "brand"
                                : "default"
                            }
                            className="text-[10px]"
                          >
                            {session.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span className="text-slate-300">
                            {session.expertName} ({session.expertRole})
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {session.duration}
                          </span>
                          <span>•</span>
                          <span>{session.department}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:self-center">
                        <div className="text-right">
                          <div className="text-xs font-semibold text-accent-cyan">
                            {session.heuristicsCount} Heuristics
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {session.stepsExtracted} steps • {session.confidenceScore}% conf
                          </div>
                        </div>

                        <Link href="/work-map">
                          <Button variant="secondary" size="sm" className="px-2.5">
                            <GitFork className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>

            <CardFooter>
              <span>Showing 4 completed expert sessions</span>
              <Link href="/observe" className="text-brand-400 hover:text-brand-300">
                View all recordings →
              </Link>
            </CardFooter>
          </Card>
        </div>

        {/* Right Col: Voice Training Quick Launch & Work Map Spotlight */}
        <div className="space-y-6">
          {/* Voice Training Spotlight */}
          <Card className="border-brand-500/20 bg-gradient-to-b from-[#111827] to-[#0E1522]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="cyan" dot>
                  Voice Simulation
                </Badge>
                <span className="text-[11px] text-slate-400">ElevenLabs Engine</span>
              </div>
              <CardTitle className="mt-2 text-base">
                New Hire Roleplay Simulator
              </CardTitle>
              <CardDescription>
                Trainees converse directly with realistic AI persona voices grounded in captured SOPs.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 pt-0">
              <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">
                    {MOCK_TRAINING_SCENARIOS[0].title}
                  </span>
                  <Badge variant="warning" className="text-[10px]">
                    {MOCK_TRAINING_SCENARIOS[0].difficulty}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {MOCK_TRAINING_SCENARIOS[0].description}
                </p>
                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Persona: {MOCK_TRAINING_SCENARIOS[0].aiPersona.name}</span>
                  <span>{MOCK_TRAINING_SCENARIOS[0].durationMinutes} mins</span>
                </div>
              </div>

              <Link href="/train" className="block w-full">
                <Button variant="glow" size="sm" className="w-full">
                  <Mic className="w-3.5 h-3.5" />
                  <span>Start Roleplay Drill</span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Work Map Spotlight */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="brand">SOP Knowledge Graph</Badge>
                <span className="text-[11px] text-slate-400">Claude Decomposition</span>
              </div>
              <CardTitle className="mt-2 text-base">
                Synthesized Incident Work Map
              </CardTitle>
              <CardDescription>
                Deconstructed operational decision tree ready for drill synthesis.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="space-y-2">
                {MOCK_WORK_MAPS[0].nodes.slice(0, 3).map((node, i) => (
                  <div
                    key={node.id}
                    className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-5 h-5 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center font-mono text-[10px]">
                        {i + 1}
                      </span>
                      <span className="truncate text-slate-200 font-medium">
                        {node.title.replace(/^\d+\.\s*/, "")}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {node.type}
                    </span>
                  </div>
                ))}
              </div>

              <Link href="/work-map" className="block w-full pt-1">
                <Button variant="secondary" size="sm" className="w-full">
                  <GitFork className="w-3.5 h-3.5 text-brand-400" />
                  <span>View Full Graph & Logic Branches</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
