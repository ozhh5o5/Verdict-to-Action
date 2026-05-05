import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle2, Calendar, User, FileText, AlertTriangle, Lightbulb, ChevronRight, ArrowUpRight, Scale as ScaleIcon } from 'lucide-react'
import { format } from 'date-fns'
import { formatDeadline } from '@/lib/deadlines'
import { MOCK_DATA } from '@/data/mock-data'

interface Update {
  id: string
  status: string
  note: string
  evidenceUrl: string | null
  updatedBy: string
  updatedAt: string
}

interface EscalationEvent {
  id: string
  fromLevel: number
  toLevel: number
  fromRole: string
  toRole: string
  reason: string
  triggeredBy: string
  createdAt: string
}

interface Obligation {
  id: string
  type: string
  status: string
  priority: string
  title: string
  description: string
  deadline: string | null
  deadlineText: string | null
  sourceExcerpt: string
  sourcePage: number | null
  reasoning: string
  reasoningChain: string | null
  triggerCondition: string | null
  confidence: number
  verified: boolean
  escalationLevel: number
  assignedOfficer: string | null
  judgment: {
    id: string
    title: string
    caseNumber: string | null
    courtName: string | null
  }
  responsibleParty: {
    id: string
    name: string
    role: string
  } | null
  updates: Update[]
  escalationEvents: EscalationEvent[]
}

