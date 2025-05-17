"use client"

import { useState } from "react"
import { Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"

interface DigitalScoreWidgetProps {
  score: number
  mini?: boolean
  detailed?: boolean
}

export default function DigitalScoreWidget({ score, mini = false, detailed = false }: DigitalScoreWidgetProps) {
  const [showDetails, setShowDetails] = useState(false)

  // Mock data for detailed scores
  const detailedScores = {
    siteSpeed: 88,
    seoScore: 92,
    mobileUX: 95,
    socialProof: 85,
  }

  // Determine color based on score
  const getScoreColor = (value: number) => {
    if (value >= 90) return "text-green-500"
    if (value >= 70) return "text-[#f9cb16]"
    return "text-red-500"
  }

  // Determine progress color based on score
  const getProgressColor = (value: number) => {
    if (value >= 90) return "bg-green-500"
    if (value >= 70) return "bg-[#f9cb16]"
    return "bg-red-500"
  }

  if (mini) {
    return (
      <TooltipProvider>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Digital Score:</span>
          <span className={`text-sm font-bold ${getScoreColor(score)}`}>{score}</span>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-sm">
                Our proprietary Digital Presence Score measures online visibility, user experience, and digital
                engagement.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    )
  }

  return (
    <div className="rounded-lg border-2 border-black bg-card p-4 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center justify-between">
        <h3 className="font-cal text-lg">Digital Presence Score</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-sm">
                Our proprietary Digital Presence Score measures online visibility, user experience, and digital
                engagement.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="mt-4 flex items-center space-x-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-black">
          <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
        </div>
        <div className="flex-1">
          <Progress value={score} className={`h-2 ${getProgressColor(score)}`} />
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>
      </div>

      {detailed && (
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="mt-4 text-sm font-medium text-black hover:underline"
        >
          {showDetails ? "Hide Details" : "Show Details"}
        </button>
      )}

      {detailed && showDetails && (
        <div className="mt-4 space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm">Site Speed</span>
              <span className={`text-sm font-bold ${getScoreColor(detailedScores.siteSpeed)}`}>
                {detailedScores.siteSpeed}
              </span>
            </div>
            <Progress
              value={detailedScores.siteSpeed}
              className={`h-1.5 ${getProgressColor(detailedScores.siteSpeed)}`}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm">SEO Score</span>
              <span className={`text-sm font-bold ${getScoreColor(detailedScores.seoScore)}`}>
                {detailedScores.seoScore}
              </span>
            </div>
            <Progress
              value={detailedScores.seoScore}
              className={`h-1.5 ${getProgressColor(detailedScores.seoScore)}`}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm">Mobile UX</span>
              <span className={`text-sm font-bold ${getScoreColor(detailedScores.mobileUX)}`}>
                {detailedScores.mobileUX}
              </span>
            </div>
            <Progress
              value={detailedScores.mobileUX}
              className={`h-1.5 ${getProgressColor(detailedScores.mobileUX)}`}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm">Social Proof</span>
              <span className={`text-sm font-bold ${getScoreColor(detailedScores.socialProof)}`}>
                {detailedScores.socialProof}
              </span>
            </div>
            <Progress
              value={detailedScores.socialProof}
              className={`h-1.5 ${getProgressColor(detailedScores.socialProof)}`}
            />
          </div>
        </div>
      )}

      <div className="mt-4">
        <button className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 shadow-[3px_3px_0px_0px_rgba(250,204,21,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
          Upgrade My Score
        </button>
      </div>
    </div>
  )
}
