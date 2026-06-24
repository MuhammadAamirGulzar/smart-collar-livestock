"use client"

import type React from "react"
import { cn } from "@/lib/utils"

interface GlassmorphicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  hoverable?: boolean
}

export function GlassmorphicCard({ 
  children, 
  className = "", 
  hoverable = false, 
  ...props 
}: GlassmorphicCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/20 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-lg transition-all duration-300",
        // Hover effects: Lift up + stronger shadow + slight glow
        hoverable && "hover:-translate-y-1 hover:shadow-2xl hover:bg-white/70 dark:hover:bg-slate-800/70 cursor-pointer group",
        className
      )}
      {...props}
    >
      {/* Decorative gradient blob for aesthetic depth */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}