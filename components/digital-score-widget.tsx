"use client"

import { Info, Check, X, ShieldCheck, Smartphone, Search, Share2, CalendarCheck } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import type { Band, DigitalSignals } from "@/lib/spaces"

interface DigitalScoreWidgetProps {
  score: number | null
  band: Band
  mini?: boolean
  detailed?: boolean
  signals?: DigitalSignals
  gaps?: string[]
  confidence?: "high" | "low" | null
  breakdown?: Record<string, number> | null
}

const BREAKDOWN_LABELS: { key: string; label: string }[] = [
  { key: "security", label: "Security" },
  { key: "performance", label: "Performance" },
  { key: "mobile", label: "Mobile" },
  { key: "seo", label: "SEO depth" },
  { key: "social", label: "Social reach" },
  { key: "conversion", label: "Conversion" },
  { key: "content", label: "Content & freshness" },
]

function barColor(v: number) {
  if (v >= 75) return "bg-emerald-500"
  if (v >= 50) return "bg-[#f9cb16]"
  if (v >= 30) return "bg-orange-500"
  return "bg-red-500"
}

function scoreColor(value: number | null) {
  if (value === null) return "text-gray-400"
  if (value >= 85) return "text-emerald-600"
  if (value >= 70) return "text-lime-600"
  if (value >= 55) return "text-[#caa406]"
  if (value >= 40) return "text-orange-600"
  return "text-red-600"
}
function progressColor(value: number | null) {
  if (value === null) return "[&>div]:bg-gray-400"
  if (value >= 85) return "[&>div]:bg-emerald-500"
  if (value >= 70) return "[&>div]:bg-lime-500"
  if (value >= 55) return "[&>div]:bg-[#f9cb16]"
  if (value >= 40) return "[&>div]:bg-orange-500"
  return "[&>div]:bg-red-500"
}

const TOOLTIP =
  "Live Digital Presence Score — measured by rendering each site in a real browser and checking HTTPS, mobile-readiness, SEO meta, social links, and booking conversion. No estimates."

export default function DigitalScoreWidget({
  score,
  band,
  mini = false,
  detailed = false,
  signals,
  gaps = [],
  confidence,
  breakdown,
}: DigitalScoreWidgetProps) {
  const display = score === null ? "—" : score

  if (mini) {
    return (
      <TooltipProvider>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-gray-500">Digital Score</span>
          <span className={`text-sm font-bold ${scoreColor(score)}`}>
            {display}
            {band !== "?" && <span className="ml-1 text-xs">({band})</span>}
          </span>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-3.5 w-3.5 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-sm">{TOOLTIP}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    )
  }

  const checks = signals
    ? [
        { ok: signals.https === true, label: "Secure (HTTPS)", icon: ShieldCheck },
        { ok: signals.mobileOptimized === true, label: "Mobile-optimized", icon: Smartphone },
        { ok: signals.metaDescription === true, label: "SEO meta description", icon: Search },
        { ok: (signals.socialCount ?? 0) > 0, label: "Social links present", icon: Share2 },
        { ok: signals.onlineBooking === true, label: "Booking / conversion CTA", icon: CalendarCheck },
      ]
    : []

  return (
    <div className="rounded-lg border-2 border-black bg-card p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center justify-between">
        <h3 className="font-cal text-lg">Digital Presence Score</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-sm">{TOOLTIP}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="mt-4 flex items-center space-x-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-black">
          <span className={`text-2xl font-bold ${scoreColor(score)}`}>{display}</span>
        </div>
        <div className="flex-1">
          <Progress value={score ?? 0} className={`h-2 ${progressColor(score)}`} />
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>
      </div>

      {confidence === "low" && (
        <p className="mt-3 rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
          Automated scan was blocked (bot protection) — flagged for manual review rather than scored.
        </p>
      )}

      {detailed && breakdown && (
        <div className="mt-5 space-y-2.5 border-t border-gray-100 pt-4">
          {BREAKDOWN_LABELS.map(({ key, label }) => {
            const v = breakdown[key] ?? 0
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-sm text-gray-600">{label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div className={`h-full rounded-full ${barColor(v)}`} style={{ width: `${v}%` }} />
                </div>
                <span className="w-7 text-right text-xs font-semibold text-gray-500">{v}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Fallback to signal checks when no breakdown (e.g. no-site / blocked) */}
      {detailed && !breakdown && checks.length > 0 && (
        <ul className="mt-4 space-y-2">
          {checks.map((c) => (
            <li key={c.label} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-gray-700">
                <c.icon className="h-4 w-4 text-gray-400" />
                {c.label}
              </span>
              {c.ok ? <Check className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4 text-red-500" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
