import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { extractActionPlan } from '../lib/ai'
import { parseDeadlineText } from '../lib/deadlines'

const prisma = new PrismaClient()

const STATUTE_LAWS = [
  {
    title: 'Karnataka Ancient Monuments and Archaeological Sites and Remains Act, 1961',
    shortName: 'Heritage Protection Act',
    jurisdiction: 'Karnataka',
    section: 'Section 19 — Prohibition of destruction',
    provision: 'No person shall destroy, remove, injure, alter or deface any protected monument or any part thereof. Heritage structures identified under the scheduled list shall not be demolished, modified, or reconstructed without prior approval from the Archaeological Survey.',
    category: 'heritage',
  },
  {
    title: 'Water (Prevention and Control of Pollution) Act, 1974',
    shortName: 'Water Pollution Act',
    jurisdiction: 'Central',
    section: 'Section 25 — Restrictions on outlets and discharge',
    provision: 'No person shall establish or operate any industry, operation, or process that discharges sewage or trade effluent into a stream, well, sewer, or on land without obtaining consent from the State Pollution Control Board. Industrial operations shall not continue without valid environmental clearance.',
    category: 'pollution',
  },
  {
    title: 'Industrial Disputes Act, 1947',
    shortName: 'Industrial Disputes Act',
    jurisdiction: 'Central',
    section: 'Section 25F — Conditions precedent to retrenchment',
    provision: 'No workman employed in any industry who has been in continuous service for not less than one year shall be retrenched unless the workman has been given one month notice in writing and has been paid compensation. Termination and dismissal of workers must follow statutory procedure including notice period and compensation.',
    category: 'labor',
  },
  {
    title: 'Right to Fair Compensation and Transparency in Land Acquisition Act, 2013',
    shortName: 'Land Acquisition Act',
    jurisdiction: 'Central',
    section: 'Section 26 — Determination of market value',
    provision: 'When land is acquired for public purposes, the Collector shall determine compensation using the market value of the land. No land shall be acquired or seized without following due process including social impact assessment, public hearing, and fair compensation at market rates.',
    category: 'land',
  },
  {
    title: 'Environment Protection Act, 1986',
    shortName: 'Environment Protection Act',
    jurisdiction: 'Central',
    section: 'Section 7 — Persons carrying on industry shall not exceed prescribed standards',
    provision: 'No person carrying on any industry, operation or process shall discharge or emit any environmental pollutant in excess of prescribed standards. Factories and industrial units must comply with emission norms and obtain environmental clearance before operation or expansion.',
    category: 'environmental',
  },
  {
    title: 'Karnataka Town and Country Planning Act, 1961',
    shortName: 'Town Planning Act',
    jurisdiction: 'Karnataka',
    section: 'Section 76A — Unauthorized development',
    provision: 'Any development or construction carried out without proper sanction or in deviation from sanctioned plans may be removed or demolished by the planning authority. However, structures existing for more than five years and occupied may be regularized upon payment of prescribed fees.',
    category: 'land',
  },
]

