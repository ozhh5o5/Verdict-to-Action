import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { verified, verifierNotes } = body

    const obligation = await db.obligation.update({
      where: { id },
      data: {
        verified,
        verifierNotes,
        verifiedAt: verified ? new Date() : null,
      },
    })

    return NextResponse.json(obligation)
  } catch (error) {
    console.error('Error verifying obligation:', error)
    return NextResponse.json({ error: 'Failed to verify obligation' }, { status: 500 })
  }
}
