import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const judgment = await db.judgment.findUnique({
      where: { id },
      include: {
        obligations: {
          include: {
            responsibleParty: true,
            updates: {
              orderBy: { updatedAt: 'desc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        parties: true,
      },
    })

    if (!judgment) {
      return NextResponse.json({ error: 'Judgment not found' }, { status: 404 })
    }

    return NextResponse.json(judgment)
  } catch (error) {
    console.error('Error fetching judgment:', error)
    return NextResponse.json({ error: 'Failed to fetch judgment' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.judgment.delete({
      where: { id },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting judgment:', error)
    return NextResponse.json({ error: 'Failed to delete judgment' }, { status: 500 })
  }
}
