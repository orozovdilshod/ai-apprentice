"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface WaveformVisualizerProps {
  isActive?: boolean;
  color?: "brand" | "cyan" | "emerald";
  barCount?: number;
  className?: string;
}

export function WaveformVisualizer({
  isActive = true,
  color = "cyan",
  barCount = 28,
  className,
}: WaveformVisualizerProps) {
  const [heights, setHeights] = useState<number[]>([]);

  useEffect(() => {
    // Generate initial randomized heights
    const initial = Array.from({ length: barCount }, () =>
      isActive ? Math.floor(Math.random() * 70) + 15 : 8
    );
    setHeights(initial);

    if (!isActive) return;

    const interval = setInterval(() => {
      setHeights((prev) =>
        prev.map(() => Math.floor(Math.random() * 85) + 10)
      );
    }, 140);

    return () => clearInterval(interval);
  }, [isActive, barCount]);

  const colorStyles = {
    brand: "bg-brand-400 group-hover:bg-brand-300 shadow-[0_0_8px_rgba(99,102,241,0.5)]",
    cyan: "bg-accent-cyan group-hover:bg-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.5)]",
    emerald: "bg-accent-emerald group-hover:bg-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-1.5 h-14 px-4 py-2 rounded-xl bg-black/40 border border-white/10 group overflow-hidden",
        className
      )}
    >
      {heights.map((height, idx) => (
        <span
          key={idx}
          className={cn(
            "w-1 rounded-full transition-all duration-150 ease-out",
            colorStyles[color],
            !isActive && "opacity-30"
          )}
          style={{
            height: `${isActive ? height : 8}%`,
          }}
        />
      ))}
    </div>
  );
}
