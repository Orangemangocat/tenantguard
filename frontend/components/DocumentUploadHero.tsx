import React, { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, Shield, Clock, CheckCircle, AlertTriangle, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface AnalysisResult {
  documentType: string
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low'
  deadline: string
  summary: string
  rights: string[]
  recommendedActions: string[]
}

export default function DocumentUploadHero() {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      processFile(droppedFile)
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      processFile(selectedFile)
    }
  }, [])

  const processFile = (selectedFile: File) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/heif']
    const maxSize = 20 * 1024 * 1024 // 20MB

    if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(pdf|jpg|jpeg|png|heic|heif)$/i)) {
      setError('Please upload a PDF or image file (JPG, PNG, HEIC)')
      return
    }
    if (selectedFile.size > maxSize) {
      setError('File must be under 20MB')
      return
    }

    setError(null)
    setFile(selectedFile)
    setAnalysisResult(null)
  }

  const handleAnalyze = async () => {
    if (!file) return
    setIsAnalyzing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('document', file)

      const response = await fetch('/api/analyze-notice', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Analysis failed. Please try again.')
      }

      const result = await response.json()
      setAnalysisResult(result)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const resetUpload = () => {
    setFile(null)
    setAnalysisResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const urgencyColors = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200',
  }

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="border-2 border-dashed border-gray-200 hover:border-red-300 transition-colors duration-300 overflow-hidden bg-white/80 backdrop-blur-sm shadow-xl">
        <CardContent className="p-0">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-800 to-red-900 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-lg p-2">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Upload Your Notice</h3>
                  <p className="text-red-100 text-sm">Get instant AI analysis — free, no account needed</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-red-100 text-xs">
                <Shield className="h-3.5 w-3.5" />
                <span>Secure & Confidential</span>
              </div>
            </div>
          </div>

          {/* Urgency Banner */}
          <div className="bg-amber-50 border-b border-amber-100 px-6 py-2.5 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Tennessee law:</span> You may have as few as <span className="font-bold">14 days</span> to respond. Don't wait.
            </p>
          </div>

          {/* Upload Area */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {!file && !analysisResult && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                      relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300
                      ${isDragging
                        ? 'border-red-400 bg-red-50 scale-[1.02]'
                        : 'border-gray-200 hover:border-red-300 hover:bg-red-50/30'
                      }
                    `}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.heic,.heif"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <motion.div
                      animate={isDragging ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragging ? 'text-red-600' : 'text-gray-400'}`} />
                    </motion.div>
                    <p className="text-lg font-semibold text-gray-700 mb-1">
                      {isDragging ? 'Drop your document here' : 'Drag & drop your notice here'}
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      or click to browse — PDF, JPG, PNG accepted
                    </p>
                    <p className="text-xs text-gray-400">
                      Take a photo with your phone or upload the PDF you received
                    </p>
                  </div>
                </motion.div>
              )}

              {file && !analysisResult && (
                <motion.div
                  key="file-selected"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* File preview */}
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-100 rounded-lg p-2">
                        <FileText className="h-5 w-5 text-red-700" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm truncate max-w-[200px] sm:max-w-none">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={resetUpload}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Analyze button */}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="w-full bg-red-800 hover:bg-red-900 text-white py-6 text-lg font-semibold shadow-lg shadow-red-800/20"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Analyzing your document...
                        </>
                      ) : (
                        <>
                          <Shield className="h-5 w-5 mr-2" />
                          Analyze My Notice — Free
                        </>
                      )}
                    </Button>
                  </motion.div>

                  {isAnalyzing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center"
                    >
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <div className="flex gap-1">
                          <motion.div className="w-2 h-2 bg-red-400 rounded-full" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                          <motion.div className="w-2 h-2 bg-red-400 rounded-full" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }} />
                          <motion.div className="w-2 h-2 bg-red-400 rounded-full" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }} />
                        </div>
                        <span>Reading and analyzing your document with AI</span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {analysisResult && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-4"
                >
                  {/* Result header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-gray-900">Analysis Complete</span>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${urgencyColors[analysisResult.urgencyLevel]}`}>
                      {analysisResult.urgencyLevel.toUpperCase()} URGENCY
                    </span>
                  </div>

                  {/* Document type & deadline */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Document Type</p>
                      <p className="text-lg font-bold text-gray-900">{analysisResult.documentType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Response Deadline</p>
                      <p className="text-lg font-bold text-red-800">{analysisResult.deadline}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Summary</p>
                      <p className="text-sm text-gray-700">{analysisResult.summary}</p>
                    </div>
                  </div>

                  {/* Your Rights */}
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">Your Rights</p>
                    <ul className="space-y-1.5">
                      {analysisResult.rights.map((right, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <Shield className="h-4 w-4 text-red-700 mt-0.5 shrink-0" />
                          <span>{right}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommended Actions */}
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">Recommended Next Steps</p>
                    <ul className="space-y-1.5">
                      {analysisResult.recommendedActions.map((action, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="bg-red-800 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                      <Button
                        className="w-full bg-red-800 hover:bg-red-900 text-white py-5 font-semibold"
                        onClick={() => window.location.href = '/intake'}
                      >
                        Start Full Case — Free
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant="outline"
                        className="w-full border-gray-300 text-gray-700 py-5"
                        onClick={resetUpload}
                      >
                        Upload Another
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </div>

          {/* Trust footer */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-green-600" />
                256-bit encrypted
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                No account required
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-green-600" />
                Results in seconds
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
