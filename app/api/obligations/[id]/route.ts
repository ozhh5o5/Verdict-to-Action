import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const obligation = await db.obligation.findUnique({
      where: { id },
      include: {
        judgment: true,
        responsibleParty: true,
        updates: {
          orderBy: { updatedAt: 'desc' },
        },
      },
    })

    if (!obligation) {
      return NextResponse.json({ error: 'Obligation not found' }, { status: 404 })
    }

    return NextResponse.json(obligation)
  } catch (error) {
    console.error('Error fetching obligation:', error)
    return NextResponse.json({ error: 'Failed to fetch obligation' }, { status: 500 })
  }
}
