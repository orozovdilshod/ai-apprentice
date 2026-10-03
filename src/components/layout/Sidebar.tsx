"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Eye,
  GitFork,
  Mic,
  Sparkles,
  Bot,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

const NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    badge: null,
    description: "Overview & metrics",
  },
  {
    name: "Expert Observation",
    href: "/observe",
    icon: Eye,
    badge: "Live",
    description: "Passive task recording",
  },
  {
    name: "Work Map",
    href: "/work-map",
    icon: GitFork,
    badge: "5 SOPs",
    description: "Procedural task graphs",
  },
  {
    name: "Voice Training",
    href: "/train",
    icon: Mic,
    badge: "Voice AI",
    description: "New hire voice simulations",
  },
];

interface SidebarProps {
  onCloseMobile?: () => void;
}

export function Sidebar({ onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-full flex flex-col bg-[#0A0E17] border-r border-white/10 select-none">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-white/5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-accent-cyan p-0.5 shadow-lg shadow-brand-500/20 flex items-center justify-center">
          <div className="w-full h-full bg-[#0A0E17] rounded-[10px] flex items-center justify-center">
            <Bot className="w-5 h-5 text-accent-cyan" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-semibold text-white tracking-tight text-sm">
              AI Apprentice
            </h1>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
              v0.1
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Tacit Knowledge Transfer</p>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Core Workflows
        </div>

        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={cn(
                "group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-150 relative",
                isActive
                  ? "bg-brand-600/15 text-white font-medium border border-brand-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-brand-500 shadow-[0_0_8px_#6366f1]" />
              )}
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive
                      ? "text-brand-400"
                      : "text-slate-400 group-hover:text-slate-300"
                  )}
                />
                <div>
                  <span className="leading-none block">{item.name}</span>
                </div>
              </div>

              {item.badge && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded font-mono",
                    item.badge === "Live"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse"
                      : "bg-white/5 text-slate-400"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* API Integrations Status Footer */}
      <div className="p-4 m-3 rounded-xl bg-surface-100/60 border border-white/5 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-accent-cyan" />
            Integrations
          </span>
          <Badge variant="cyan" dot className="text-[10px] px-1.5 py-0">
            Mock Mode
          </Badge>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Ready for <span className="text-slate-300">Anthropic Claude</span> &{" "}
          <span className="text-slate-300">ElevenLabs Voice</span> stubs.
        </p>
        <div className="pt-1 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <span>Hackathon MVP</span>
          <span className="font-mono text-slate-400">Next.js 14</span>
        </div>
      </div>
    </aside>
  );
}