export default function ObligationDetail() {
  const { id } = useParams<{ id: string }>()
  const [obligation, setObligation] = useState<Obligation | null>(null)
  const [loading, setLoading] = useState(true)
  const [newStatus, setNewStatus] = useState('')
  const [newNote, setNewNote] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      // Find obligation in mock data
      const allObligations = MOCK_DATA.judgments?.flatMap((j: any) => 
        (j.obligations || []).map((o: any) => ({
          ...o,
          judgment: {
            id: j.id,
            title: j.title,
            caseNumber: j.caseNumber,
            courtName: j.courtName
          }
        }))
      ) || []
      
      const found = allObligations.find((o: any) => o.id === id) as any
      if (found) {
        console.log('Found obligation:', found.title)
        setObligation(found)
        setNewStatus(found.status)
      } else {
        console.error('Obligation not found for ID:', id)
      }
      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [id])

  const handleVerify = () => {
    if (!obligation) return
    setObligation({ ...obligation, verified: !obligation.verified })
  }

  const handleStatusUpdate = () => {
    if (!obligation || !newNote.trim()) {
      alert('Please add a note for this status update')
      return
    }
    
    const newUpdate = {
      id: Math.random().toString(36).substr(2, 9),
      status: newStatus,
      note: newNote,
      evidenceUrl: null,
      updatedBy: 'Demo User',
      updatedAt: new Date().toISOString()
    }

    setObligation({
      ...obligation,
      status: newStatus,
      updates: [newUpdate, ...obligation.updates]
    })
    setNewNote('')
  }

  const handleEscalate = () => {
    if (!obligation) return
    if (!confirm('Are you sure you want to manually escalate this obligation?')) return

    const newLevel = Math.min(obligation.escalationLevel + 1, 3)
    const roles = ['Assigned Officer', 'Department Secretary', 'Chief Secretary', "Advocate General's Office"]
    
    const newEvent = {
      id: Math.random().toString(36).substr(2, 9),
      fromLevel: obligation.escalationLevel,
      toLevel: newLevel,
      fromRole: roles[obligation.escalationLevel],
      toRole: roles[newLevel],
      reason: 'Manual Escalation by Officer',
      triggeredBy: 'Demo User',
      createdAt: new Date().toISOString()
    }

    setObligation({
      ...obligation,
      escalationLevel: newLevel,
      escalationEvents: [newEvent, ...obligation.escalationEvents]
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
          <div className="text-slate-400 text-sm">Loading obligation...</div>
        </div>
      </div>
    )
  }

  if (!obligation) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-400">
        <div className="text-lg">Obligation not found</div>
      </div>
    )
  }

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

  const levelColors = [
    'bg-blue-500 text-white border-blue-600',
    'bg-amber-500 text-slate-900 border-amber-600',
    'bg-orange-500 text-white border-orange-600',
    'bg-red-500 text-white border-red-600',
  ]

  const levelIcons = ['👤', '📋', '🏛️', '⚖️']
  const escalationRoles = ['Assigned Officer', 'Department Secretary', 'Chief Secretary', "Advocate General's Office"]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-8 mb-4">
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
            </div>
          </div>
          <Link to="/obligations" className="text-sm text-slate-400 hover:text-white mb-2 inline-flex items-center gap-1">
            ← Back to Obligations
          </Link>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge className={`${priorityColors[obligation.priority]} border text-xs`}>
                  {obligation.priority}
                </Badge>
                <Badge className={`${statusColors[obligation.status]} border text-xs`}>
                  {obligation.status}
                </Badge>
                {obligation.verified && (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
                <Badge className="bg-slate-800 text-slate-300 border-slate-700 ml-2">
                  Level {obligation.escalationLevel}: {escalationRoles[obligation.escalationLevel]}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2 leading-tight">{obligation.title}</h1>
              <div className="flex items-center gap-4 text-sm text-slate-400 flex-wrap">
                <Link to={`/judgments/${obligation.judgment.id}`} className="hover:text-blue-400 flex items-center gap-1 transition-colors">
                  <ScaleIcon className="h-4 w-4" />
                  {obligation.judgment.caseNumber || obligation.judgment.title}
                </Link>
                {obligation.assignedOfficer && (
                  <span className="flex items-center gap-1 bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700">
                    <User className="h-3.5 w-3.5 text-blue-400" />
                    {obligation.assignedOfficer}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 ml-4">
              <Button onClick={handleVerify} variant={obligation.verified ? 'outline' : 'default'} className={obligation.verified ? "border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" : "bg-emerald-600 hover:bg-emerald-500 text-white"}>
                {obligation.verified ? 'Unverify' : 'Verify Obligation'}
              </Button>
              {obligation.escalationLevel < 3 && (
                <Button onClick={handleEscalate} variant="outline" className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10 bg-transparent flex gap-1.5">
                  <ArrowUpRight className="h-4 w-4" /> Escalate
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3 border-b border-slate-800">
                <CardTitle className="text-white">Obligation Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-5">
                {obligation.triggerCondition && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded p-3">
                    <div className="text-xs font-semibold text-amber-500 mb-1 uppercase tracking-wider">Trigger Condition</div>
                    <div className="text-sm text-amber-200/90 font-medium">{obligation.triggerCondition}</div>
                  </div>
                )}
                <div>
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Description</Label>
                  <p className="text-base text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-lg border border-slate-800/50">{obligation.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-slate-950/50 p-4 rounded-lg border border-slate-800/50">
                  <div>
                    <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">Type</Label>
                    <p className="text-sm text-slate-200">{obligation.type.replace('_', ' ')}</p>
                  </div>
                  {obligation.deadline && (
                    <div>
                      <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">Deadline</Label>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-200">
                            {format(new Date(obligation.deadline), 'MMM d, yyyy')}
                          </p>
                          <p className="text-xs text-amber-400 font-medium">
                            {formatDeadline(new Date(obligation.deadline))}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3 border-b border-slate-800">
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  Source Traceability
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="bg-slate-950 rounded-lg border border-slate-800 p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Verbatim Excerpt</span>
                    <span className="text-xs text-slate-500">Page {obligation.sourcePage}</span>
                  </div>
                  <p className="text-sm italic text-slate-300 font-mono leading-relaxed">"{obligation.sourceExcerpt}"</p>
                </div>
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Lightbulb className="h-4 w-4" /> AI Reasoning Trace
                    </div>
                    <Badge variant="outline" className="text-blue-400 border-blue-500/30 bg-blue-500/10">
                      {(obligation.confidence * 100).toFixed(1)}% Confidence
                    </Badge>
                  </div>
                  <div className="space-y-2.5 text-sm text-slate-300">
                    {(() => {
                      try {
                        if (obligation.reasoningChain) {
                          const steps = JSON.parse(obligation.reasoningChain);
                          return Array.isArray(steps) ? steps.map((step: string, i: number) => (
                            <div key={i} className="flex gap-3">
                              <div className="text-blue-500/50 font-mono font-bold mt-0.5">[{i+1}]</div>
                              <div className="leading-relaxed">{step}</div>
                            </div>
                          )) : <p>{obligation.reasoning}</p>;
                        }
                      } catch (e) {
                        console.error('Error parsing reasoning chain:', e);
                      }
                      return <p>{obligation.reasoning}</p>;
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3 border-b border-slate-800">
                <CardTitle className="text-white flex items-center gap-2">
                  <ArrowUpRight className="h-5 w-5 text-amber-400" />
                  Escalation Chain
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="relative mb-8 mt-4">
                  <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-800 -translate-y-1/2 z-0"></div>
                  <div 
                    className="absolute top-1/2 left-4 h-1 bg-gradient-to-r from-blue-500 via-amber-500 to-red-500 -translate-y-1/2 z-0 transition-all duration-700"
                    style={{ width: `calc(${obligation.escalationLevel * 33.33}% - 1rem)` }}
                  ></div>
                  <div className="relative z-10 flex justify-between">
                    {escalationRoles.map((role, i) => {
                      const isPast = i <= obligation.escalationLevel
                      const isCurrent = i === obligation.escalationLevel
                      return (
                        <div key={i} className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border-2 shadow-lg transition-all duration-300 ${
                            isCurrent ? `${levelColors[i]} scale-110 ring-4 ring-slate-900` :
                            isPast ? `${levelColors[i]} opacity-80` :
                            'bg-slate-900 border-slate-700 text-slate-600'
                          }`}>
                            {levelIcons[i]}
                          </div>
                          <div className={`text-xs mt-2 font-medium max-w-[80px] text-center ${
                            isCurrent ? 'text-white' : 
                            isPast ? 'text-slate-400' : 'text-slate-600'
                          }`}>
                            {role}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {obligation.escalationEvents && obligation.escalationEvents.length > 0 && (
                  <div className="space-y-4 border-t border-slate-800 pt-5">
                    <h4 className="text-sm font-medium text-slate-400 mb-3">Escalation History</h4>
                    {[...obligation.escalationEvents].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(event => (
                      <div key={event.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 text-sm">
                            <span className="text-slate-400">{event.fromRole}</span>
                            <ChevronRight className="h-3 w-3 text-slate-600" />
                            <span className="text-white font-medium">{event.toRole}</span>
                          </div>
                          <span className="text-xs text-slate-500">{format(new Date(event.createdAt), 'MMM d, yy')}</span>
                        </div>
                        <p className="text-xs text-amber-500/80 mt-1">{event.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3 border-b border-slate-800">
                <CardTitle className="text-white text-lg">Update Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <Label className="text-slate-400 text-xs mb-1 block">New Status</Label>
                  <Select value={newStatus} onValueChange={(value) => setNewStatus(value || newStatus)}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="OVERDUE">Overdue</SelectItem>
                      <SelectItem value="DISPUTED">Disputed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-400 text-xs mb-1 block">Compliance Note</Label>
                  <Textarea
                    className="bg-slate-950 border-slate-800 text-slate-200 min-h-[100px] resize-none focus-visible:ring-blue-500"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Describe progress, blockers, or actions taken..."
                  />
                </div>
                <Button 
                  onClick={handleStatusUpdate} 
                  disabled={!newNote.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium"
                >
                  Submit Update
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3 border-b border-slate-800">
                <CardTitle className="text-white text-lg">Audit Trail</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {obligation.updates.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No updates recorded yet</p>
                ) : (
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-800">
                    {[...obligation.updates].sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map((update, index) => (
                      <div key={update.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 border-slate-900 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${index === 0 ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                          <div className="text-[10px] font-bold">{obligation.updates.length - index}</div>
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2rem)] bg-slate-950 p-3 rounded-lg border border-slate-800 shadow">
                          <div className="flex items-center justify-between mb-1">
                            <Badge className={`${statusColors[update.status]} text-[10px] px-1.5 py-0 h-4 border-none`}>{update.status}</Badge>
                            <span className="text-[10px] text-slate-500">{format(new Date(update.updatedAt), 'MMM d, h:mm a')}</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-snug">{update.note}</p>
                          <div className="text-[10px] text-slate-500 mt-2 font-medium">By {update.updatedBy}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
