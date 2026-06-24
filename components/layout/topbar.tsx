import type React from "react"

interface TopbarProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function Topbar({ title, subtitle, action }: TopbarProps) {
  return (
    <div className="glass-light dark:glass border-b border-white/20 dark:border-white/10">
      <div className="flex items-center justify-between p-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  )
}
