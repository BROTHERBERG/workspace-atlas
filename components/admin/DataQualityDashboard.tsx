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
  XCircle,
  Copy,
  RefreshCw,
  TrendingUp,
  Database,
  Search
} from 'lucide-react'
import { logger } from '@/lib/logger'

interface QualityStats {
  totalWorkspaces: number
  validWorkspaces: number
  invalidWorkspaces: number
  averageQualityScore: number
  estimatedDuplicates: number
  validationThreshold: number
  lastChecked: string
  commonIssues: string[]
}

interface ValidationResult {
  summary: {
    total: number
    valid: number
    invalid: number
    averageScore: number
    commonIssues: string[]
  }
  invalidEntries: Array<{
    data: {
      name: string
      source: string
    }
    validation: {
      errors: string[]
      warnings: string[]
      score: number
    }
  }>
}

interface Duplicate {
  workspace1: {
    id: string
    name: string
    city?: string
  }
  workspace2: {
    id: string
    name: string
    city?: string
  }
  confidence: number
  duplicateFields: string[]
}

export default function DataQualityDashboard() {
  const [stats, setStats] = useState<QualityStats | null>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [duplicates, setDuplicates] = useState<Duplicate[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/data-quality?action=status')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      logger.error('Failed to fetch stats:', error instanceof Error ? error : new Error(String(error)))
    } finally {
      setLoading(false)
    }
  }

  const runValidation = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/data-quality?action=validate&limit=200')
      const data = await response.json()
      
      if (data.success) {
        setValidation(data.results)
      }
    } catch (error) {
      logger.error('Failed to run validation:', error instanceof Error ? error : new Error(String(error)))
    } finally {
      setLoading(false)
    }
  }

  const findDuplicates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/data-quality?action=duplicates&limit=200')
      const data = await response.json()
      
      if (data.success) {
        setDuplicates(data.duplicates)
      }
    } catch (error) {
      logger.error('Failed to find duplicates:', error instanceof Error ? error : new Error(String(error)))
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>
    return <Badge className="bg-red-100 text-red-800">Needs Work</Badge>
  }

  if (loading && !stats) {
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
          <h2 className="text-2xl font-bold">Data Quality Dashboard</h2>
          <p className="text-gray-600">Monitor and improve workspace data quality</p>
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

      {/* Overview Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Workspaces</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWorkspaces.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valid Entries</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.validWorkspaces.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((stats.validWorkspaces / stats.totalWorkspaces) * 100)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(stats.averageQualityScore)}`}>
                {stats.averageQualityScore}/100
              </div>
              <div className="mt-2">
                {getScoreBadge(stats.averageQualityScore)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Est. Duplicates</CardTitle>
              <Copy className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.estimatedDuplicates.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Potential matches</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="duplicates">Duplicates</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {stats && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Quality Overview</CardTitle>
                  <CardDescription>
                    Last checked: {new Date(stats.lastChecked).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Data Quality</span>
                        <span>{stats.averageQualityScore}%</span>
                      </div>
                      <Progress value={stats.averageQualityScore} className="w-full" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Valid Entries</span>
                        <span>{Math.round((stats.validWorkspaces / stats.totalWorkspaces) * 100)}%</span>
                      </div>
                      <Progress value={(stats.validWorkspaces / stats.totalWorkspaces) * 100} className="w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Common Issues</CardTitle>
                  <CardDescription>Most frequent data quality problems</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.commonIssues.length > 0 ? (
                    <div className="space-y-2">
                      {stats.commonIssues.slice(0, 8).map((issue, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm">{issue}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No common issues found</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Data Validation</h3>
            <Button onClick={runValidation} disabled={loading}>
              <Search className="w-4 h-4 mr-2" />
              Run Validation
            </Button>
          </div>

          {validation && (
            <>
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Validated {validation.summary.total} entries. 
                  {validation.summary.valid} valid, {validation.summary.invalid} invalid. 
                  Average score: {validation.summary.averageScore}/100
                </AlertDescription>
              </Alert>

              {validation.invalidEntries.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Invalid Entries</CardTitle>
                    <CardDescription>Sample of entries that need attention</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {validation.invalidEntries.map((entry, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium">{entry.data.name}</h4>
                              <p className="text-sm text-gray-500">Source: {entry.data.source}</p>
                            </div>
                            <Badge variant="destructive">Score: {entry.validation.score}/100</Badge>
                          </div>
                          
                          {entry.validation.errors.length > 0 && (
                            <div className="mt-2">
                              <h5 className="text-sm font-medium text-red-600 mb-1">Errors:</h5>
                              <ul className="text-sm space-y-1">
                                {entry.validation.errors.map((error, i) => (
                                  <li key={i} className="flex items-center gap-2">
                                    <XCircle className="w-3 h-3 text-red-500" />
                                    {error}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {entry.validation.warnings.length > 0 && (
                            <div className="mt-2">
                              <h5 className="text-sm font-medium text-yellow-600 mb-1">Warnings:</h5>
                              <ul className="text-sm space-y-1">
                                {entry.validation.warnings.slice(0, 3).map((warning, i) => (
                                  <li key={i} className="flex items-center gap-2">
                                    <AlertCircle className="w-3 h-3 text-yellow-500" />
                                    {warning}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="duplicates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Duplicate Detection</h3>
            <Button onClick={findDuplicates} disabled={loading}>
              <Copy className="w-4 h-4 mr-2" />
              Find Duplicates
            </Button>
          </div>

          {duplicates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Potential Duplicates</CardTitle>
                <CardDescription>Found {duplicates.length} potential duplicate pairs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {duplicates.map((duplicate, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium">Duplicate Pair #{index + 1}</h4>
                        <Badge variant={duplicate.confidence > 0.9 ? "destructive" : "secondary"}>
                          {Math.round(duplicate.confidence * 100)}% match
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="border rounded p-3">
                          <h5 className="font-medium text-sm">{duplicate.workspace1.name}</h5>
                          {duplicate.workspace1.city && (
                            <p className="text-sm text-gray-500">{duplicate.workspace1.city}</p>
                          )}
                        </div>
                        <div className="border rounded p-3">
                          <h5 className="font-medium text-sm">{duplicate.workspace2.name}</h5>
                          {duplicate.workspace2.city && (
                            <p className="text-sm text-gray-500">{duplicate.workspace2.city}</p>
                          )}
                        </div>
                      </div>

                      {duplicate.duplicateFields.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-1">Matching fields:</p>
                          <div className="flex gap-2">
                            {duplicate.duplicateFields.map((field, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {field}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {duplicates.length === 0 && activeTab === 'duplicates' && !loading && (
            <Card>
              <CardContent className="text-center py-8">
                <Copy className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No duplicates analysis run yet</p>
                <Button onClick={findDuplicates} className="mt-4">
                  Run Duplicate Detection
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}