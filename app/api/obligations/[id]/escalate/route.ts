import { NextRequest, NextResponse } from 'next/server'
import { escalateObligation } from '@/lib/escalation'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const triggeredBy = body.triggeredBy || 'Manual Escalation'

    const result = await escalateObligation(id, triggeredBy)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error escalating obligation:', error)
    return NextResponse.json({ error: 'Failed to escalate' }, { status: 500 })
  }
}
