import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Scale as ScaleIcon, Calendar, User, ArrowLeft } from 'lucide-react'
import { formatDeadline } from '@/lib/deadlines'
import { MOCK_DATA } from '@/data/mock-data'

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

export default function ObligationList() {
  const [obligations, setObligations] = useState<Obligation[]>([])
  const [loading, setLoading] = useState(true)
  const [groupBy, setGroupBy] = useState<'status' | 'priority'>('status')

  useEffect(() => {
    const timer = setTimeout(() => {
      // Use mock data
      const data = MOCK_DATA.judgments.flatMap((j: any) => 
        j.obligations.map((o: any) => ({
          ...o,
          judgment: {
            id: j.id,
            title: j.title,
            caseNumber: j.caseNumber
          }
        }))
      )
      setObligations(data)
      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const priorityColors: { [key: string]: string } = {
    CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/30',
    HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    LOW: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  }

  const statusColors: { [key: string]: string } = {
    PENDING: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    IN_PROGRESS: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    OVERDUE: 'bg-red-500/10 text-red-400 border-red-500/30',
    DISPUTED: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
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
                <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Dashboard</Link>
                <Link to="/judgments" className="px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Judgments</Link>
                <Link to="/obligations" className="px-3 py-2 rounded-md text-sm font-medium text-white bg-slate-800 transition-colors">Obligations</Link>
                <Link to="/contempt-risk" className="px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Contempt Risk</Link>
                <Link to="/escalation" className="px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Escalations</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link to="/" className="text-sm text-slate-400 hover:text-white mb-2 inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <ScaleIcon className="h-8 w-8 text-slate-400" />
                All Obligations
              </h1>
              <p className="text-slate-400 mt-1">{obligations.length} total obligations across all judgments</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={groupBy === 'status' ? 'default' : 'outline'}
                onClick={() => setGroupBy('status')}
                className={groupBy === 'status' ? "bg-blue-600 hover:bg-blue-500 border-none" : "border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"}
              >
                Group by Status
              </Button>
              <Button
                variant={groupBy === 'priority' ? 'default' : 'outline'}
                onClick={() => setGroupBy('priority')}
                className={groupBy === 'priority' ? "bg-amber-500 hover:bg-amber-400 text-slate-900 border-none font-semibold" : "border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"}
              >
                Group by Priority
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading obligations...</div>
        ) : obligations.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="py-12 text-center">
              <ScaleIcon className="h-12 w-12 text-slate-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No obligations yet</h3>
              <p className="text-slate-500 mb-6">Upload a judgment to extract obligations</p>
              <Link to="/judgments/new">
                <Button className="bg-amber-500 hover:bg-amber-400 text-slate-900">Upload Judgment</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedObligations).map(([group, items]: [string, Obligation[]]) => (
              items.length > 0 && (
                <div key={group}>
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-xl font-semibold text-white">{group.replace('_', ' ')}</h2>
                    <Badge className={`${groupBy === 'status' ? statusColors[group] : priorityColors[group]} border`}>
                      {items.length}
                    </Badge>
                  </div>
                  <div className="grid gap-4">
                    {items.map(obligation => (
                      <Link key={obligation.id} to={`/obligations/${obligation.id}`}>
                        <Card className={`bg-slate-900 hover:border-slate-600 transition-colors cursor-pointer border-l-4 ${
                          groupBy === 'priority' ? priorityColors[obligation.priority].split(' ')[2].replace('/10', '') : 'border-slate-800'
                        } border-t-slate-800 border-r-slate-800 border-b-slate-800`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  {groupBy === 'status' && (
                                    <Badge className={`${priorityColors[obligation.priority]} border text-xs`}>
                                      {obligation.priority}
                                    </Badge>
                                  )}
                                  {groupBy === 'priority' && (
                                    <Badge className={`${statusColors[obligation.status]} border text-xs`}>
                                      {obligation.status}
                                    </Badge>
                                  )}
                                  {obligation.verified && (
                                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center gap-1 text-xs">
                                      <CheckCircle2 className="h-3 w-3" /> Verified
                                    </Badge>
                                  )}
                                </div>
                                <h3 className="font-semibold text-white mb-1">{obligation.title}</h3>
                                <p className="text-sm text-slate-400 mb-2 line-clamp-2">{obligation.description}</p>
                                <div className="flex items-center gap-4 text-sm text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <ScaleIcon className="h-4 w-4" />
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
                                  <Calendar className="h-5 w-5 text-slate-600 mb-1" />
                                  <div className="text-sm font-medium text-amber-400 text-right">
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

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
