import { db } from './db'

export interface ContemptRiskResult {
  judgmentId: string
  title: string
  courtName: string | null
  caseNumber: string | null
  score: number
  level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  factors: {
    overdueCount: number
    totalObligations: number
    maxDaysOverdue: number
    avgDaysOverdue: number
    complianceRate: number
    highPriorityOverdue: number
    escalationCount: number
  }
}

/**
 * Calculates a Contempt Risk Score (0-100) for a judgment based on:
 * (a) Number of overdue obligations
 * (b) Days past deadline
 * (c) Historical compliance rate of the assigned department
 * (d) Severity/priority of the original orders
 * (e) Escalation events triggered
 */
export async function calculateContemptRiskScore(judgmentId: string): Promise<ContemptRiskResult> {
  const judgment = await db.judgment.findUnique({
    where: { id: judgmentId },
    include: {
      obligations: {
        include: {
          escalationEvents: true,
        },
      },
    },
  })

  if (!judgment) throw new Error('Judgment not found')

  const now = new Date()
  const obligations = judgment.obligations
  const total = obligations.length

  if (total === 0) {
    return {
      judgmentId,
      title: judgment.title,
      courtName: judgment.courtName,
      caseNumber: judgment.caseNumber,
      score: 0,
      level: 'LOW',
      factors: {
        overdueCount: 0,
        totalObligations: 0,
        maxDaysOverdue: 0,
        avgDaysOverdue: 0,
        complianceRate: 100,
        highPriorityOverdue: 0,
        escalationCount: 0,
      },
    }
  }

  // Count overdue obligations
  const overdueObligations = obligations.filter(
    o => o.deadline && new Date(o.deadline) < now && o.status !== 'COMPLETED'
  )
  const overdueCount = overdueObligations.length

  // Calculate days overdue
  const daysOverdueList = overdueObligations.map(o => {
    const deadline = new Date(o.deadline!)
    return Math.floor((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24))
  })
  const maxDaysOverdue = daysOverdueList.length > 0 ? Math.max(...daysOverdueList) : 0
  const avgDaysOverdue = daysOverdueList.length > 0
    ? Math.round(daysOverdueList.reduce((a, b) => a + b, 0) / daysOverdueList.length)
    : 0

  // Compliance rate
  const completedCount = obligations.filter(o => o.status === 'COMPLETED').length
  const complianceRate = total > 0 ? Math.round((completedCount / total) * 100) : 100

  // High priority overdue
  const highPriorityOverdue = overdueObligations.filter(
    o => o.priority === 'CRITICAL' || o.priority === 'HIGH'
  ).length

  // Escalation count
  const escalationCount = obligations.reduce(
    (sum, o) => sum + o.escalationEvents.length, 0
  )

  // Score calculation (0-100)
  let score = 0

  // Factor 1: Overdue ratio (0-30 points)
  const overdueRatio = total > 0 ? overdueCount / total : 0
  score += overdueRatio * 30

  // Factor 2: Days overdue severity (0-25 points)
  if (maxDaysOverdue > 180) score += 25
  else if (maxDaysOverdue > 90) score += 20
  else if (maxDaysOverdue > 60) score += 15
  else if (maxDaysOverdue > 30) score += 10
  else if (maxDaysOverdue > 7) score += 5

  // Factor 3: Non-compliance rate (0-20 points)
  score += ((100 - complianceRate) / 100) * 20

  // Factor 4: High priority overdue (0-15 points)
  score += Math.min(highPriorityOverdue * 5, 15)

  // Factor 5: Escalation intensity (0-10 points)
  score += Math.min(escalationCount * 2, 10)

  score = Math.round(Math.min(100, Math.max(0, score)))

  // Determine risk level
  let level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  if (score >= 75) level = 'CRITICAL'
  else if (score >= 50) level = 'HIGH'
  else if (score >= 25) level = 'MODERATE'
  else level = 'LOW'

  // Update the judgment record
  await db.judgment.update({
    where: { id: judgmentId },
    data: {
      contemptRiskScore: score,
      contemptRiskLevel: level,
    },
  })

  return {
    judgmentId,
    title: judgment.title,
    courtName: judgment.courtName,
    caseNumber: judgment.caseNumber,
    score,
    level,
    factors: {
      overdueCount,
      totalObligations: total,
      maxDaysOverdue,
      avgDaysOverdue,
      complianceRate,
      highPriorityOverdue,
      escalationCount,
    },
  }
}

/**
 * Calculate contempt risk for all judgments
 */
export async function calculateAllContemptRisks(): Promise<ContemptRiskResult[]> {
  const judgments = await db.judgment.findMany({ select: { id: true } })
  const results: ContemptRiskResult[] = []
  for (const j of judgments) {
    const result = await calculateContemptRiskScore(j.id)
    results.push(result)
  }
  return results.sort((a, b) => b.score - a.score)
}
