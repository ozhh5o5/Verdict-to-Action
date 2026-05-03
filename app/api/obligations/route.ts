import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const judgmentId = searchParams.get('judgmentId')

    const where: any = {}
    if (status) where.status = status
    if (priority) where.priority = priority
    if (judgmentId) where.judgmentId = judgmentId

    const obligations = await db.obligation.findMany({
      where,
      include: {
        judgment: {
          select: {
            id: true,
            title: true,
            caseNumber: true,
            courtName: true,
          },
        },
        responsibleParty: true,
        updates: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ total: obligations.length, obligations })
  } catch (error) {
    console.error('Error fetching obligations:', error)
    return NextResponse.json({ error: 'Failed to fetch obligations' }, { status: 500 })
  }
}
