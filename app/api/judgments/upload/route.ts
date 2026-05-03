import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { extractPdfText } from '@/lib/pdf'
import { extractActionPlan } from '@/lib/ai'
import { parseDeadlineText } from '@/lib/deadlines'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    
    const judgment = await db.judgment.create({
      data: {
        title: file.name.replace('.pdf', '').replace(/[-_]/g, ' '),
        fileName: file.name,
        status: 'PARSING',
      },
    })

    let extractionResult
    try {
      const { text, numpages } = await extractPdfText(buffer)
      
      extractionResult = await extractActionPlan(text, numpages)
      
      await db.judgment.update({
        where: { id: judgment.id },
        data: {
          fullText: text,
          pageCount: numpages,
          status: 'PARSED',
          caseNumber: extractionResult.caseNumber,
          courtName: extractionResult.courtName,
          judgmentDate: extractionResult.judgmentDate ? new Date(extractionResult.judgmentDate) : null,
        },
      })

      for (const party of extractionResult.parties) {
        await db.party.create({
          data: {
            judgmentId: judgment.id,
            name: party.name,
            role: party.role,
          },
        })
      }

      const parties = await db.party.findMany({
        where: { judgmentId: judgment.id },
      })

      for (const obl of extractionResult.obligations) {
        const responsibleParty = parties.find(p => p.name === obl.responsibleParty)
        
        const deadline = obl.deadlineDate 
          ? new Date(obl.deadlineDate)
          : obl.deadlineText 
            ? parseDeadlineText(obl.deadlineText, judgment.judgmentDate || new Date())
            : null

        await db.obligation.create({
          data: {
            judgmentId: judgment.id,
            type: obl.type,
            priority: obl.priority,
            title: obl.title,
            description: obl.description,
            deadline: deadline,
            deadlineText: obl.deadlineText,
            responsiblePartyId: responsibleParty?.id,
            sourceExcerpt: obl.sourceExcerpt,
            sourcePage: obl.sourcePage,
            reasoning: obl.reasoning,
            confidence: obl.confidence,
          },
        })
      }

      return NextResponse.json({
        judgmentId: judgment.id,
        obligationCount: extractionResult.obligations.length,
      })
    } catch (error) {
      console.error('Error extracting judgment:', error)
      await db.judgment.update({
        where: { id: judgment.id },
        data: { status: 'ERROR' },
      })
      return NextResponse.json({ error: 'Failed to extract judgment' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error uploading judgment:', error)
    return NextResponse.json({ error: 'Failed to upload judgment' }, { status: 500 })
  }
}
