'use client'

import { useEffect, useState, useRef } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Calendar, Scale, CheckCircle2, ShieldAlert, ArrowLeft, Lightbulb, AlertTriangle, Crosshair, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { formatDeadline } from '@/lib/deadlines'

interface Party {
  id: string
  name: string
  role: string
}

interface StatutoryConflict {
  id: string
  statuteLawId: string
  conflictType: string
  severity: string
  description: string
  recommendation: string
  statuteLaw: {
    shortName: string
    section: string
    provision: string
  }
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
  responsibleParty: Party | null
  statutoryConflicts: StatutoryConflict[]
}

interface Judgment {
  id: string
  title: string
  courtName: string | null
  caseNumber: string | null
  benchComposition: string | null
  judgmentDate: string | null
  fullText: string | null
  pageCount: number | null
  status: string
  contemptRiskScore: number
  contemptRiskLevel: string
  uploadedAt: string
  obligations: Obligation[]
  parties: Party[]
}

export default function JudgmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [judgment, setJudgment] = useState<Judgment | null>(null)
  const [conflicts, setConflicts] = useState<{ obligation: { id: string, title: string, priority: string }, conflicts: StatutoryConflict[] }[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [highlightedExcerpt, setHighlightedExcerpt] = useState<string | null>(null)
  
  const textRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/judgments/${id}`).then(r => r.json()),
      fetch(`/api/judgments/${id}/conflicts`).then(r => r.json())
    ]).then(([judgmentData, conflictsData]) => {
      setJudgment(judgmentData)
      
      // Group conflicts by obligation
      const groupedConflicts: { [key: string]: any } = {}
      ;(conflictsData.conflicts || []).forEach((c: any) => {
        if (!groupedConflicts[c.obligationId]) {
          groupedConflicts[c.obligationId] = {
            obligation: c.obligation,
            conflicts: []
          }
        }
        groupedConflicts[c.obligationId].conflicts.push(c)
      })
      setConflicts(Object.values(groupedConflicts))
      setLoading(false)
    })
  }, [id])

  const handleVerify = async (obligationId: string, currentVerified: boolean) => {
    await fetch(`/api/obligations/${obligationId}/verify`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified: !currentVerified }),
    })
    
    if (judgment) {
      setJudgment({
        ...judgment,
        obligations: judgment.obligations.map(o =>
          o.id === obligationId ? { ...o, verified: !currentVerified } : o
        ),
      })
    }
  }

  const scrollToSource = (excerpt: string) => {
    setHighlightedExcerpt(excerpt)
    // In a real app with pdf.js, we would jump to the page & coordinate.
    // Here we find the text in the <pre> block and scroll it into view.
    setTimeout(() => {
      if (textRef.current) {
        const textNodes = Array.from(textRef.current.childNodes)
        for (const node of textNodes) {
          if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === 'SPAN') {
            const span = node as HTMLSpanElement
            if (span.innerText === excerpt) {
              span.scrollIntoView({ behavior: 'smooth', block: 'center' })
              break
            }
          }
        }
      }
    }, 100)
  }

  // Highlight the text in the full document
  const renderHighlightedText = (fullText: string | null) => {
    if (!fullText) return 'Text not available'
    if (!highlightedExcerpt) return fullText

    const parts = fullText.split(highlightedExcerpt)
    if (parts.length === 1) return fullText // not found exact match

    return (
      <>
        {parts[0]}
        <span className="bg-amber-200 text-amber-900 px-1 py-0.5 rounded transition-all duration-500 font-bold">
          {highlightedExcerpt}
        </span>
        {parts.slice(1).join(highlightedExcerpt)}
      </>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
          <div className="text-slate-400 text-sm">Loading judgment details...</div>
        </div>
      </div>
    )
  }

  if (!judgment) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-400">
        <div className="text-lg">Judgment not found</div>
      </div>
    )
  }

  const filteredObligations = filter === 'all' 
    ? judgment.obligations 
    : judgment.obligations.filter(o => o.type === filter || o.priority === filter || o.status === filter)

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

  const riskColors: { [key: string]: string } = {
    CRITICAL: 'bg-red-500 text-white',
    HIGH: 'bg-orange-500 text-white',
    MODERATE: 'bg-amber-500 text-white',
    LOW: 'bg-emerald-500 text-white',
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navigation & Header */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/judgments" className="text-sm text-slate-400 hover:text-white mb-2 inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Judgments
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{judgment.title}</h1>
              <div className="flex items-center gap-4 text-sm text-slate-400 flex-wrap">
                {judgment.courtName && <span className="flex items-center gap-1.5"><Scale className="h-4 w-4" /> {judgment.courtName}</span>}
                {judgment.caseNumber && <span>• Case No: <span className="text-slate-300">{judgment.caseNumber}</span></span>}
                {judgment.judgmentDate && (
                  <span className="flex items-center gap-1">
                    • <Calendar className="h-4 w-4" />
                    {format(new Date(judgment.judgmentDate), 'MMM d, yyyy')}
                  </span>
                )}
                {judgment.benchComposition && <span>• Bench: <span className="text-slate-300">{judgment.benchComposition}</span></span>}
              </div>
            </div>
            {/* Risk Badge */}
            <div className="flex flex-col items-end bg-slate-800/50 rounded-lg p-2 border border-slate-700/50">
              <span className="text-xs text-slate-400 mb-1 font-medium tracking-wide uppercase">Contempt Risk</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">{judgment.contemptRiskScore}</span>
                <Badge className={`${riskColors[judgment.contemptRiskLevel]} border-none shadow-sm`}>
                  {judgment.contemptRiskLevel}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="side-by-side" className="h-full flex flex-col">
          <TabsList className="bg-slate-900 border-slate-800 p-1 mb-6 self-start">
            <TabsTrigger value="side-by-side" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">
              Side-by-Side Verification
            </TabsTrigger>
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">
              Overview & Parties
            </TabsTrigger>
            <TabsTrigger value="conflicts" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400 flex items-center gap-2">
              Statutory Conflicts
              {conflicts.length > 0 && (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 px-1.5 py-0 min-w-[20px] h-5 flex items-center justify-center">
                  {conflicts.reduce((sum, c) => sum + c.conflicts.length, 0)}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* SIDE-BY-SIDE VERIFICATION VIEW (Core Feature) */}
          <TabsContent value="side-by-side" className="flex-1 m-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-280px)] min-h-[600px]">
              
              {/* Left Pane: Extracted Action Plan */}
              <Card className="bg-slate-900 border-slate-800 flex flex-col h-full overflow-hidden">
                <CardHeader className="bg-slate-900/95 backdrop-blur z-10 border-b border-slate-800 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white text-lg flex items-center gap-2">
                        <Crosshair className="h-5 w-5 text-blue-400" />
                        Extracted Action Plan
                      </CardTitle>
                      <CardDescription className="text-slate-400 mt-1">
                        {judgment.obligations.length} obligations detected. Click any to highlight source.
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <select 
                        className="bg-slate-800 border border-slate-700 text-sm text-slate-200 rounded-md px-3 py-1.5 outline-none focus:border-blue-500"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                      >
                        <option value="all">All Obligations</option>
                        <option value="CRITICAL">Critical Priority</option>
                        <option value="PENDING">Pending Status</option>
                        <option value="DEADLINE_BOUND">Deadline Bound</option>
                      </select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {filteredObligations.map(obligation => (
                    <div 
                      key={obligation.id} 
                      className={`border rounded-lg p-4 transition-all cursor-pointer ${
                        highlightedExcerpt === obligation.sourceExcerpt 
                          ? 'bg-slate-800 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                      onClick={() => scrollToSource(obligation.sourceExcerpt)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 pr-4">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge className={`${priorityColors[obligation.priority]} border text-xs`}>
                              {obligation.priority}
                            </Badge>
                            <Badge className={`${statusColors[obligation.status]} border text-xs`}>
                              {obligation.status}
                            </Badge>
                            {obligation.verified && (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center gap-1 text-xs">
                                <CheckCircle2 className="h-3 w-3" /> Verified
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-semibold text-white leading-snug">{obligation.title}</h4>
                        </div>
                        <Button
                          variant={obligation.verified ? "outline" : "default"}
                          size="sm"
                          className={obligation.verified ? "border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 shrink-0" : "bg-blue-600 hover:bg-blue-500 text-white shrink-0"}
                          onClick={(e) => { e.stopPropagation(); handleVerify(obligation.id, obligation.verified); }}
                        >
                          {obligation.verified ? 'Unverify' : 'Verify'}
                        </Button>
                      </div>

                      {obligation.triggerCondition && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded px-3 py-2 mb-3">
                          <div className="text-xs font-semibold text-amber-500 mb-1 uppercase tracking-wider">Trigger Condition</div>
                          <div className="text-sm text-amber-200/90">{obligation.triggerCondition}</div>
                        </div>
                      )}

                      <p className="text-sm text-slate-400 mb-4">{obligation.description}</p>

                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm bg-slate-950/50 rounded-lg p-3 border border-slate-800/50">
                        {obligation.deadline && (
                          <div>
                            <span className="text-slate-500 block text-xs mb-1 uppercase tracking-wider font-semibold">Deadline</span>
                            <span className="text-slate-200 block">{formatDeadline(new Date(obligation.deadline))}</span>
                            {obligation.deadlineText && (
                              <span className="text-slate-500 text-xs">({obligation.deadlineText})</span>
                            )}
                          </div>
                        )}
                        {obligation.responsibleParty && (
                          <div>
                            <span className="text-slate-500 block text-xs mb-1 uppercase tracking-wider font-semibold">Owner</span>
                            <span className="text-slate-200 block truncate" title={obligation.responsibleParty.name}>
                              {obligation.responsibleParty.name}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Chain of Thought Reasoning */}
                      <details className="group" onClick={(e) => e.stopPropagation()}>
                        <summary className="text-xs font-medium text-blue-400 cursor-pointer flex items-center gap-1.5 select-none hover:text-blue-300 transition-colors">
                          <Lightbulb className="h-3.5 w-3.5" />
                          View AI Reasoning Trace ({(obligation.confidence * 100).toFixed(0)}% confidence)
                        </summary>
                        <div className="mt-3 bg-slate-950 rounded-md p-3 border border-slate-800 text-xs text-slate-400 space-y-2 max-h-[200px] overflow-y-auto">
                          {obligation.reasoningChain ? (
                            JSON.parse(obligation.reasoningChain).map((step: string, i: number) => (
                              <div key={i} className="flex gap-2">
                                <div className="text-slate-600 shrink-0">[{i+1}]</div>
                                <div>{step}</div>
                              </div>
                            ))
                          ) : (
                            <div className="flex gap-2">
                              <div className="text-slate-600 shrink-0">[1]</div>
                              <div>{obligation.reasoning}</div>
                            </div>
                          )}
                        </div>
                      </details>

                      <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
                        <span className="text-xs text-slate-500">Source: Page {obligation.sourcePage}</span>
                        <Link href={`/obligations/${obligation.id}`} onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-400 hover:text-white">
                            Full Details →
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                  {filteredObligations.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                      No obligations match the current filter.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Right Pane: Source Document */}
              <Card className="bg-slate-900 border-slate-800 flex flex-col h-full overflow-hidden">
                <CardHeader className="bg-slate-900/95 backdrop-blur z-10 border-b border-slate-800 py-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-emerald-400" />
                      Original Judgment Text
                    </CardTitle>
                    <Badge variant="outline" className="border-slate-700 text-slate-400 bg-slate-950">
                      {judgment.pageCount} Pages
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-0">
                  <div className="p-6 h-full">
                    <pre 
                      ref={textRef}
                      className="whitespace-pre-wrap text-[13px] leading-[1.8] text-slate-300 font-mono"
                      style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
                    >
                      {renderHighlightedText(judgment.fullText)}
                    </pre>
                  </div>
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          {/* STATUTORY CONFLICTS */}
          <TabsContent value="conflicts" className="m-0">
            <Card className="bg-slate-900 border-slate-800 min-h-[600px]">
              <CardHeader className="border-b border-slate-800">
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  Statutory Contradiction Detection
                </CardTitle>
                <CardDescription className="text-slate-400">
                  AI cross-references extracted obligations against state laws to detect potential legal conflicts before execution.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {conflicts.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No Conflicts Detected</h3>
                    <p className="text-slate-400 max-w-md mx-auto">
                      All extracted obligations appear to be fully compliant with the seeded state laws database.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {conflicts.map((group, i) => (
                      <div key={i} className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/50">
                        <div className="bg-slate-900 border-b border-slate-800 p-4">
                          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Obligation Under Review</div>
                          <div className="flex items-start gap-3">
                            <Badge className={`${priorityColors[group.obligation.priority]} border mt-0.5 shrink-0`}>
                              {group.obligation.priority}
                            </Badge>
                            <Link href={`/obligations/${group.obligation.id}`} className="text-white font-medium hover:underline leading-snug">
                              {group.obligation.title}
                            </Link>
                          </div>
                        </div>
                        <div className="p-4 space-y-4">
                          {group.conflicts.map(conflict => (
                            <Alert key={conflict.id} className="bg-red-500/5 border-red-500/20 text-slate-200">
                              <AlertTriangle className="h-5 w-5 text-red-400" />
                              <AlertTitle className="text-red-400 font-semibold flex items-center gap-2 mb-2">
                                {conflict.conflictType.replace('_', ' ')}
                                <Badge className="bg-red-500 text-white border-none h-5 text-[10px]">{conflict.severity}</Badge>
                              </AlertTitle>
                              <AlertDescription className="mt-3 space-y-3">
                                <p className="text-sm">{conflict.description}</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                  <div className="bg-slate-950 p-3 rounded border border-slate-800">
                                    <div className="text-xs text-slate-500 mb-1.5 font-medium">COURT DIRECTIVE</div>
                                    <div className="text-sm italic text-slate-400">"{group.conflicts[0].description}"</div> {/* Mock text */}
                                  </div>
                                  <div className="bg-slate-950 p-3 rounded border border-slate-800">
                                    <div className="text-xs text-blue-400 mb-1.5 font-medium">{conflict.statuteLaw.shortName.toUpperCase()} — {conflict.statuteLaw.section.toUpperCase()}</div>
                                    <div className="text-sm italic text-slate-300">"{conflict.statuteLaw.provision}"</div>
                                  </div>
                                </div>

                                <div className="bg-amber-500/10 border border-amber-500/20 rounded p-3 mt-4">
                                  <div className="text-xs text-amber-500 font-bold mb-1 uppercase tracking-wider">AI Recommendation</div>
                                  <div className="text-sm text-amber-200/90">{conflict.recommendation}</div>
                                </div>
                              </AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* OVERVIEW & PARTIES */}
          <TabsContent value="overview" className="m-0">
             {/* Simple fallback view containing what was in Overview + Parties */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Judgment Metadata</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase">Court</div>
                      <div className="text-sm text-slate-200 mt-1">{judgment.courtName || 'Not specified'}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase">Case Number</div>
                      <div className="text-sm text-slate-200 mt-1">{judgment.caseNumber || 'Not specified'}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase">Date</div>
                      <div className="text-sm text-slate-200 mt-1">
                        {judgment.judgmentDate ? format(new Date(judgment.judgmentDate), 'MMM d, yyyy') : 'Not specified'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase">Bench</div>
                      <div className="text-sm text-slate-200 mt-1">{judgment.benchComposition || 'Not specified'}</div>
                    </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Parties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {judgment.parties.map(party => (
                       <div key={party.id} className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                         <div>
                           <div className="text-sm font-medium text-slate-200">{party.name}</div>
                           <div className="text-xs text-slate-500 capitalize mt-0.5">{party.role}</div>
                         </div>
                         <Badge variant="outline" className="border-slate-700 text-slate-400 bg-slate-900">
                           {judgment.obligations.filter(o => o.responsibleParty?.id === party.id).length} obligations
                         </Badge>
                       </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  )
}
