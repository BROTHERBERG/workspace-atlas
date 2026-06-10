"use client"

import React from "react"
import { logger } from "@/lib/logger"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react"

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  severity?: ErrorSeverity
  context?: string
  showDetails?: boolean
  enableRetry?: boolean
  enableReport?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
  retryCount: number
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeout?: NodeJS.Timeout

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { 
      hasError: false, 
      retryCount: 0 
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })

    // Structured logging with context
    const errorContext = {
      context: this.props.context || 'Unknown',
      severity: this.props.severity || 'medium',
      retryCount: this.state.retryCount,
      errorStack: error.stack,
      componentStack: errorInfo.componentStack,
      userId: this.getUserId() || undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
      url: typeof window !== 'undefined' ? window.location.href : 'SSR'
    }

    logger.error('React Error Boundary caught error', error, errorContext)

    // Custom error handler
    this.props.onError?.(error, errorInfo)

    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo, errorContext)
    }
  }

  private getUserId(): string | null {
    // In a real app, get from auth context
    return typeof window !== 'undefined' ? localStorage.getItem('userId') : null
  }

  private reportError(error: Error, errorInfo: React.ErrorInfo, context: object) {
    // Integrate with error tracking service (Sentry, LogRocket, etc.)
    // For now, just log to console in production
    if (typeof window !== 'undefined') {
      window.console?.error?.('Error reported:', { error, errorInfo, context })
    }
  }

  private handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1
    
    logger.info('Error boundary retry attempted', {
      context: this.props.context,
      retryCount: newRetryCount
    })

    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      retryCount: newRetryCount
    })

    // Auto-retry limit
    if (newRetryCount >= 3) {
      logger.warn('Error boundary max retries reached', {
        context: this.props.context,
        retryCount: newRetryCount
      })
    }
  }

  private handleReport = () => {
    if (this.state.error && this.state.errorInfo) {
      logger.info('User reported error', {
        context: this.props.context,
        error: this.state.error.message
      })

      // In a real app, open feedback form or report dialog
      alert('Error reported. Thank you for helping us improve!')
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { error, retryCount } = this.state
      const { severity = 'medium', context, showDetails = false, enableRetry = true, enableReport = true } = this.props
      
      const getSeverityColor = (sev: ErrorSeverity) => {
        switch (sev) {
          case 'low': return 'border-yellow-300 bg-yellow-50'
          case 'medium': return 'border-orange-300 bg-orange-50'
          case 'high': return 'border-red-300 bg-red-50'
          case 'critical': return 'border-red-500 bg-red-100'
          default: return 'border-gray-300 bg-gray-50'
        }
      }

      const getSeverityText = (sev: ErrorSeverity) => {
        switch (sev) {
          case 'low': return 'Minor Issue'
          case 'medium': return 'Something went wrong'
          case 'high': return 'Error occurred'
          case 'critical': return 'Critical Error'
          default: return 'Error'
        }
      }

      const canRetry = enableRetry && retryCount < 3

      return (
        <div className="flex items-center justify-center p-6">
          <Card className={`max-w-lg w-full border-2 ${getSeverityColor(severity)}`}>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <AlertTriangle 
                    className={`h-12 w-12 ${
                      severity === 'critical' ? 'text-red-600' : 
                      severity === 'high' ? 'text-red-500' :
                      severity === 'medium' ? 'text-orange-500' : 'text-yellow-500'
                    }`} 
                  />
                </div>
                
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {getSeverityText(severity)}
                </h2>
                
                {context && (
                  <p className="text-sm text-gray-600 mb-2">
                    in {context}
                  </p>
                )}
                
                <p className="text-gray-700 mb-4">
                  {error?.message || "An unexpected error occurred. Please try again."}
                </p>

                {retryCount > 0 && (
                  <p className="text-sm text-gray-500 mb-4">
                    Retry attempt: {retryCount}/3
                  </p>
                )}

                {showDetails && error?.stack && (
                  <details className="text-left mb-4 p-3 bg-gray-100 rounded text-xs">
                    <summary className="cursor-pointer text-gray-600 mb-2">
                      Technical Details
                    </summary>
                    <pre className="whitespace-pre-wrap overflow-auto max-h-32">
                      {error.stack}
                    </pre>
                  </details>
                )}

                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  {canRetry && (
                    <Button 
                      onClick={this.handleRetry}
                      variant="default"
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Try Again
                    </Button>
                  )}
                  
                  <Button 
                    onClick={() => window.location.href = '/'}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Home className="h-4 w-4" />
                    Go Home
                  </Button>

                  {enableReport && (
                    <Button 
                      onClick={this.handleReport}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Bug className="h-4 w-4" />
                      Report Issue
                    </Button>
                  )}
                </div>

                {retryCount >= 3 && (
                  <p className="text-sm text-red-600 mt-4">
                    Multiple retry attempts failed. Please refresh the page or contact support.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component for wrapping components with error boundaries
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  errorBoundaryProps?: Partial<ErrorBoundaryProps>
) {
  const displayName = Component.displayName || Component.name || 'Component'
  
  const WrappedComponent = function(props: T) {
    return (
      <ErrorBoundary 
        context={`${displayName} Component`}
        {...errorBoundaryProps}
      >
        <Component {...props} />
      </ErrorBoundary>
    )
  }
  
  WrappedComponent.displayName = `withErrorBoundary(${displayName})`
  return WrappedComponent
}

// Specialized error boundaries for different parts of the app
export function PageErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      context="Page"
      severity="high"
      showDetails={process.env.NODE_ENV === 'development'}
      enableRetry={true}
      enableReport={true}
    >
      {children}
    </ErrorBoundary>
  )
}

export function ComponentErrorBoundary({ 
  children, 
  componentName 
}: { 
  children: React.ReactNode
  componentName?: string 
}) {
  return (
    <ErrorBoundary
      context={componentName ? `${componentName} Component` : 'Component'}
      severity="medium"
      showDetails={false}
      enableRetry={true}
      enableReport={false}
    >
      {children}
    </ErrorBoundary>
  )
}

export function AsyncErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      context="Async Operation"
      severity="medium"
      showDetails={false}
      enableRetry={true}
      enableReport={true}
    >
      {children}
    </ErrorBoundary>
  )
}

export function CriticalErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      context="Critical System"
      severity="critical"
      showDetails={process.env.NODE_ENV === 'development'}
      enableRetry={false}
      enableReport={true}
    >
      {children}
    </ErrorBoundary>
  )
}

// Error boundary hook for functional components
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    logger.error('Manual error capture', error, {
      context: 'useErrorBoundary',
      timestamp: new Date().toISOString()
    })
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { captureError, resetError }
}

// Error boundary provider for global error handling
export function ErrorBoundaryProvider({ children }: { children: React.ReactNode }) {
  const handleGlobalError = React.useCallback((error: Error, errorInfo: React.ErrorInfo) => {
    logger.error('Global error boundary triggered', error, {
      context: 'Global',
      errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR'
    })
  }, [])

  return (
    <ErrorBoundary
      context="Application"
      severity="critical"
      showDetails={process.env.NODE_ENV === 'development'}
      enableRetry={true}
      enableReport={true}
      onError={handleGlobalError}
    >
      {children}
    </ErrorBoundary>
  )
}