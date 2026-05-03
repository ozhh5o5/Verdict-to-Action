'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileText, Loader2, CheckCircle2 } from 'lucide-react'

export default function UploadJudgmentPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Please select a PDF file')
        return
      }
      setFile(selectedFile)
      setError('')
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file')
      return
    }

    setUploading(true)
    setError('')
    setProgress('Uploading file...')

    const formData = new FormData()
    formData.append('file', file)

    try {
      setProgress('Extracting text from PDF...')
      
      const response = await fetch('/api/judgments/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()
      
      setProgress(`Extraction complete! Found ${result.obligationCount} obligations`)
      
      setTimeout(() => {
        router.push(`/judgments/${result.judgmentId}`)
      }, 1500)
    } catch (err) {
      setError('Failed to upload and extract judgment. Please try again.')
      setUploading(false)
      setProgress('')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/judgments" className="text-sm text-slate-600 hover:text-slate-900 mb-2 inline-block">
            ← Back to Judgments
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Upload className="h-8 w-8 text-slate-700" />
            Upload Judgment
          </h1>
          <p className="text-slate-600 mt-1">Upload a court judgment PDF to extract obligations automatically</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Select Judgment PDF</CardTitle>
            <CardDescription>
              The system will extract text, identify obligations, parse deadlines, and assign responsible parties
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center hover:border-slate-400 transition-colors">
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <div className="mb-4">
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="hidden"
                  />
                  <Button onClick={() => document.getElementById('file-upload')?.click()} disabled={uploading}>
                    <Upload className="h-4 w-4 mr-2" />
                    Select PDF File
                  </Button>
                </div>
                {file && (
                  <div className="text-sm text-slate-700">
                    <strong>Selected:</strong> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
                <p className="text-xs text-slate-500 mt-2">PDF files only, maximum 50MB</p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {progress && (
                <Alert>
                  <div className="flex items-center gap-3">
                    {uploading && progress.includes('complete') ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    )}
                    <AlertDescription>{progress}</AlertDescription>
                  </div>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button onClick={handleUpload} disabled={!file || uploading} size="lg" className="flex-1">
                  {uploading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 mr-2" />
                      Upload & Extract
                    </>
                  )}
                </Button>
                <Link href="/judgments">
                  <Button variant="outline" size="lg" disabled={uploading}>
                    Cancel
                  </Button>
                </Link>
              </div>

              <div className="bg-slate-100 rounded-lg p-4 text-sm text-slate-700">
                <h4 className="font-semibold mb-2">What happens next:</h4>
                <ol className="list-decimal list-inside space-y-1">
                  <li>PDF text is extracted</li>
                  <li>AI identifies parties (petitioner, respondent, state)</li>
                  <li>Obligations are extracted with deadlines and responsible parties</li>
                  <li>Each obligation is linked to its source paragraph for traceability</li>
                  <li>You can verify and track obligations in the dashboard</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