async function main() {
  console.log('🌱 Seeding database...')

  console.log('🗑️  Clearing existing data...')
  await prisma.statutoryConflict.deleteMany()
  await prisma.escalationEvent.deleteMany()
  await prisma.obligationUpdate.deleteMany()
  await prisma.obligation.deleteMany()
  await prisma.party.deleteMany()
  await prisma.judgment.deleteMany()
  await prisma.statuteLaw.deleteMany()

  // Seed statute laws
  console.log('\n📚 Seeding statute laws...')
  const createdLaws = []
  for (const law of STATUTE_LAWS) {
    const created = await prisma.statuteLaw.create({ data: law })
    createdLaws.push(created)
    console.log(`  ✓ ${law.shortName} — ${law.section}`)
  }
  console.log(`  ✓ Created ${createdLaws.length} statute laws`)

  const txtDir = path.join(__dirname, '../data/sample-judgments')
  const txtFiles = fs.readdirSync(txtDir).filter(f => f.endsWith('.txt'))

  console.log(`\n📄 Processing ${txtFiles.length} judgment text files...`)

  const allJudgmentIds: string[] = []

  for (const txtFile of txtFiles) {
    const txtPath = path.join(txtDir, txtFile)
    const text = fs.readFileSync(txtPath, 'utf-8')

    console.log(`\n📋 Processing ${txtFile}...`)

    const numpages = Math.ceil(text.length / 2000)

    const extractionResult = await extractActionPlan(text, numpages)

    const judgment = await prisma.judgment.create({
      data: {
        title: txtFile.replace('.txt', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        fileName: txtFile.replace('.txt', '.pdf'),
        fullText: text,
        pageCount: numpages,
        status: 'PARSED',
        caseNumber: extractionResult.caseNumber,
        courtName: extractionResult.courtName,
        benchComposition: extractionResult.benchComposition || 'Hon\'ble Justice (name withheld for demo)',
        judgmentDate: extractionResult.judgmentDate ? new Date(extractionResult.judgmentDate) : null,
      },
    })

    allJudgmentIds.push(judgment.id)
    console.log(`  ✓ Created judgment: ${judgment.title}`)
    console.log(`    Court: ${judgment.courtName || 'N/A'}`)
    console.log(`    Case: ${judgment.caseNumber || 'N/A'}`)

    for (const party of extractionResult.parties) {
      await prisma.party.create({
        data: {
          judgmentId: judgment.id,
          name: party.name,
          role: party.role,
        },
      })
    }
    console.log(`  ✓ Created ${extractionResult.parties.length} parties`)

    const parties = await prisma.party.findMany({
      where: { judgmentId: judgment.id },
    })

    for (const obl of extractionResult.obligations) {
      const responsibleParty = parties.find(p => p.name === obl.responsibleParty)

      const deadline = obl.deadlineDate
        ? new Date(obl.deadlineDate)
        : obl.deadlineText
          ? parseDeadlineText(obl.deadlineText, judgment.judgmentDate || new Date())
          : null

      let status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' = 'PENDING'
      if (deadline && deadline < new Date()) {
        status = 'OVERDUE'
      } else if (Math.random() > 0.7) {
        status = 'IN_PROGRESS'
      }

      const escalationLevel = status === 'OVERDUE' ? Math.floor(Math.random() * 3) : 0

      const obligation = await prisma.obligation.create({
        data: {
          judgmentId: judgment.id,
          type: obl.type,
          status: status,
          priority: obl.priority,
          title: obl.title,
          description: obl.description,
          deadline: deadline,
          deadlineText: obl.deadlineText,
          responsiblePartyId: responsibleParty?.id,
          assignedOfficer: obl.assignedOfficer || (responsibleParty ? `Officer - ${responsibleParty.name.split(' ').slice(0, 2).join(' ')}` : null),
          sourceExcerpt: obl.sourceExcerpt,
          sourcePage: obl.sourcePage,
          reasoning: obl.reasoning,
          reasoningChain: obl.reasoningChain,
          triggerCondition: obl.triggerCondition,
          confidence: obl.confidence,
          verified: Math.random() > 0.5,
          escalationLevel,
          escalatedAt: escalationLevel > 0 ? new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000) : null,
        },
      })

      if (status === 'IN_PROGRESS' || status === 'OVERDUE') {
        await prisma.obligationUpdate.create({
          data: {
            obligationId: obligation.id,
            status: 'IN_PROGRESS',
            note: 'Initial progress update — assigned to concerned department and timeline established.',
            updatedBy: 'System Administrator',
            updatedAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
          },
        })
      }

      // Create escalation events for overdue obligations
      if (escalationLevel > 0) {
        const roles = ['Assigned Officer', 'Department Secretary', 'Chief Secretary', 'Advocate General\'s Office']
        for (let lvl = 0; lvl < escalationLevel; lvl++) {
          await prisma.escalationEvent.create({
            data: {
              obligationId: obligation.id,
              fromLevel: lvl,
              toLevel: lvl + 1,
              fromRole: roles[lvl],
              toRole: roles[lvl + 1],
              reason: `Obligation overdue by ${7 * (lvl + 1)}+ days. Auto-escalated from ${roles[lvl]} to ${roles[lvl + 1]}.`,
              triggeredBy: 'SYSTEM',
              createdAt: new Date(Date.now() - (escalationLevel - lvl) * 3 * 24 * 60 * 60 * 1000),
            },
          })
        }
        console.log(`    ↑ Escalated obligation "${obligation.title.slice(0, 40)}..." to level ${escalationLevel}`)
      }

      // Create statutory conflicts for some obligations (demo)
      if (Math.random() > 0.6) {
        const randomLaw = createdLaws[Math.floor(Math.random() * createdLaws.length)]
        const oblText = obligation.description.toLowerCase()
        const hasConflictWord = ['demolish', 'remove', 'terminate', 'acquire', 'operate', 'discharge'].some(w => oblText.includes(w))

        if (hasConflictWord || Math.random() > 0.5) {
          await prisma.statutoryConflict.create({
            data: {
              obligationId: obligation.id,
              judgmentId: judgment.id,
              statuteLawId: randomLaw.id,
              conflictType: hasConflictWord ? 'DIRECT_CONTRADICTION' : 'POTENTIAL_OVERLAP',
              severity: hasConflictWord ? 'HIGH' : 'MEDIUM',
              description: `The court-ordered obligation may conflict with ${randomLaw.shortName}, ${randomLaw.section}. ${
                hasConflictWord
                  ? 'Direct contradiction detected — the directed action may violate statutory protections.'
                  : 'Potential overlap detected — the obligation touches on areas regulated by this statute.'
              }`,
              obligationText: obligation.description.slice(0, 300),
              statuteText: randomLaw.provision,
              recommendation: hasConflictWord
                ? `Seek legal opinion from the Advocate General before executing this obligation.`
                : `Review ${randomLaw.shortName} to ensure compliance with both the court order and statutory requirements.`,
            },
          })
          console.log(`    ⚠ Statutory conflict detected with ${randomLaw.shortName}`)
        }
      }
    }
    console.log(`  ✓ Created ${extractionResult.obligations.length} obligations`)
  }

  // Calculate contempt risk scores
  console.log('\n📊 Calculating contempt risk scores...')
  for (const judgmentId of allJudgmentIds) {
    const judgment = await prisma.judgment.findUnique({
      where: { id: judgmentId },
      include: { obligations: true },
    })
    if (!judgment) continue

    const overdueCount = judgment.obligations.filter(
      o => o.deadline && new Date(o.deadline) < new Date() && o.status !== 'COMPLETED'
    ).length
    const total = judgment.obligations.length
    const overdueRatio = total > 0 ? overdueCount / total : 0

    let score = Math.round(overdueRatio * 60 + Math.random() * 25)
    score = Math.min(100, Math.max(0, score))

    let level = 'LOW'
    if (score >= 75) level = 'CRITICAL'
    else if (score >= 50) level = 'HIGH'
    else if (score >= 25) level = 'MODERATE'

    await prisma.judgment.update({
      where: { id: judgmentId },
      data: { contemptRiskScore: score, contemptRiskLevel: level },
    })
    console.log(`  ✓ ${judgment.title}: Risk Score ${score} (${level})`)
  }

  const summary = await prisma.judgment.count()
  const obligationCount = await prisma.obligation.count()
  const partyCount = await prisma.party.count()
  const overdueCount = await prisma.obligation.count({ where: { status: 'OVERDUE' } })
  const escalationCount = await prisma.escalationEvent.count()
  const conflictCount = await prisma.statutoryConflict.count()
  const lawCount = await prisma.statuteLaw.count()

  console.log('\n✅ Seed complete!')
  console.log(`📊 Summary:`)
  console.log(`   - Judgments: ${summary}`)
  console.log(`   - Parties: ${partyCount}`)
  console.log(`   - Obligations: ${obligationCount}`)
  console.log(`   - Overdue: ${overdueCount}`)
  console.log(`   - Escalation Events: ${escalationCount}`)
  console.log(`   - Statutory Conflicts: ${conflictCount}`)
  console.log(`   - Statute Laws: ${lawCount}`)
  console.log('\n🚀 Start the app: npm run dev')
  console.log('🌐 Then open: http://localhost:3000')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
