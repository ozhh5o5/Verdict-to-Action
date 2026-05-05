import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Scale, AlertCircle, CheckCircle2, Upload, ShieldAlert, ArrowUpRight, Scale as ScaleIcon } from 'lucide-react'
import { formatDeadline } from '@/lib/deadlines'
import { MOCK_DATA } from '@/data/mock-data'

interface Stats {
  totalJudgments: number
  totalObligations: number
  activeObligations: number
  overdueCount: number
  completedThisMonth: number
  byStatus: { [key: string]: number }
  byPriority: { [key: string]: number }
}

interface Deadline {
  id: string
  title: string
  deadline: string
  priority: string
  judgment: {
    id: string
    title: string
    caseNumber: string | null
  }
}

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
  }
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [risks, setRisks] = useState<ContemptRisk[]>([])
  const [escalationCount, setEscalationCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API fetch delay
    const timer = setTimeout(() => {
      setStats(MOCK_DATA.stats)
      setDeadlines(MOCK_DATA.deadlines as any || [])
      setRisks(MOCK_DATA.contemptRisks as any || [])
      setEscalationCount(MOCK_DATA.escalations?.length || 0)
      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          <div className="text-slate-400 text-sm">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  const priorityColors: { [key: string]: string } = {
    CRITICAL: 'bg-red-500',
    HIGH: 'bg-orange-500',
    MEDIUM: 'bg-amber-500',
    LOW: 'bg-emerald-500',
  }

  const riskColors: { [key: string]: string } = {
    CRITICAL: 'text-red-400 bg-red-500/10 border-red-500/30',
    HIGH: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    MODERATE: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    LOW: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
                  <ScaleIcon className="h-4.5 w-4.5 text-white" />
                </div>
                <span className="text-lg font-bold tracking-tight">Verdict→Action</span>
              </Link>
              <div className="hidden md:flex items-center gap-1">
                <Link to="/judgments" className="px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                  Judgments
                </Link>
                <Link to="/obligations" className="px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                  Obligations
                </Link>
                <Link to="/contempt-risk" className="px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                  Contempt Risk
                </Link>
                <Link to="/escalation" className="px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                  Escalations
                </Link>
              </div>
            </div>
            <Link to="/judgments/new">
              <Button className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold gap-2 shadow-lg shadow-amber-500/20">
                <Upload className="h-4 w-4" />
                Upload Judgment
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero stats */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Command Center</h1>
          <p className="text-slate-400 text-sm">Court judgment compliance monitoring dashboard</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
          <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center justify-between mb-3">
                <FileText className="h-5 w-5 text-slate-500" />
                <span className="text-xs text-slate-500 font-medium">JUDGMENTS</span>
              </div>
              <div className="text-3xl font-bold text-white">{stats?.totalJudgments || 0}</div>
              <p className="text-xs text-slate-500 mt-1">
                {stats?.totalObligations || 0} obligations
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center justify-between mb-3">
                <Scale className="h-5 w-5 text-blue-400" />
                <span className="text-xs text-slate-500 font-medium">ACTIVE</span>
              </div>
              <div className="text-3xl font-bold text-white">{stats?.activeObligations || 0}</div>
              <p className="text-xs text-slate-500 mt-1">Pending or in progress</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 border-l-2 border-l-red-500 hover:border-slate-700 transition-colors">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center justify-between mb-3">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <span className="text-xs text-red-400 font-medium">OVERDUE</span>
              </div>
              <div className="text-3xl font-bold text-red-400">{stats?.overdueCount || 0}</div>
              <p className="text-xs text-slate-500 mt-1">Require immediate action</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center justify-between mb-3">
                <ArrowUpRight className="h-5 w-5 text-amber-400" />
                <span className="text-xs text-amber-400 font-medium">ESCALATIONS</span>
              </div>
              <div className="text-3xl font-bold text-amber-400">{escalationCount}</div>
              <p className="text-xs text-slate-500 mt-1">Active escalation events</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center justify-between mb-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">COMPLETED</span>
              </div>
              <div className="text-3xl font-bold text-emerald-400">{stats?.completedThisMonth || 0}</div>
              <p className="text-xs text-slate-500 mt-1">This month</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
          {/* Contempt Risk Card */}
          <Card className="bg-slate-900 border-slate-800 lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-red-400" />
                  Contempt Risk
                </CardTitle>
                <Link to="/contempt-risk">
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white text-xs">
                    View All →
                  </Button>
                </Link>
              </div>
              <CardDescription className="text-slate-500">Highest risk judgments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {risks.slice(0, 3).map(risk => (
                  <Link key={risk.judgmentId} to={`/judgments/${risk.judgmentId}`}>
                    <div className="p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer border border-slate-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white truncate flex-1 mr-2">{risk.title}</span>
                        <Badge className={`${riskColors[risk.level]} border text-xs font-semibold`}>
                          {risk.score}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{risk.factors.overdueCount} overdue</span>
                        <span>•</span>
                        <span>{risk.factors.maxDaysOverdue}d max</span>
                        <span>•</span>
                        <span className={risk.level === 'CRITICAL' || risk.level === 'HIGH' ? 'text-red-400' : ''}>{risk.level}</span>
                      </div>
                      {/* Risk bar */}
                      <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            risk.level === 'CRITICAL' ? 'bg-red-500' :
                            risk.level === 'HIGH' ? 'bg-orange-500' :
                            risk.level === 'MODERATE' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${risk.score}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                ))}
                {risks.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No risk data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Priority Distribution */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">Obligations by Priority</CardTitle>
              <CardDescription className="text-slate-500">Distribution across priority levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(priority => {
                  const count = stats?.byPriority[priority] || 0
                  const pct = ((count) / (stats?.totalObligations || 1)) * 100
                  return (
                    <div key={priority} className="flex items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={`w-2.5 h-2.5 rounded-full ${priorityColors[priority]}`} />
                          <span className="text-sm font-medium text-slate-300">{priority}</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${priorityColors[priority]} transition-all`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="ml-4 text-sm font-bold text-white w-6 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">Upcoming Deadlines</CardTitle>
              <CardDescription className="text-slate-500">Next 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {deadlines.slice(0, 5).map(deadline => (
                  <Link key={deadline.id} to={`/obligations/${deadline.id}`}>
                    <div className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${priorityColors[deadline.priority]} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{deadline.title}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {deadline.judgment.caseNumber || deadline.judgment.title}
                        </p>
                        <p className="text-xs text-amber-400 mt-0.5">
                          {formatDeadline(deadline.deadline ? new Date(deadline.deadline) : null)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
                {deadlines.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No upcoming deadlines</p>
                )}
                {deadlines.length > 5 && (
                  <Link to="/obligations">
                    <Button variant="outline" className="w-full border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 mt-2">
                      View All Obligations
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <Link to="/judgments">
                <Button variant="outline" className="w-full justify-start gap-2 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 h-11">
                  <FileText className="h-4 w-4 text-blue-400" />
                  All Judgments
                </Button>
              </Link>
              <Link to="/obligations">
                <Button variant="outline" className="w-full justify-start gap-2 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 h-11">
                  <ScaleIcon className="h-4 w-4 text-purple-400" />
                  Track Obligations
                </Button>
              </Link>
              <Link to="/contempt-risk">
                <Button variant="outline" className="w-full justify-start gap-2 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 h-11">
                  <ShieldAlert className="h-4 w-4 text-red-400" />
                  Contempt Risk
                </Button>
              </Link>
              <Link to="/escalation">
                <Button variant="outline" className="w-full justify-start gap-2 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 h-11">
                  <ArrowUpRight className="h-4 w-4 text-amber-400" />
                  Escalation Tracker
                </Button>
              </Link>
              <Link to="/judgments/new">
                <Button className="w-full justify-start gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold h-11">
                  <Upload className="h-4 w-4" />
                  Upload Judgment
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
