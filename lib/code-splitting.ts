/**
 * Dynamic imports for code splitting and lazy loading
 */

import { lazy } from 'react'
import { logger } from '@/lib/logger'

// Admin components - loaded only when needed
export const LazyPerformanceDashboard = lazy(() => 
  import('@/components/admin/PerformanceDashboard').then(module => ({
    default: module.PerformanceDashboard
  }))
)

export const LazyAdminDashboard = lazy(() => 
  import('@/app/admin/dashboard/page').then(module => ({
    default: module.default
  }))
)

export const LazyWorkspaceManagement = lazy(() => 
  import('@/app/admin/workspaces/page').then(module => ({
    default: module.default
  }))
)

export const LazyScoreRequestManagement = lazy(() => 
  import('@/app/admin/score-requests/page').then(module => ({
    default: module.default
  }))
)

export const LazyUserManagement = lazy(() => 
  import('@/app/admin/users/page').then(module => ({
    default: module.default
  }))
)

// Heavy components - loaded on demand
export const LazyGlobe = lazy(() => import('@/components/globe'))

export const LazyTalentProfiles = lazy(() => import('@/components/talent-profiles'))

export const LazyFeaturedSpaces = lazy(() => import('@/components/featured-spaces'))

// Workspace detail components
export const LazyWorkspaceGallery = lazy(() => 
  import('@/components/workspace/WorkspaceGallery').then(module => ({
    default: module.WorkspaceGallery
  }))
)

export const LazyWorkspaceReviews = lazy(() => 
  import('@/components/workspace/WorkspaceReviews').then(module => ({
    default: module.WorkspaceReviews
  }))
)

export const LazyWorkspaceLocation = lazy(() => 
  import('@/components/workspace/WorkspaceLocation').then(module => ({
    default: module.WorkspaceLocation
  }))
)

// Auth components
export const LazySignInForm = lazy(() => 
  import('@/components/auth/SignInForm').then(module => ({
    default: module.SignInForm
  }))
)

export const LazySignUpForm = lazy(() => 
  import('@/components/auth/SignUpForm').then(module => ({
    default: module.SignUpForm
  }))
)

// Profile components - will be created when needed
// export const LazyProfileSettings = lazy(() => 
//   import('@/components/profile/ProfileSettings').then(module => ({
//     default: module.ProfileSettings
//   }))
// )

// Forms - will be created when needed
// export const LazyContactForm = lazy(() => 
//   import('@/components/forms/ContactForm').then(module => ({
//     default: module.ContactForm
//   }))
// )

// export const LazyScoreRequestForm = lazy(() => 
//   import('@/components/forms/ScoreRequestForm').then(module => ({
//     default: module.ScoreRequestForm
//   }))
// )

// export const LazyWorkspaceSubmissionForm = lazy(() => 
//   import('@/components/forms/WorkspaceSubmissionForm').then(module => ({
//     default: module.WorkspaceSubmissionForm
//   }))
// )

/**
 * Route-based code splitting configuration
 */
export const routeBasedSplitting = {
  // Public routes - load immediately
  home: () => import('@/app/page'),
  directory: () => import('@/app/directory/page'),
  
  // Feature routes - load on navigation
  scoreMySpace: () => import('@/app/score-my-space/page'),
  havenPassport: () => import('@/app/haven-passport/page'),
  contact: () => import('@/app/contact/page'),
  
  // Auth routes - load on demand
  signIn: () => import('@/app/auth/signin/page'),
  signUp: () => import('@/app/auth/signup/page'),
  
  // Admin routes - load only for admin users
  adminDashboard: () => import('@/app/admin/dashboard/page'),
  adminWorkspaces: () => import('@/app/admin/workspaces/page'),
  adminUsers: () => import('@/app/admin/users/page'),
  adminScoreRequests: () => import('@/app/admin/score-requests/page'),
  
  // Profile routes - load for authenticated users
  profile: () => import('@/app/profile/page'),
  dashboard: () => import('@/app/dashboard/page'),
}

