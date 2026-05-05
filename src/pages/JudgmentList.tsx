import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileText, Upload, Calendar, Scale as ScaleIcon, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { MOCK_DATA } from '@/data/mock-data'

interface Judgment {
  id: string
  title: string
  courtName: string | null
  caseNumber: string | null
  judgmentDate: string | null
  uploadedAt: string
  status: string
  obligationCount: number
}

export default function JudgmentList() {
  const [judgments, setJudgments] = useState<Judgment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      // Use mock data
      const data = MOCK_DATA.judgments.map((j: any) => ({
        id: j.id,
        title: j.title,
        courtName: j.courtName,
        caseNumber: j.caseNumber,
        judgmentDate: j.judgmentDate,
        uploadedAt: j.uploadedAt,
        status: j.status,
        obligationCount: (j.obligations || []).length
      }))
      setJudgments(data)
      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const statusColors: { [key: string]: string } = {
    UPLOADED: 'bg-blue-100 text-blue-800',
    PARSING: 'bg-yellow-100 text-yellow-800',
    PARSED: 'bg-green-100 text-green-800',
    ERROR: 'bg-red-100 text-red-800',
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
                <Link to="/judgments" className="px-3 py-2 rounded-md text-sm font-medium text-white bg-slate-800 transition-colors">Judgments</Link>
                <Link to="/obligations" className="px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Obligations</Link>
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
                <FileText className="h-8 w-8 text-slate-400" />
                All Judgments
              </h1>
              <p className="text-slate-400 mt-1">{judgments.length} judgment{judgments.length !== 1 ? 's' : ''} uploaded</p>
            </div>
            <Link to="/judgments/new">
              <Button size="lg" className="gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold shadow-lg shadow-amber-500/20">
                <Upload className="h-5 w-5" />
                Upload Judgment
              </Button>
            </Link>
          </div>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Uploaded Judgments</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-slate-400">Loading judgments...</div>
            ) : judgments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No judgments yet</h3>
                <p className="text-slate-500 mb-6">Upload your first court judgment to extract obligations</p>
                <Link to="/judgments/new">
                  <Button className="bg-amber-500 hover:bg-amber-400 text-slate-900">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Judgment
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader className="border-slate-800">
                  <TableRow className="hover:bg-transparent border-slate-800">
                    <TableHead className="text-slate-400">Title / Case Number</TableHead>
                    <TableHead className="text-slate-400">Court</TableHead>
                    <TableHead className="text-slate-400">Judgment Date</TableHead>
                    <TableHead className="text-slate-400">Uploaded</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-right text-slate-400">Obligations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {judgments.map(judgment => (
                    <TableRow key={judgment.id} className="cursor-pointer hover:bg-slate-800 border-slate-800">
                      <TableCell>
                        <Link to={`/judgments/${judgment.id}`} className="block">
                          <div className="font-medium text-white">{judgment.title}</div>
                          {judgment.caseNumber && (
                            <div className="text-sm text-slate-400">{judgment.caseNumber}</div>
                          )}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-300">{judgment.courtName || '—'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          {judgment.judgmentDate ? (
                            <>
                              <Calendar className="h-4 w-4 text-slate-500" />
                              {format(new Date(judgment.judgmentDate), 'MMM d, yyyy')}
                            </>
                          ) : (
                            '—'
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-400">
                          {format(new Date(judgment.uploadedAt), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[judgment.status] || 'bg-slate-800 text-slate-300'} border-none`}>
                          {judgment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/judgments/${judgment.id}`}>
                          <Button variant="ghost" size="sm" className="gap-2 text-slate-300 hover:text-white hover:bg-slate-700">
                            <ScaleIcon className="h-4 w-4" />
                            <span className="font-semibold">{judgment.obligationCount}</span>
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
