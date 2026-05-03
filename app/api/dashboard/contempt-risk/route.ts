import { NextResponse } from 'next/server'
import { calculateAllContemptRisks } from '@/lib/contempt-risk'

export async function GET() {
  try {
    const risks = await calculateAllContemptRisks()
    return NextResponse.json({ risks })
  } catch (error) {
    console.error('Error calculating contempt risks:', error)
    return NextResponse.json({ error: 'Failed to calculate contempt risks' }, { status: 500 })
  }
}
