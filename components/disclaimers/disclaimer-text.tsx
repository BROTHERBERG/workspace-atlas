export type RiskLevel = 'low' | 'medium' | 'high'

export function getDisclaimerText(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'low':
      return 'This information is provided for reference only.'
    case 'medium':
      return 'Please verify this information before making decisions.'
    case 'high':
      return 'Exercise caution. This is experimental functionality.'
    default:
      return 'Please use at your own discretion.'
  }
}