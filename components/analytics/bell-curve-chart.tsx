"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { ChartContainer } from "@/components/ui/chart"

type BellCurveChartProps = {
  title: string
  /** If provided, component will fetch this CSV from /public and read the first numeric value in the first column. */
  meanFromCsvPath?: string
  mean?: number
  stdDev?: number
}


function gaussian(x: number, mean: number, stdDev: number) {
  const variance = stdDev * stdDev
  if (variance === 0) return 0
  const denom = Math.sqrt(2 * Math.PI * variance)
  const num = Math.exp(-((x - mean) * (x - mean)) / (2 * variance))
  return num / denom
}

export function BellCurveChart({
  title,
  meanFromCsvPath,
  mean: meanProp,
  stdDev = 2,
}: BellCurveChartProps) {
  const [mean, setMean] = React.useState<number | null>(
    typeof meanProp === "number" ? meanProp : null,
  )

  React.useEffect(() => {
    let cancelled = false
    async function loadMean() {
      if (!meanFromCsvPath) return
      try {
        const res = await fetch(meanFromCsvPath)
        if (!res.ok) throw new Error('Failed to fetch csv')
        const text = await res.text()
        // CSV expected like: header\n<value>
        const lines = text.trim().split(/\r?\n/)
        const valueLine = lines[1] ?? lines[0]
        const firstCol = (valueLine ?? '').split(',')[0]?.trim()
        const parsed = Number(firstCol)
        if (!cancelled && Number.isFinite(parsed)) setMean(parsed)
      } catch {
        // keep existing mean
      }
    }
    void loadMean()
    return () => {
      cancelled = true
    }
  }, [meanFromCsvPath])

  const data = React.useMemo(() => {
    if (mean === null) return []
    // x-range: mean ± 3 stdDev
    const minX = mean - 3 * stdDev
    const maxX = mean + 3 * stdDev
    const steps = 80
    const step = (maxX - minX) / steps

    const points: Array<{ x: number; y: number }> = []
    for (let i = 0; i <= steps; i++) {
      const x = minX + i * step
      points.push({ x: Number(x.toFixed(3)), y: gaussian(x, mean, stdDev) })
    }
    return points
  }, [mean, stdDev])


  return (
    <div className="rounded-xl border bg-white shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <div className="text-xs text-gray-500">
          mean:{" "}
          <span className="font-medium">{mean === null ? "—" : mean}</span>
        </div>

      </div>

      <ChartContainer
        id={title}
        className="rounded-lg border"
        config={{
          y: { label: "Density", color: "hsl(var(--chart-1))" },
        }}
      >
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="4 4" />
            <XAxis
              dataKey="x"
              tickFormatter={(v) => v.toFixed(1)}
              type="number"
              domain={["dataMin", "dataMax"]}
            />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const p = payload[0]
                return (
                  <div className="rounded-lg border bg-white px-3 py-2 text-xs shadow-sm">
                    <div className="font-medium">x: {(p.payload?.x as number).toFixed(2)}</div>
                    <div className="text-gray-600">density: {(p.value as number).toFixed(6)}</div>
                  </div>
                )
              }}
            />
            <Area
              type="monotone"
              dataKey="y"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.25}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>

      <div className="mt-2 text-xs text-gray-500">

      </div>
    </div>
  )
}

