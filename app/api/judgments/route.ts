import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const judgments = await db.judgment.findMany({
      include: {
        obligations: true,
        parties: true,
      },
      orderBy: { uploadedAt: 'desc' },
    })

    const result = judgments.map(j => ({
      ...j,
      obligationCount: j.obligations.length,
    }))

    return NextResponse.json({ total: result.length, judgments: result })
  } catch (error) {
    console.error('Error fetching judgments:', error)
    return NextResponse.json({ error: 'Failed to fetch judgments' }, { status: 500 })
  }
}
