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

  const mobileNavItems = [
    { name: "Dashboard", href: "/" },
    { name: "Observe", href: "/observe" },
    { name: "Work Map", href: "/work-map" },
    { name: "Train", href: "/train" },
  ];

  return (
    <div className="sticky top-0 z-30 flex flex-col bg-[#181A1F]/90 backdrop-blur-md border-b border-white/[0.08]">
      <header className="h-16 px-4 sm:px-6 flex items-center justify-between">
        {/* Left Title / Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="p-2 -ml-2 text-[#9297A5] hover:text-[#EEEFF2] md:hidden rounded-lg hover:bg-white/5"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <h2 className="text-sm sm:text-base font-semibold text-[#EEEFF2] tracking-tight">
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

      {/* Mobile Horizontal Top Navigation */}
      <nav aria-label="Mobile Navigation" className="flex md:hidden items-center gap-1.5 overflow-x-auto px-4 py-1.5 border-t border-white/[0.05] bg-[#181A1F] text-xs">
        {mobileNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              pathname === item.href
                ? "bg-[#292B34] text-[#EEEFF2] border border-white/[0.08]"
                : "text-[#9297A5] hover:text-[#EEEFF2]"
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