/**
 * Preload critical routes
 */
export function preloadCriticalRoutes() {
  if (typeof window !== 'undefined') {
    // Preload directory page on home page
    if (window.location.pathname === '/') {
      routeBasedSplitting.directory()
    }
    
    // Preload auth forms when auth-related buttons are hovered
    const authButtons = document.querySelectorAll('[data-auth-trigger]')
    authButtons.forEach(button => {
      button.addEventListener('mouseenter', () => {
        routeBasedSplitting.signIn()
        routeBasedSplitting.signUp()
      }, { once: true })
    })
    
    // Preload admin routes for admin users
    const adminLinks = document.querySelectorAll('[href*="/admin"]')
    if (adminLinks.length > 0) {
      routeBasedSplitting.adminDashboard()
    }
  }
}

/**
 * Component preloading utilities
 */
export class ComponentPreloader {
  private preloadedComponents = new Set<string>()

  preload(importFn: () => Promise<any>, key: string) {
    if (this.preloadedComponents.has(key)) return

    this.preloadedComponents.add(key)
    importFn().catch(error => {
      logger.warn(`Failed to preload component ${key}`, { error: error instanceof Error ? error.message : String(error) })
      this.preloadedComponents.delete(key)
    })
  }

  preloadOnHover(element: HTMLElement, importFn: () => Promise<any>, key: string) {
    const handleMouseEnter = () => {
      this.preload(importFn, key)
      element.removeEventListener('mouseenter', handleMouseEnter)
    }

    element.addEventListener('mouseenter', handleMouseEnter)
    
    // Cleanup function
    return () => element.removeEventListener('mouseenter', handleMouseEnter)
  }

  preloadOnVisible(element: HTMLElement, importFn: () => Promise<any>, key: string) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.preload(importFn, key)
            observer.unobserve(element)
          }
        })
      },
      { rootMargin: '100px' }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }
}

export const componentPreloader = new ComponentPreloader()

/**
 * Bundle splitting configuration
 */
export const bundleConfig = {
  // Vendor libraries that rarely change
  vendors: [
    'react',
    'react-dom',
    'next',
    '@prisma/client',
    'lucide-react'
  ],
  
  // Heavy libraries loaded separately
  heavy: [
    'three',
    'cobe',
    'faker',
    'date-fns'
  ],
  
  // Admin-only libraries
  admin: [
    'recharts',
    'react-table'
  ]
}

/**
 * Dynamic route preloading based on user behavior
 */
export function setupIntelligentPreloading() {
  if (typeof window === 'undefined') return

  // Track user interactions
  let interactionCount = 0
  let lastInteractionTime = Date.now()

  document.addEventListener('click', () => {
    interactionCount++
    lastInteractionTime = Date.now()
    
    // High engagement user - preload more aggressively
    if (interactionCount > 5) {
      routeBasedSplitting.directory()
      routeBasedSplitting.scoreMySpace()
    }
  })

  // Preload based on scroll depth
  let hasPreloadedOnScroll = false
  window.addEventListener('scroll', () => {
    if (hasPreloadedOnScroll) return

    const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
    
    if (scrollPercent > 50) {
      hasPreloadedOnScroll = true
      routeBasedSplitting.directory()
    }
  })

  // Connection-aware preloading
  if ('connection' in navigator) {
    const connection = (navigator as any).connection
    
    if (connection.effectiveType === '4g' && connection.downlink > 5) {
      // Fast connection - preload aggressively
      setTimeout(() => {
        routeBasedSplitting.directory()
        routeBasedSplitting.scoreMySpace()
      }, 2000)
    }
  }

  // Time-based preloading
  setTimeout(() => {
    // User has been on page for 10+ seconds, likely engaged
    routeBasedSplitting.directory()
  }, 10000)
}