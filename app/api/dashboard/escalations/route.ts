import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const events = await db.escalationEvent.findMany({
      include: {
        obligation: {
          include: {
            judgment: {
              select: {
                id: true,
                title: true,
                caseNumber: true,
              },
            },
            responsibleParty: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Error fetching escalation events:', error)
    return NextResponse.json({ error: 'Failed to fetch escalation events' }, { status: 500 })
  }
}
