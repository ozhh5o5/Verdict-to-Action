import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, note, evidenceUrl, updatedBy } = body

    const obligation = await db.obligation.update({
      where: { id },
      data: { status },
    })

    await db.obligationUpdate.create({
      data: {
        obligationId: id,
        status,
        note,
        evidenceUrl,
        updatedBy: updatedBy || 'Demo User',
      },
    })

    return NextResponse.json(obligation)
  } catch (error) {
    console.error('Error updating obligation status:', error)
    return NextResponse.json({ error: 'Failed to update obligation status' }, { status: 500 })
  }
}
