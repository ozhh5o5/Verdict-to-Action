'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileText, Upload, Calendar, Scale } from 'lucide-react'
import { format } from 'date-fns'

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

export default function JudgmentsPage() {
  const [judgments, setJudgments] = useState<Judgment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/judgments')
      .then(r => r.json())
      .then(data => {
        setJudgments(data.judgments || [])
        setLoading(false)
      })
  }, [])

  const statusColors: { [key: string]: string } = {
    UPLOADED: 'bg-blue-100 text-blue-800',
    PARSING: 'bg-yellow-100 text-yellow-800',
    PARSED: 'bg-green-100 text-green-800',
    ERROR: 'bg-red-100 text-red-800',
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
                <FileText className="h-8 w-8 text-slate-700" />
                All Judgments
              </h1>
              <p className="text-slate-600 mt-1">{judgments.length} judgment{judgments.length !== 1 ? 's' : ''} uploaded</p>
            </div>
            <Link href="/judgments/new">
              <Button size="lg" className="gap-2">
                <Upload className="h-5 w-5" />
                Upload Judgment
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Judgments</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-slate-600">Loading judgments...</div>
            ) : judgments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No judgments yet</h3>
                <p className="text-slate-600 mb-6">Upload your first court judgment to extract obligations</p>
                <Link href="/judgments/new">
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Judgment
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title / Case Number</TableHead>
                    <TableHead>Court</TableHead>
                    <TableHead>Judgment Date</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Obligations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {judgments.map(judgment => (
                    <TableRow key={judgment.id} className="cursor-pointer hover:bg-slate-50">
                      <TableCell>
                        <Link href={`/judgments/${judgment.id}`} className="block">
                          <div className="font-medium text-slate-900">{judgment.title}</div>
                          {judgment.caseNumber && (
                            <div className="text-sm text-slate-600">{judgment.caseNumber}</div>
                          )}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-900">{judgment.courtName || '—'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-slate-900">
                          {judgment.judgmentDate ? (
                            <>
                              <Calendar className="h-4 w-4 text-slate-400" />
                              {format(new Date(judgment.judgmentDate), 'MMM d, yyyy')}
                            </>
                          ) : (
                            '—'
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-600">
                          {format(new Date(judgment.uploadedAt), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[judgment.status] || 'bg-slate-100 text-slate-800'}>
                          {judgment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/judgments/${judgment.id}`}>
                          <Button variant="ghost" size="sm" className="gap-2">
                            <Scale className="h-4 w-4" />
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
