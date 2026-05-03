import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const now = new Date()
    const future = new Date()
    future.setDate(future.getDate() + days)

    const upcomingDeadlines = await db.obligation.findMany({
      where: {
        deadline: {
          gte: now,
          lte: future,
        },
        status: {
          notIn: ['COMPLETED'],
        },
      },
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
      orderBy: { deadline: 'asc' },
    })

    return NextResponse.json({ deadlines: upcomingDeadlines })
  } catch (error) {
    console.error('Error fetching deadlines:', error)
    return NextResponse.json({ error: 'Failed to fetch deadlines' }, { status: 500 })
  }
}
