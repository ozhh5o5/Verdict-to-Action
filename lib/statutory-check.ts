import { db } from './db'

export interface StatutoryConflictResult {
  statuteLawId: string
  lawTitle: string
  lawSection: string
  conflictType: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  obligationText: string
  statuteText: string
  recommendation: string
}

/**
 * Mock statutory contradiction detection.
 * Cross-references obligation text against seeded state laws to find potential conflicts.
 */
export async function checkStatutoryConflicts(
  obligationId: string
): Promise<StatutoryConflictResult[]> {
  const obligation = await db.obligation.findUnique({
    where: { id: obligationId },
    include: { judgment: true },
  })

  if (!obligation) return []

  const laws = await db.statuteLaw.findMany()
  const conflicts: StatutoryConflictResult[] = []

  const obligationText = (obligation.description + ' ' + obligation.sourceExcerpt).toLowerCase()

  for (const law of laws) {
    const lawKeywords = law.provision.toLowerCase().split(/\s+/)
    const matchingKeywords = lawKeywords.filter(kw =>
      kw.length > 4 && obligationText.includes(kw)
    )

    // Check for category-based conflicts
    const categoryConflicts: { [key: string]: string[] } = {
      'environmental': ['demolish', 'remove', 'dismantle', 'clear', 'raze'],
      'heritage': ['demolish', 'alter', 'modify', 'reconstruct', 'remove'],
      'labor': ['terminate', 'dismiss', 'retrench', 'reduce', 'suspend'],
      'land': ['acquire', 'seize', 'demolish', 'evict', 'dispossess'],
      'pollution': ['permit', 'allow', 'operate', 'continue', 'license'],
    }

    const conflictKeywords = categoryConflicts[law.category.toLowerCase()] || []
    const hasConflictKeyword = conflictKeywords.some(kw => obligationText.includes(kw))

    if ((matchingKeywords.length >= 3 || hasConflictKeyword) && matchingKeywords.length > 0) {
      let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM'
      if (hasConflictKeyword && matchingKeywords.length >= 3) severity = 'HIGH'
      if (hasConflictKeyword && obligation.priority === 'CRITICAL') severity = 'CRITICAL'

      conflicts.push({
        statuteLawId: law.id,
        lawTitle: law.title,
        lawSection: law.section,
        conflictType: hasConflictKeyword ? 'DIRECT_CONTRADICTION' : 'POTENTIAL_OVERLAP',
        severity,
        description: `The court-ordered obligation may conflict with ${law.shortName}, ${law.section}. ${
          hasConflictKeyword
            ? 'Direct contradiction detected — the directed action may violate statutory protections.'
            : 'Potential overlap detected — the obligation touches on areas regulated by this statute.'
        }`,
        obligationText: obligation.description.slice(0, 300),
        statuteText: law.provision,
        recommendation: hasConflictKeyword
          ? `Seek legal opinion from the Advocate General before executing this obligation. The conflict between the court order and ${law.shortName} must be resolved through a clarification petition if necessary.`
          : `Review ${law.shortName}, ${law.section} to ensure compliance with both the court order and statutory requirements. Consult departmental legal counsel.`,
      })
    }
  }

  return conflicts
}

/**
 * Detect and store all statutory conflicts for a judgment's obligations
 */
export async function detectAndStoreConflicts(judgmentId: string) {
  const obligations = await db.obligation.findMany({
    where: { judgmentId },
  })

  const allConflicts = []

  for (const obl of obligations) {
    const conflicts = await checkStatutoryConflicts(obl.id)

    for (const conflict of conflicts) {
      // Check if already recorded
      const existing = await db.statutoryConflict.findFirst({
        where: {
          obligationId: obl.id,
          statuteLawId: conflict.statuteLawId,
        },
      })

      if (!existing) {
        const stored = await db.statutoryConflict.create({
          data: {
            obligationId: obl.id,
            judgmentId,
            statuteLawId: conflict.statuteLawId,
            conflictType: conflict.conflictType,
            severity: conflict.severity,
            description: conflict.description,
            obligationText: conflict.obligationText,
            statuteText: conflict.statuteText,
            recommendation: conflict.recommendation,
          },
        })
        allConflicts.push(stored)
      }
    }
  }

  return allConflicts
}
