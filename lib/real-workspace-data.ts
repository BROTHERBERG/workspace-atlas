/**
 * Real workspace data loader
 * Loads actual coworking spaces from JSON file
 */

import workspacesData from '@/data/workspaces-expanded.json'
import { WorkspaceData } from './mock-data'

// Cache the loaded workspaces
let cachedWorkspaces: WorkspaceData[] | null = null

/**
 * Get all real workspaces from JSON file
 */
export function getRealWorkspaces(): WorkspaceData[] {
  if (cachedWorkspaces) {
    return cachedWorkspaces
  }

  cachedWorkspaces = workspacesData as WorkspaceData[]
  return cachedWorkspaces
}

/**
 * Get a specific workspace by ID
 */
export function getRealWorkspace(id: number): WorkspaceData | null {
  const workspaces = getRealWorkspaces()
  return workspaces.find(ws => ws.id === id) || null
}

/**
 * Get workspaces by city
 */
export function getRealWorkspacesByCity(city: string): WorkspaceData[] {
  const workspaces = getRealWorkspaces()
  return workspaces.filter(ws =>
    ws.location.city.toLowerCase() === city.toLowerCase()
  )
}

/**
 * Get workspaces by country
 */
export function getRealWorkspacesByCountry(country: string): WorkspaceData[] {
  const workspaces = getRealWorkspaces()
  return workspaces.filter(ws =>
    ws.location.country.toLowerCase() === country.toLowerCase()
  )
}

/**
 * Search workspaces
 */
export function searchRealWorkspaces(query: string): WorkspaceData[] {
  const workspaces = getRealWorkspaces()
  const lowerQuery = query.toLowerCase()

  return workspaces.filter(ws =>
    ws.name.toLowerCase().includes(lowerQuery) ||
    ws.description.toLowerCase().includes(lowerQuery) ||
    ws.location.city.toLowerCase().includes(lowerQuery) ||
    ws.location.country.toLowerCase().includes(lowerQuery) ||
    ws.location.address.toLowerCase().includes(lowerQuery)
  )
}
