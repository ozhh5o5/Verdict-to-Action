'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Scale, Calendar, User } from 'lucide-react'
import { formatDeadline } from '@/lib/deadlines'

interface Obligation {
  id: string
  type: string
  status: string
  priority: string
  title: string
  description: string
  deadline: string | null
  deadlineText: string | null
  verified: boolean
  judgment: {
    id: string
    title: string
    caseNumber: string | null
  }
  responsibleParty: {
    name: string
  } | null
}

export default function ObligationsPage() {
  const [obligations, setObligations] = useState<Obligation[]>([])
  const [loading, setLoading] = useState(true)
  const [groupBy, setGroupBy] = useState<'status' | 'priority'>('status')

  useEffect(() => {
    fetch('/api/obligations')
      .then(r => r.json())
      .then(data => {
        setObligations(data.obligations || [])
        setLoading(false)
      })
  }, [])

  const priorityColors: { [key: string]: string } = {
    CRITICAL: 'bg-red-100 text-red-800 border-red-300',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    LOW: 'bg-green-100 text-green-800 border-green-300',
  }

  const statusColors: { [key: string]: string } = {
    PENDING: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-green-100 text-green-800',
    OVERDUE: 'bg-red-100 text-red-800',
    DISPUTED: 'bg-gray-100 text-gray-800',
  }

  const groupedObligations = groupBy === 'status'
    ? {
        PENDING: obligations.filter(o => o.status === 'PENDING'),
        IN_PROGRESS: obligations.filter(o => o.status === 'IN_PROGRESS'),
        OVERDUE: obligations.filter(o => o.status === 'OVERDUE'),
        COMPLETED: obligations.filter(o => o.status === 'COMPLETED'),
      }
    : {
        CRITICAL: obligations.filter(o => o.priority === 'CRITICAL'),
        HIGH: obligations.filter(o => o.priority === 'HIGH'),
        MEDIUM: obligations.filter(o => o.priority === 'MEDIUM'),
        LOW: obligations.filter(o => o.priority === 'LOW'),
      }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-sm text-slate-600 hover:text-slate-900 mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Scale className="h-8 w-8 text-slate-700" />
                All Obligations
              </h1>
              <p className="text-slate-600 mt-1">{obligations.length} total obligations across all judgments</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={groupBy === 'status' ? 'default' : 'outline'}
                onClick={() => setGroupBy('status')}
              >
                Group by Status
              </Button>
              <Button
                variant={groupBy === 'priority' ? 'default' : 'outline'}
                onClick={() => setGroupBy('priority')}
              >
                Group by Priority
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12 text-slate-600">Loading obligations...</div>
        ) : obligations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Scale className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No obligations yet</h3>
              <p className="text-slate-600 mb-6">Upload a judgment to extract obligations</p>
              <Link href="/judgments/new">
                <Button>Upload Judgment</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedObligations).map(([group, items]: [string, Obligation[]]) => (
              items.length > 0 && (
                <div key={group}>
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-xl font-semibold text-slate-900">{group.replace('_', ' ')}</h2>
                    <Badge className={groupBy === 'status' ? statusColors[group] : priorityColors[group]}>
                      {items.length}
                    </Badge>
                  </div>
                  <div className="grid gap-4">
                    {items.map(obligation => (
                      <Link key={obligation.id} href={`/obligations/${obligation.id}`}>
                        <Card className={`hover:shadow-md transition-shadow cursor-pointer border-l-4 ${
                          groupBy === 'priority' ? priorityColors[obligation.priority].split(' ')[2] : 'border-slate-300'
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  {groupBy === 'status' && (
                                    <Badge className={priorityColors[obligation.priority]}>
                                      {obligation.priority}
                                    </Badge>
                                  )}
                                  {groupBy === 'priority' && (
                                    <Badge className={statusColors[obligation.status]}>
                                      {obligation.status}
                                    </Badge>
                                  )}
                                  {obligation.verified && (
                                    <Badge className="bg-green-100 text-green-800">Verified</Badge>
                                  )}
                                </div>
                                <h3 className="font-semibold text-slate-900 mb-1">{obligation.title}</h3>
                                <p className="text-sm text-slate-600 mb-2 line-clamp-2">{obligation.description}</p>
                                <div className="flex items-center gap-4 text-sm text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <Scale className="h-4 w-4" />
                                    {obligation.judgment.caseNumber || obligation.judgment.title}
                                  </span>
                                  {obligation.responsibleParty && (
                                    <span className="flex items-center gap-1">
                                      <User className="h-4 w-4" />
                                      {obligation.responsibleParty.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {obligation.deadline && (
                                <div className="flex flex-col items-end">
                                  <Calendar className="h-5 w-5 text-slate-400 mb-1" />
                                  <div className="text-sm font-medium text-slate-700 text-right">
                                    {formatDeadline(new Date(obligation.deadline))}
                                  </div>
                                  {obligation.deadlineText && (
                                    <div className="text-xs text-slate-500 text-right mt-1">
                                      {obligation.deadlineText}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
