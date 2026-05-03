'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShieldAlert, Scale, AlertTriangle, TrendingUp, ArrowLeft, FileText } from 'lucide-react'

interface ContemptRisk {
  judgmentId: string
  title: string
  courtName: string | null
  caseNumber: string | null
  score: number
  level: string
  factors: {
    overdueCount: number
    totalObligations: number
    maxDaysOverdue: number
    avgDaysOverdue: number
    complianceRate: number
    highPriorityOverdue: number
    escalationCount: number
  }
}

export default function ContemptRiskPage() {
  const [risks, setRisks] = useState<ContemptRisk[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/contempt-risk')
      .then(r => r.json())
      .then(data => {
        setRisks(data.risks || [])
        setLoading(false)
      })
  }, [])

  const riskConfig: { [key: string]: { color: string; bg: string; border: string; glow: string } } = {
    CRITICAL: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/40', glow: 'shadow-red-500/10' },
    HIGH:     { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/40', glow: 'shadow-orange-500/10' },
    MODERATE: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/40', glow: 'shadow-amber-500/10' },
    LOW:      { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', glow: 'shadow-emerald-500/10' },
  }

  const barColor: { [key: string]: string } = {
    CRITICAL: 'bg-red-500',
    HIGH: 'bg-orange-500',
    MODERATE: 'bg-amber-500',
    LOW: 'bg-emerald-500',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-red-400 border-t-transparent animate-spin" />
          <div className="text-slate-400 text-sm">Calculating risk scores...</div>
        </div>
      </div>
    )
  }

  const criticalCount = risks.filter(r => r.level === 'CRITICAL').length
  const highCount = risks.filter(r => r.level === 'HIGH').length
  const avgScore = risks.length > 0 ? Math.round(risks.reduce((s, r) => s + r.score, 0) / risks.length) : 0

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
                <Link href="/contempt-risk" className="px-3 py-2 rounded-md text-sm font-medium text-white bg-slate-800 transition-colors">Contempt Risk</Link>
                <Link href="/escalation" className="px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Escalations</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3 mb-1">
            <ShieldAlert className="h-7 w-7 text-red-400" />
            Contempt Risk Dashboard
          </h1>
          <p className="text-slate-400 text-sm">Real-time contempt risk scoring for the Chief Secretary's office</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-red-400 font-medium">CRITICAL / HIGH RISK</span>
                <AlertTriangle className="h-4 w-4 text-red-400" />
              </div>
              <div className="text-3xl font-bold text-red-400">{criticalCount + highCount}</div>
              <p className="text-xs text-slate-500 mt-1">of {risks.length} judgments</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 font-medium">AVERAGE RISK SCORE</span>
                <TrendingUp className="h-4 w-4 text-amber-400" />
              </div>
              <div className="text-3xl font-bold text-white">{avgScore}<span className="text-lg text-slate-500">/100</span></div>
              <p className="text-xs text-slate-500 mt-1">across all judgments</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 font-medium">TOTAL JUDGMENTS</span>
                <FileText className="h-4 w-4 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-white">{risks.length}</div>
              <p className="text-xs text-slate-500 mt-1">under monitoring</p>
            </CardContent>
          </Card>
        </div>

        {/* Risk Cards */}
        <div className="space-y-4">
          {risks.map(risk => {
            const config = riskConfig[risk.level] || riskConfig.LOW
            return (
              <Card key={risk.judgmentId} className={`bg-slate-900 border ${config.border} shadow-lg ${config.glow} hover:shadow-xl transition-all`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    {/* Risk Score Gauge */}
                    <div className="flex flex-col items-center min-w-[90px]">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center ${config.bg} border-2 ${config.border}`}>
                        <span className={`text-2xl font-bold ${config.color}`}>{risk.score}</span>
                      </div>
                      <Badge className={`${config.bg} ${config.color} border ${config.border} mt-2 text-xs font-semibold`}>
                        {risk.level}
                      </Badge>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/judgments/${risk.judgmentId}`} className="hover:underline">
                        <h3 className="text-lg font-semibold text-white mb-1">{risk.title}</h3>
                      </Link>
                      <div className="flex items-center gap-3 text-sm text-slate-400 mb-4">
                        {risk.courtName && <span>{risk.courtName}</span>}
                        {risk.caseNumber && <span>• {risk.caseNumber}</span>}
                      </div>

                      {/* Factor breakdown */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <div className="text-xs text-slate-500 mb-1">Overdue</div>
                          <div className="text-lg font-bold text-red-400">{risk.factors.overdueCount}<span className="text-sm text-slate-500">/{risk.factors.totalObligations}</span></div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <div className="text-xs text-slate-500 mb-1">Max Days Late</div>
                          <div className="text-lg font-bold text-orange-400">{risk.factors.maxDaysOverdue}</div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <div className="text-xs text-slate-500 mb-1">Compliance Rate</div>
                          <div className="text-lg font-bold text-emerald-400">{risk.factors.complianceRate}%</div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                          <div className="text-xs text-slate-500 mb-1">Escalations</div>
                          <div className="text-lg font-bold text-amber-400">{risk.factors.escalationCount}</div>
                        </div>
                      </div>

                      {/* Risk bar */}
                      <div className="w-full bg-slate-800 rounded-full h-2 mt-4">
                        <div
                          className={`h-2 rounded-full transition-all ${barColor[risk.level] || 'bg-slate-600'}`}
                          style={{ width: `${risk.score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
