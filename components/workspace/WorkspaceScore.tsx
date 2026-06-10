import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Globe, Share2, Star, Zap } from 'lucide-react'

interface WorkspaceScoreData {
  id: string
  overallScore: number
  websiteScore: number
  socialScore: number
  reviewScore: number
  presenceScore: number
  lastCalculated: Date
}

interface WorkspaceScoreProps {
  scoreData: WorkspaceScoreData
}

export function WorkspaceScore({ scoreData }: WorkspaceScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLevel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'Very Good'
    if (score >= 70) return 'Good'
    if (score >= 60) return 'Fair'
    return 'Needs Improvement'
  }

  const scoreCategories = [
    {
      name: 'Website Quality',
      score: scoreData.websiteScore,
      icon: <Globe className="h-4 w-4" />,
      description: 'User experience, speed, and functionality'
    },
    {
      name: 'Social Presence',
      score: scoreData.socialScore,
      icon: <Share2 className="h-4 w-4" />,
      description: 'Social media engagement and activity'
    },
    {
      name: 'Review Score',
      score: scoreData.reviewScore,
      icon: <Star className="h-4 w-4" />,
      description: 'Online reviews and ratings'
    },
    {
      name: 'Digital Presence',
      score: scoreData.presenceScore,
      icon: <Zap className="h-4 w-4" />,
      description: 'Online visibility and discoverability'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Digital Score Analysis
          </div>
          <Badge variant="outline" className="text-xs">
            Updated {new Date(scoreData.lastCalculated).toLocaleDateString()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
          <div className={`text-4xl font-bold mb-2 ${getScoreColor(scoreData.overallScore)}`}>
            {scoreData.overallScore}
          </div>
          <div className="text-lg font-semibold text-gray-700 mb-1">
            {getScoreLevel(scoreData.overallScore)}
          </div>
          <div className="text-sm text-gray-500">Overall Digital Score</div>
          <Progress 
            value={scoreData.overallScore} 
            className="mt-4 h-2"
          />
        </div>

        {/* Score Breakdown */}
        <div>
          <h3 className="font-semibold mb-4">Score Breakdown</h3>
          <div className="space-y-4">
            {scoreCategories.map((category) => (
              <div key={category.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                      {category.icon}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{category.name}</div>
                      <div className="text-xs text-gray-500">{category.description}</div>
                    </div>
                  </div>
                  <div className={`font-bold ${getScoreColor(category.score)}`}>
                    {category.score}
                  </div>
                </div>
                <Progress value={category.score} className="h-2" />
              </div>
            ))}
          </div>
        </div>

        {/* Score Interpretation */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">What this means</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• <strong>90-100:</strong> Exceptional digital presence</p>
            <p>• <strong>80-89:</strong> Strong online visibility</p>
            <p>• <strong>70-79:</strong> Good digital foundation</p>
            <p>• <strong>60-69:</strong> Room for improvement</p>
            <p>• <strong>Below 60:</strong> Significant digital gaps</p>
          </div>
        </div>

        {/* Improvement Suggestions */}
        {scoreData.overallScore < 80 && (
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-semibold text-yellow-900 mb-2">Suggestions for Improvement</h4>
            <div className="text-sm text-yellow-800 space-y-1">
              {scoreData.websiteScore < 80 && (
                <p>• Optimize website speed and user experience</p>
              )}
              {scoreData.socialScore < 80 && (
                <p>• Increase social media engagement and posting frequency</p>
              )}
              {scoreData.reviewScore < 80 && (
                <p>• Encourage more customer reviews and respond to feedback</p>
              )}
              {scoreData.presenceScore < 80 && (
                <p>• Improve online listings and directory presence</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}