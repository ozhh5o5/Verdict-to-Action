import { db } from './db'

export const ESCALATION_CHAIN = [
  { level: 0, role: 'Assigned Officer', title: 'Assigned Officer' },
  { level: 1, role: 'Department Secretary', title: 'Department Secretary' },
  { level: 2, role: 'Chief Secretary', title: 'Chief Secretary' },
  { level: 3, role: 'Advocate General', title: 'Advocate General\'s Office' },
] as const

export function getEscalationRole(level: number): string {
  return ESCALATION_CHAIN[Math.min(level, ESCALATION_CHAIN.length - 1)]?.role || 'Unknown'
}

export function getNextEscalationLevel(currentLevel: number): number {
  return Math.min(currentLevel + 1, ESCALATION_CHAIN.length - 1)
}

/**
 * Check if an obligation should be auto-escalated based on:
 * - Days overdue
 * - Current escalation level
 * - Priority
 */
export function shouldEscalate(
  deadline: Date | null,
  currentLevel: number,
  priority: string
): boolean {
  if (!deadline || currentLevel >= ESCALATION_CHAIN.length - 1) return false

  const now = new Date()
  const daysOverdue = Math.floor((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24))

  if (daysOverdue <= 0) return false

  // Escalation thresholds by priority (days overdue to trigger next level)
  const thresholds: { [key: string]: number[] } = {
    CRITICAL: [3, 7, 14],    // Escalates quickly
    HIGH:     [7, 14, 30],
    MEDIUM:   [14, 30, 60],
    LOW:      [30, 60, 90],
  }

  const priorityThresholds = thresholds[priority] || thresholds.MEDIUM
  const threshold = priorityThresholds[currentLevel] || 30

  return daysOverdue >= threshold
}

/**
 * Perform escalation for a specific obligation
 */
export async function escalateObligation(obligationId: string, triggeredBy: string = 'SYSTEM') {
  const obligation = await db.obligation.findUnique({
    where: { id: obligationId },
  })

  if (!obligation) throw new Error('Obligation not found')

  const currentLevel = obligation.escalationLevel
  const nextLevel = getNextEscalationLevel(currentLevel)

  if (nextLevel === currentLevel) {
    return { alreadyAtMax: true, currentLevel }
  }

  const fromRole = getEscalationRole(currentLevel)
  const toRole = getEscalationRole(nextLevel)

  // Create escalation event
  await db.escalationEvent.create({
    data: {
      obligationId,
      fromLevel: currentLevel,
      toLevel: nextLevel,
      fromRole,
      toRole,
      reason: `Obligation overdue. Escalating from ${fromRole} to ${toRole} for immediate attention.`,
      triggeredBy,
    },
  })

  // Update obligation escalation level
  await db.obligation.update({
    where: { id: obligationId },
    data: {
      escalationLevel: nextLevel,
      escalatedAt: new Date(),
      assignedOfficer: `${toRole} — Escalated`,
    },
  })

  // Add an obligation update for audit trail
  await db.obligationUpdate.create({
    data: {
      obligationId,
      status: obligation.status,
      note: `Escalated from ${fromRole} (Level ${currentLevel}) to ${toRole} (Level ${nextLevel}). ${triggeredBy === 'SYSTEM' ? 'Auto-escalation triggered by overdue deadline.' : `Manually escalated by ${triggeredBy}.`}`,
      updatedBy: triggeredBy,
    },
  })

  return { fromLevel: currentLevel, toLevel: nextLevel, fromRole, toRole }
}

/**
 * Check all overdue obligations and escalate as needed
 */
export async function runAutoEscalation() {
  const overdueObligations = await db.obligation.findMany({
    where: {
      deadline: { lt: new Date() },
      status: { notIn: ['COMPLETED'] },
      escalationLevel: { lt: ESCALATION_CHAIN.length - 1 },
    },
  })

  const results = []
  for (const obl of overdueObligations) {
    if (shouldEscalate(obl.deadline, obl.escalationLevel, obl.priority)) {
      const result = await escalateObligation(obl.id, 'SYSTEM')
      results.push({ obligationId: obl.id, ...result })
    }
  }
  return results
}
