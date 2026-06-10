// Workspace filter type definitions

export interface WorkspaceFilters {
  maxPrice?: number
  minScore?: number
  amenities?: string[]
  types?: string[]
  location?: string
  searchQuery?: string
  sortBy?: 'name' | 'score' | 'price' | 'location'
  sortOrder?: 'asc' | 'desc'
}

export interface AmenityOption {
  id: string
  label: string
}

export interface SpaceTypeOption {
  id: string
  label: string
}

export interface FilterChangeEvent {
  filters: WorkspaceFilters
  changedField?: keyof WorkspaceFilters
}