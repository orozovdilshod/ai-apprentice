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
  },
  {
    name: "Observe",
    href: "/observe",
    icon: Eye,
  },
  {
    name: "Work Map",
    href: "/work-map",
    icon: GitFork,
  },
  {
    name: "Train",
    href: "/train",
    icon: Mic,
  },
];

interface SidebarProps {
  onCloseMobile?: () => void;
}

export function Sidebar({ onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-[240px] h-full flex flex-col bg-[#181A1F] border-r border-white/[0.08] select-none">
      {/* Brand Header: 28x28 dark square logo tile with a small cyan square inside */}
      <div className="h-16 px-4 flex items-center gap-3 border-b border-white/[0.08]">
        <div className="w-7 h-7 rounded-md bg-[#131417] border border-white/10 flex items-center justify-center flex-shrink-0 shadow-inner">
          <div className="w-2.5 h-2.5 rounded-[2px] bg-[#38BDF8]" />
        </div>
        <div className="min-w-0">
          <h1 className="font-semibold text-[#EEEFF2] tracking-tight text-sm truncate">
            AI Apprentice
          </h1>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10.5px] font-mono text-[#646977] uppercase tracking-[0.12em]">
          Navigation
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
                "group flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] transition-all duration-200",
                isActive
                  ? "bg-[#292B34] text-[#EEEFF2] font-medium border border-white/[0.08]"
                  : "text-[#9297A5] hover:text-[#EEEFF2] hover:bg-[#292B34]/60"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 transition-colors flex-shrink-0",
                  isActive
                    ? "text-[#38BDF8]"
                    : "text-[#9297A5] group-hover:text-[#EEEFF2]"
                )}
              />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Bottom Session Card: Sarah Chen, Senior Data Analyst, Live green indicator */}
      <div className="p-3 border-t border-white/[0.08]">
        <div className="p-3 rounded-lg bg-[#1F2127] border border-white/[0.08] flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-[#EEEFF2] truncate leading-tight">
              Sarah Chen
            </div>
            <div className="text-[11px] text-[#9297A5] truncate mt-0.5">
              Senior Data Analyst
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#34D399]">
              LIVE
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
