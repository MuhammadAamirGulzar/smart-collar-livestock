"use client"

import type React from "react"
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"
import { GlassmorphicCard } from "@/components/ui/glassmorphic-card" // Reusing your new pretty card!
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
    direction: "up" | "down"
  }
}

export function StatCard({ label, value, icon, trend }: StatCardProps) {
  return (
    <GlassmorphicCard hoverable className="flex flex-col justify-between h-full min-h-[140px]">
      <div className="flex justify-between items-start">
        {/* Left Side: Label & Value */}
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase text-xs">
            {label}
          </p>
          <h3 className="text-3xl font-extrabold text-foreground tracking-tight">
            {value}
          </h3>
        </div>

        {/* Right Side: Icon Bubble */}
        {icon && (
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100/20 shadow-inner">
            <div className="h-6 w-6 flex items-center justify-center">
              {icon}
            </div>
          </div>
        )}
      </div>

      {/* Bottom: Trend Indicator */}
      <div className="mt-4 pt-3 border-t border-white/10 dark:border-white/5 flex items-center">
        {trend ? (
          <div
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border",
              trend.direction === "up"
                ? "bg-emerald-100/50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                : "bg-rose-100/50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
            )}
          >
            {trend.direction === "up" ? (
              <ArrowUpRight size={14} strokeWidth={2.5} />
            ) : (
              <ArrowDownRight size={14} strokeWidth={2.5} />
            )}
            <span>{Math.abs(trend.value)}% from last month</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1">
            <Minus size={14} />
            <span>No change</span>
          </div>
        )}
      </div>
    </GlassmorphicCard>
  )
}