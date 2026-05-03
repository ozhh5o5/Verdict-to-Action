import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const totalJudgments = await db.judgment.count()
    const totalObligations = await db.obligation.count()
    
    const obligationsByStatus = await db.obligation.groupBy({
      by: ['status'],
      _count: true,
    })

    const obligationsByPriority = await db.obligation.groupBy({
      by: ['priority'],
      _count: true,
    })

    const overdueCount = await db.obligation.count({
      where: {
        deadline: {
          lt: new Date(),
        },
        status: {
          notIn: ['COMPLETED'],
        },
      },
    })

    const completedThisMonth = await db.obligation.count({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    })

    const statusMap: { [key: string]: number } = {}
    obligationsByStatus.forEach(item => {
      statusMap[item.status] = item._count
    })

    const priorityMap: { [key: string]: number } = {}
    obligationsByPriority.forEach(item => {
      priorityMap[item.priority] = item._count
    })

    return NextResponse.json({
      totalJudgments,
      totalObligations,
      activeObligations: (statusMap['PENDING'] || 0) + (statusMap['IN_PROGRESS'] || 0),
      overdueCount,
      completedThisMonth,
      byStatus: statusMap,
      byPriority: priorityMap,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
