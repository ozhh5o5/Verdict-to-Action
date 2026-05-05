import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileText, Loader2, CheckCircle2, ArrowLeft, Scale as ScaleIcon } from 'lucide-react'
import { MOCK_DATA } from '@/data/mock-data'

export default function NewJudgment() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

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

  const handleUpload = () => {
    if (!file) {
      setError('Please select a file')
      return
    }

    setUploading(true)
    setError('')
    setProgress('Uploading file...')

    // Simulate upload and extraction
    setTimeout(() => {
      setProgress('Extracting text from PDF...')
      setTimeout(() => {
        setProgress('Identifying parties and obligations...')
        setTimeout(() => {
          const mockJudgmentId = MOCK_DATA.judgments[0].id
          setProgress(`Extraction complete! Found ${MOCK_DATA.judgments[0].obligations.length} obligations`)
          setTimeout(() => {
            navigate(`/judgments/${mockJudgmentId}`)
          }, 1500)
        }, 1500)
      }, 1500)
    }, 1000)
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
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link to="/judgments" className="text-sm text-slate-400 hover:text-white mb-2 inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Judgments
          </Link>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Upload className="h-8 w-8 text-slate-400" />
            Upload Judgment
          </h1>
          <p className="text-slate-400 mt-1">Upload a court judgment PDF to extract obligations automatically</p>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Select Judgment PDF</CardTitle>
            <CardDescription className="text-slate-400">
              The system will extract text, identify obligations, parse deadlines, and assign responsible parties
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="border-2 border-dashed border-slate-800 rounded-lg p-12 text-center hover:border-slate-700 transition-colors bg-slate-950/50">
                <FileText className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                <div className="mb-4">
                  <input
                    id="file-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="hidden"
                  />
                  <Button 
                    onClick={() => document.getElementById('file-upload')?.click()} 
                    disabled={uploading}
                    className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Select PDF File
                  </Button>
                </div>
                {file && (
                  <div className="text-sm text-slate-300">
                    <strong>Selected:</strong> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
                <p className="text-xs text-slate-500 mt-2">PDF files only, maximum 50MB</p>
              </div>

              {error && (
                <Alert variant="destructive" className="bg-red-500/10 text-red-400 border-red-500/20">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {progress && (
                <Alert className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                  <div className="flex items-center gap-3">
                    {progress.includes('complete') ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    )}
                    <AlertDescription>{progress}</AlertDescription>
                  </div>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button 
                  onClick={handleUpload} 
                  disabled={!file || uploading} 
                  size="lg" 
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold"
                >
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
                <Link to="/judgments">
                  <Button variant="outline" size="lg" disabled={uploading} className="border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800">
                    Cancel
                  </Button>
                </Link>
              </div>

              <div className="bg-slate-950 rounded-lg p-4 text-sm text-slate-400 border border-slate-800">
                <h4 className="font-semibold mb-2 text-white">What happens next:</h4>
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
