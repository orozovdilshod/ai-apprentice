"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Sparkles,
  Radio,
  Eye,
  Mic,
  GitFork,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const pathname = usePathname();

  const getPageMeta = () => {
    switch (pathname) {
      case "/observe":
        return {
          title: "Expert Observation Mode",
          badge: "Active Listener",
          badgeVariant: "emerald" as const,
        };
      case "/work-map":
        return {
          title: "Tacit Work Map & SOPs",
          badge: "Synthesized Graph",
          badgeVariant: "brand" as const,
        };
      case "/train":
        return {
          title: "New Hire Voice Simulator",
          badge: "ElevenLabs Staged",
          badgeVariant: "cyan" as const,
        };
      default:
        return {
          title: "Apprentice Dashboard",
          badge: "Knowledge Hub",
          badgeVariant: "default" as const,
        };
    }
  };

  const meta = getPageMeta();

  return (
    <header className="h-16 px-4 sm:px-6 border-b border-white/10 bg-[#090D16]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
      {/* Left Title / Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 text-slate-400 hover:text-white md:hidden rounded-lg hover:bg-white/5"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight">
            {meta.title}
          </h2>
          <Badge
            variant={
              meta.badgeVariant === "emerald"
                ? "success"
                : meta.badgeVariant === "brand"
                ? "brand"
                : meta.badgeVariant === "cyan"
                ? "cyan"
                : "default"
            }
            dot
            className="hidden sm:inline-flex"
          >
            {meta.badge}
          </Badge>
        </div>
      </div>

      {/* Right Quick Navigation / Status */}
      <div className="flex items-center gap-2 sm:gap-3">
        {pathname !== "/observe" && (
          <Link href="/observe">
            <Button variant="secondary" size="sm" className="hidden sm:flex">
              <Eye className="w-3.5 h-3.5 text-accent-cyan" />
              <span>Observe</span>
            </Button>
          </Link>
        )}

        {pathname !== "/train" && (
          <Link href="/train">
            <Button variant="glow" size="sm">
              <Mic className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Practice Voice</span>
              <span className="xs:hidden">Train</span>
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
