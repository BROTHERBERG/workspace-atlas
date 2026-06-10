import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { scoringEngine } from '@/lib/scoring-engine'
import { sendScoreCompletedEmail } from '@/lib/email'
import { logger } from '@/lib/logger'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get the score request
    const scoreRequest = await prisma.scoreRequest.findUnique({
      where: { id },
      include: { workspace: true, user: true }
    })

    if (!scoreRequest) {
      return NextResponse.json({ error: 'Score request not found' }, { status: 404 })
    }

    if (scoreRequest.status !== 'PENDING') {
      return NextResponse.json({ error: 'Request is not pending' }, { status: 400 })
    }

    // Update status to processing
    await prisma.scoreRequest.update({
      where: { id },
      data: { 
        status: 'PROCESSING'
      }
    })

    // Here you would typically trigger the actual scoring process
    // This could involve:
    // 1. Website crawling and analysis
    // 2. Social media presence checking
    // 3. SEO analysis
    // 4. Online review aggregation
    // 5. Digital footprint assessment
    
    // For now, we'll simulate this with a placeholder
    // In a real implementation, you might queue this as a background job
    
    // Process scoring with the Digital Scoring Engine
    setTimeout(async () => {
      try {
        logger.info(`Starting automated analysis for ${scoreRequest.websiteUrl}`)
        
        const scoringResult = await scoringEngine.analyzeWorkspace(
          scoreRequest.websiteUrl || scoreRequest.spaceName,
          scoreRequest.socialMediaUrls
        )

        const analysisNotes = `
AUTOMATED DIGITAL ANALYSIS - ${new Date().toLocaleDateString()}

🎯 OVERALL SCORE: ${scoringResult.overallScore}/100

📊 BREAKDOWN:
• Website Performance: ${scoringResult.breakdown.websitePerformance}/100
• Social Media Presence: ${scoringResult.breakdown.socialMediaPresence}/100
• Online Reviews: ${scoringResult.breakdown.onlineReviews}/100
• SEO Optimization: ${scoringResult.breakdown.seoOptimization}/100
• Digital Footprint: ${scoringResult.breakdown.digitalFootprint}/100
• Content Quality: ${scoringResult.breakdown.contentQuality}/100
• User Experience: ${scoringResult.breakdown.userExperience}/100
• Mobile Optimization: ${scoringResult.breakdown.mobileOptimization}/100

💪 STRENGTHS:
${scoringResult.analysis.strengths.map(s => `• ${s}`).join('\n')}

⚠️ AREAS FOR IMPROVEMENT:
${scoringResult.analysis.weaknesses.map(w => `• ${w}`).join('\n')}

🚀 RECOMMENDATIONS:
${scoringResult.analysis.recommendations.map(r => `• ${r}`).join('\n')}

📈 Analysis completed in ${scoringResult.metadata.processingTime}ms
        `.trim()

        await prisma.scoreRequest.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            score: scoringResult.overallScore,
            notes: analysisNotes,
            completedAt: new Date()
          }
        })

        // Update workspace score if linked
        if (scoreRequest.workspace) {
          await prisma.workspace.update({
            where: { id: scoreRequest.workspace.id },
            data: { 
              digitalScore: scoringResult.overallScore
            }
          })

          // Update workspace score with detailed breakdown
          await prisma.workspaceScore.upsert({
            where: { workspaceId: scoreRequest.workspace.id },
            update: {
              overallScore: scoringResult.overallScore,
              websiteScore: scoringResult.breakdown.websitePerformance,
              socialScore: scoringResult.breakdown.socialMediaPresence,
              reviewScore: scoringResult.breakdown.onlineReviews,
              presenceScore: scoringResult.breakdown.digitalFootprint,
              lastCalculated: new Date()
            },
            create: {
              workspaceId: scoreRequest.workspace.id,
              overallScore: scoringResult.overallScore,
              websiteScore: scoringResult.breakdown.websitePerformance,
              socialScore: scoringResult.breakdown.socialMediaPresence,
              reviewScore: scoringResult.breakdown.onlineReviews,
              presenceScore: scoringResult.breakdown.digitalFootprint,
              lastCalculated: new Date()
            }
          })
        }

        // Send completion email to the user
        if (scoreRequest.user?.email) {
          try {
            await sendScoreCompletedEmail({
              email: scoreRequest.user.email,
              spaceName: scoreRequest.workspace?.name || 'Your Workspace',
              score: scoringResult.overallScore,
              breakdown: {
                websiteScore: Math.round(scoringResult.overallScore * 0.25),
                socialMediaScore: Math.round(scoringResult.overallScore * 0.25),
                contentScore: Math.round(scoringResult.overallScore * 0.25),
                engagementScore: Math.round(scoringResult.overallScore * 0.25)
              },
              requestId: scoreRequest.id,
              completedAt: new Date()
            })
            logger.info(`📧 Score completion email sent to ${scoreRequest.user.email}`)
          } catch (error) {
            logger.error('Failed to send score completion email:', error instanceof Error ? error : new Error(String(error)))
          }
        }

        logger.info(`✅ Analysis completed for ${scoreRequest.websiteUrl}: ${scoringResult.overallScore}/100`)
      } catch (error) {
        logger.error('Error completing automated score:', error instanceof Error ? error : new Error(String(error)))
        // Mark as failed if automation fails
        await prisma.scoreRequest.update({
          where: { id },
          data: {
            status: 'FAILED',
            notes: `Automated scoring process failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            completedAt: new Date()
          }
        })
      }
    }, 2000) // 2 second delay to simulate processing

    return NextResponse.json({ 
      message: 'Score processing started',
      status: 'PROCESSING'
    })
  } catch (error) {
    logger.error('Error starting score processing:', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Failed to start score processing' },
      { status: 500 }
    )
  }
}