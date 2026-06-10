'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'

export function DisclaimerAlert() {
  return (
    <Alert>
      <AlertDescription>
        Please verify all information independently.
      </AlertDescription>
    </Alert>
  )
}