'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'

export function RiskBanner() {
  return (
    <Alert className="border-yellow-500 bg-yellow-500/10">
      <AlertDescription>
        This is experimental AI functionality. Use at your own discretion.
      </AlertDescription>
    </Alert>
  )
}