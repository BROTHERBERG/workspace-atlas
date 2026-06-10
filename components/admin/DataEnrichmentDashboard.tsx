'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  AlertCircle, 
  Star,
  Image as ImageIcon,
  Clock,
  MapPin,
  Phone,
  Globe,
  RefreshCw,
  Sparkles,
  Database,
  TrendingUp,
  Zap
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { logger } from '@/lib/logger'

interface EnrichmentStats {
  totalWorkspaces: number
  enrichedWorkspaces: number
  recentEnrichments: number
  pendingEnrichments: number
  enrichmentRate: string
  apiConfigured: boolean
  lastChecked: string
}

interface EnrichmentCandidate {
  id: string
  name: string
  city?: string
  country?: string
  address?: string
  website?: string
  phone?: string
  rating?: number
  images: string[]
  enrichmentScore: number
  enrichmentReasons: string[]
  priority: 'high' | 'medium' | 'low'
}

interface EnrichmentPreview {
  confidence: number
  newPhotos: number
  newReviews: number
  hasOpeningHours: boolean
  hasPricing: boolean
  businessStatus?: string
  enhancedRating?: number
  enhancedWebsite?: string
  enhancedPhone?: string
}

export default function DataEnrichmentDashboard() {
  const [stats, setStats] = useState<EnrichmentStats | null>(null)
  const [candidates, setCandidates] = useState<EnrichmentCandidate[]>([])
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set())
  const [preview, setPreview] = useState<{ workspaceId: string; data: EnrichmentPreview } | null>(null)
  const [loading, setLoading] = useState(false)
  const [enriching, setEnriching] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [lastEnrichment, setLastEnrichment] = useState<any>(null)

  useEffect(() => {
    fetchStats()
    fetchCandidates()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/enrich-data?action=status')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      logger.error('Failed to fetch enrichment stats:', error instanceof Error ? error : new Error(String(error)))
    }
  }

  const fetchCandidates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/enrich-data?action=candidates&limit=20')
      const data = await response.json()
      
      if (data.success) {
        setCandidates(data.candidates)
      }
    } catch (error) {
      logger.error('Failed to fetch candidates:', error instanceof Error ? error : new Error(String(error)))
    } finally {
      setLoading(false)
    }
  }

  const previewEnrichment = async (workspaceId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/enrich-data?action=preview&workspaceId=${workspaceId}`)
      const data = await response.json()
      
      if (data.success && data.preview) {
        setPreview({ workspaceId, data: data.preview })
      }
    } catch (error) {
      logger.error('Failed to preview enrichment:', error instanceof Error ? error : new Error(String(error)))
    } finally {
      setLoading(false)
    }
  }

  const runEnrichment = async () => {
    if (selectedCandidates.size === 0) return

    try {
      setEnriching(true)
      const response = await fetch('/api/admin/enrich-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enrich_batch',
          workspaceIds: Array.from(selectedCandidates),
          batchSize: 5
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setLastEnrichment(data.results)
        setSelectedCandidates(new Set())
        
        // Refresh data
        await fetchStats()
        await fetchCandidates()
      }
    } catch (error) {
      logger.error('Failed to run enrichment:', error instanceof Error ? error : new Error(String(error)))
    } finally {
      setEnriching(false)
    }
  }

  const toggleCandidate = (candidateId: string) => {
    const newSelection = new Set(selectedCandidates)
    if (newSelection.has(candidateId)) {
      newSelection.delete(candidateId)
    } else {
      newSelection.add(candidateId)
    }
    setSelectedCandidates(newSelection)
  }

  const selectAll = () => {
    if (selectedCandidates.size === candidates.length) {
      setSelectedCandidates(new Set())
    } else {
      setSelectedCandidates(new Set(candidates.map(c => c.id)))
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-3 h-3" />
      case 'medium': return <Clock className="w-3 h-3" />
      case 'low': return <CheckCircle className="w-3 h-3" />
      default: return null
    }
  }

  if (!stats && loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Data Enrichment</h2>
          <p className="text-gray-600">Enhance workspace data with Google Places details</p>
        </div>
        <Button 
          onClick={fetchStats} 
          disabled={loading}
          variant="outline"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* API Configuration Alert */}
      {stats && !stats.apiConfigured && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Google Places API key is not configured. Please add your API key to enable data enrichment.
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enrichment Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.enrichmentRate}</div>
              <p className="text-xs text-muted-foreground">
                {stats.enrichedWorkspaces} of {stats.totalWorkspaces} workspaces
              </p>
              <Progress 
                value={parseInt(stats.enrichmentRate)} 
                className="w-full mt-2" 
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Enrichment</CardTitle>
              <Database className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingEnrichments.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Workspaces need enrichment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <Sparkles className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentEnrichments.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Enriched this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Status</CardTitle>
              <Zap className={`h-4 w-4 ${stats.apiConfigured ? 'text-green-500' : 'text-red-500'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.apiConfigured ? 'Ready' : 'Not Ready'}
              </div>
              <p className="text-xs text-muted-foreground">
                Google Places API
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Candidates</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold">Enrichment Candidates</h3>
              {candidates.length > 0 && (
                <Button 
                  onClick={selectAll}
                  variant="outline"
                  size="sm"
                >
                  {selectedCandidates.size === candidates.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </div>
            
            {selectedCandidates.size > 0 && (
              <Button 
                onClick={runEnrichment}
                disabled={enriching || !stats?.apiConfigured}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {enriching ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Enriching...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Enrich {selectedCandidates.size} Workspaces
                  </>
                )}
              </Button>
            )}
          </div>

          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </CardContent>
            </Card>
          ) : candidates.length > 0 ? (
            <div className="space-y-3">
              {candidates.map((candidate) => (
                <Card key={candidate.id} className={selectedCandidates.has(candidate.id) ? 'ring-2 ring-blue-500' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Checkbox 
                          checked={selectedCandidates.has(candidate.id)}
                          onCheckedChange={() => toggleCandidate(candidate.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{candidate.name}</h4>
                            <Badge className={getPriorityColor(candidate.priority)}>
                              {getPriorityIcon(candidate.priority)}
                              <span className="ml-1 capitalize">{candidate.priority}</span>
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            {candidate.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {candidate.city}, {candidate.country}
                              </span>
                            )}
                            {candidate.images.length > 0 && (
                              <span className="flex items-center gap-1">
                                <ImageIcon className="w-3 h-3" />
                                {candidate.images.length} images
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1 mb-2">
                            {candidate.enrichmentReasons.map((reason, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {reason}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <span>Enrichment Score: <strong>{candidate.enrichmentScore}</strong></span>
                            <Button 
                              onClick={() => previewEnrichment(candidate.id)}
                              variant="link" 
                              size="sm"
                              className="p-0 h-auto"
                            >
                              Preview Enrichment
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Sparkles className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No enrichment candidates found</p>
                <p className="text-sm text-gray-400">All workspaces may already be enriched</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          {preview ? (
            <Card>
              <CardHeader>
                <CardTitle>Enrichment Preview</CardTitle>
                <CardDescription>
                  Potential enhancements for workspace
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Match Confidence</h4>
                    <div className="flex items-center gap-2">
                      <Progress value={preview.data.confidence * 100} className="flex-1" />
                      <span className="text-sm font-medium">{Math.round(preview.data.confidence * 100)}%</span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Business Status</h4>
                    <Badge className={preview.data.businessStatus === 'OPERATIONAL' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {preview.data.businessStatus || 'Unknown'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <ImageIcon className="w-6 h-6 mx-auto mb-1" />
                    <div className="text-sm font-medium">{preview.data.newPhotos}</div>
                    <div className="text-xs text-gray-500">New Photos</div>
                  </div>
                  
                  <div className="text-center">
                    <Star className="w-6 h-6 mx-auto mb-1" />
                    <div className="text-sm font-medium">{preview.data.newReviews}</div>
                    <div className="text-xs text-gray-500">New Reviews</div>
                  </div>
                  
                  <div className="text-center">
                    <Clock className="w-6 h-6 mx-auto mb-1" />
                    <div className="text-sm font-medium">{preview.data.hasOpeningHours ? '✓' : '✗'}</div>
                    <div className="text-xs text-gray-500">Opening Hours</div>
                  </div>
                  
                  <div className="text-center">
                    <TrendingUp className="w-6 h-6 mx-auto mb-1" />
                    <div className="text-sm font-medium">{preview.data.hasPricing ? '✓' : '✗'}</div>
                    <div className="text-xs text-gray-500">Pricing Info</div>
                  </div>
                </div>

                {(preview.data.enhancedWebsite || preview.data.enhancedPhone || preview.data.enhancedRating) && (
                  <div>
                    <h4 className="font-medium mb-2">Enhanced Information</h4>
                    <div className="space-y-2">
                      {preview.data.enhancedWebsite && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          <span className="text-sm">Website: {preview.data.enhancedWebsite}</span>
                        </div>
                      )}
                      {preview.data.enhancedPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span className="text-sm">Phone: {preview.data.enhancedPhone}</span>
                        </div>
                      )}
                      {preview.data.enhancedRating && (
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4" />
                          <span className="text-sm">Rating: {preview.data.enhancedRating}/5</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Sparkles className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Select a workspace from the candidates tab to preview enrichment</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {lastEnrichment ? (
            <Card>
              <CardHeader>
                <CardTitle>Latest Enrichment Results</CardTitle>
                <CardDescription>Results from your most recent enrichment batch</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <div className="text-2xl font-bold">{lastEnrichment.processed}</div>
                    <div className="text-sm text-gray-500">Processed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{lastEnrichment.successful}</div>
                    <div className="text-sm text-gray-500">Successful</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{lastEnrichment.failed}</div>
                    <div className="text-sm text-gray-500">Failed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{Math.round(lastEnrichment.averageConfidence * 100)}%</div>
                    <div className="text-sm text-gray-500">Avg Confidence</div>
                  </div>
                </div>
                
                {lastEnrichment.details && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Enrichment Details</h4>
                    {lastEnrichment.details.map((detail: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">Workspace {detail.workspaceId.slice(-8)}</span>
                          {detail.success ? (
                            <Badge className="ml-2 bg-green-100 text-green-800">Success</Badge>
                          ) : (
                            <Badge className="ml-2 bg-red-100 text-red-800">Failed</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {detail.success ? (
                            `${detail.hasPhotos} photos, ${detail.hasReviews} reviews`
                          ) : (
                            detail.error
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Database className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No enrichment results yet</p>
                <p className="text-sm text-gray-400">Run an enrichment batch to see results here</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}