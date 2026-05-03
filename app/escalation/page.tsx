'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowUpRight, Scale, User, FileText, Calendar, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

interface EscalationEvent {
  id: string
  fromLevel: number
  toLevel: number
  fromRole: string
  toRole: string
  reason: string
  triggeredBy: string
  createdAt: string
  obligation: {
    id: string
    title: string
    priority: string
    status: string
    escalationLevel: number
    judgment: {
      id: string
      title: string
      caseNumber: string | null
    }
    responsibleParty: {
      name: string
    } | null
  }
}

export default function EscalationPage() {
  const [events, setEvents] = useState<EscalationEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/escalations')
      .then(r => r.json())
      .then(data => {
        setEvents(data.events || [])
        setLoading(false)
      })
  }, [])

  const levelColors = [
    'bg-blue-500/10 text-blue-400 border-blue-500/30',
    'bg-amber-500/10 text-amber-400 border-amber-500/30',
    'bg-orange-500/10 text-orange-400 border-orange-500/30',
    'bg-red-500/10 text-red-400 border-red-500/30',
  ]

  const levelIcons = ['👤', '📋', '🏛️', '⚖️']

  const priorityColors: { [key: string]: string } = {
    CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/30',
    HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    LOW: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          <div className="text-slate-400 text-sm">Loading escalations...</div>
        </div>
      </div>
    )
  }

  // Group by obligation
  const byObligation = events.reduce<{ [key: string]: EscalationEvent[] }>((acc, event) => {
    if (!acc[event.obligation.id]) acc[event.obligation.id] = []
    acc[event.obligation.id].push(event)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
                  <Scale className="h-4.5 w-4.5 text-white" />
                </div>
                <span className="text-lg font-bold tracking-tight">Verdict→Action</span>
              </Link>
              <div className="hidden md:flex items-center gap-1">
                <Link href="/" className="px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Dashboard</Link>
                <Link href="/judgments" className="px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Judgments</Link>
                <Link href="/obligations" className="px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Obligations</Link>
                <Link href="/contempt-risk" className="px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Contempt Risk</Link>
                <Link href="/escalation" className="px-3 py-2 rounded-md text-sm font-medium text-white bg-slate-800 transition-colors">Escalations</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3 mb-1">
            <ArrowUpRight className="h-7 w-7 text-amber-400" />
            Escalation Tracker
          </h1>
          <p className="text-slate-400 text-sm">{events.length} escalation events across {Object.keys(byObligation).length} obligations</p>
        </div>

        {/* Escalation Chain Legend */}
        <Card className="bg-slate-900 border-slate-800 mb-8">
          <CardContent className="py-4 px-6">
            <div className="flex items-center gap-2 mb-3 text-xs text-slate-500 font-medium">ESCALATION CHAIN</div>
            <div className="flex items-center gap-0 flex-wrap">
              {['Assigned Officer', 'Department Secretary', 'Chief Secretary', "Advocate General's Office"].map((role, i) => (
                <div key={role} className="flex items-center">
                  <div className={`px-3 py-2 rounded-lg border ${levelColors[i]} text-sm font-medium`}>
                    <span className="mr-1.5">{levelIcons[i]}</span>
                    {role}
                  </div>
                  {i < 3 && <ChevronRight className="h-4 w-4 text-slate-600 mx-1" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Escalated Obligations */}
        <div className="space-y-4">
          {Object.entries(byObligation).map(([oblId, oblEvents]) => {
            const obl = oblEvents[0].obligation
            const sortedEvents = [...oblEvents].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            const currentLevel = obl.escalationLevel

            return (
              <Card key={oblId} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
                <CardContent className="p-6">
                  {/* Obligation header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge className={`${priorityColors[obl.priority]} border text-xs`}>{obl.priority}</Badge>
                        <Badge className={`${levelColors[currentLevel]} border text-xs`}>
                          Level {currentLevel} — {['Assigned Officer', 'Department Secretary', 'Chief Secretary', "AG's Office"][currentLevel]}
                        </Badge>
                      </div>
                      <Link href={`/obligations/${oblId}`} className="hover:underline">
                        <h3 className="text-base font-semibold text-white">{obl.title}</h3>
                      </Link>
                      <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                        <Link href={`/judgments/${obl.judgment.id}`} className="hover:text-slate-300 flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          {obl.judgment.caseNumber || obl.judgment.title}
                        </Link>
                        {obl.responsibleParty && (
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {obl.responsibleParty.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Escalation timeline */}
                  <div className="border-t border-slate-800 pt-4">
                    <div className="text-xs text-slate-500 font-medium mb-3">ESCALATION TIMELINE</div>
                    <div className="space-y-3">
                      {sortedEvents.map((event, idx) => (
                        <div key={event.id} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${levelColors[event.toLevel]} border`}>
                              {levelIcons[event.toLevel]}
                            </div>
                            {idx < sortedEvents.length - 1 && <div className="w-0.5 h-6 bg-slate-700 mt-1" />}
                          </div>
                          <div className="flex-1 pb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-slate-300">{event.fromRole}</span>
                              <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                              <span className="text-sm font-medium text-white">{event.toRole}</span>
                              <span className="text-xs text-slate-500 ml-auto">
                                {format(new Date(event.createdAt), 'MMM d, yyyy h:mm a')}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{event.reason}</p>
                            <span className="text-xs text-slate-600">Triggered by: {event.triggeredBy}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {Object.keys(byObligation).length === 0 && (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="py-12 text-center">
                <ArrowUpRight className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No escalations yet</h3>
                <p className="text-slate-500">Obligations will be auto-escalated when they become overdue</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
