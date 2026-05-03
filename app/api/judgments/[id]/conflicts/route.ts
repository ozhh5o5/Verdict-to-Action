import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const conflicts = await db.statutoryConflict.findMany({
      where: { judgmentId: id },
      include: {
        statuteLaw: true,
        obligation: {
          select: {
            id: true,
            title: true,
            priority: true,
          },
        },
      },
      orderBy: { detectedAt: 'desc' },
    })

    return NextResponse.json({ conflicts })
  } catch (error) {
    console.error('Error fetching conflicts:', error)
    return NextResponse.json({ error: 'Failed to fetch conflicts' }, { status: 500 })
  }
}
