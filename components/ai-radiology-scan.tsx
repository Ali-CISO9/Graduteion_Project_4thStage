"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Upload, FileImage, X, Loader2, CheckCircle2, Plus, Minus, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from 'sonner'
import { useAnalysis } from "@/lib/analysis-context"

interface AnalysisResult {
  scanType: string
  findings: Array<{
    region: string
    condition: string
    confidence: number
    description: string
  }>
  overallAssessment: string
  recommendations: string[]
}

export function AiRadiologyScan() {
  const { setResult, setInput, result } = useAnalysis()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [manualValues, setManualValues] = useState<Record<string, string>>({
    // Basic liver function tests (currently used)
    ALT: '',
    AST: '',
    Bilirubin: '',
    GGT: '',
    // Additional features for enhanced ML accuracy
    Age: '',
    Gender: '',
    AlkPhos: '', // Alkaline Phosphatase
    TP: '',      // Total Protein
    ALB: '',     // Albumin
  })

  const [editingField, setEditingField] = useState<string | null>(null)
  const [fieldNames, setFieldNames] = useState<Record<string, string>>({
    ALT: 'ALT',
    AST: 'AST',
    Bilirubin: 'Bilirubin',
    GGT: 'GGT',
    Age: 'Age',
    Gender: 'Gender',
    AlkPhos: 'Alkaline Phosphatase',
    TP: 'Total Protein',
    ALB: 'Albumin',
  })

  // Reset component state when analysis result is cleared
  useEffect(() => {
    if (result === null) {
      setSelectedFile(null)
      setPreviewUrl(null)
      setAnalysisResult(null)
      setManualValues({
        ALT: '',
        AST: '',
        Bilirubin: '',
        GGT: '',
        Age: '',
        Gender: '',
        AlkPhos: '',
        TP: '',
        ALB: '',
      })
    }
  }, [result])

  // Field metadata for better UX
  const fieldMetadata: Record<string, { unit: string; range: string; description: string }> = {
    ALT: { unit: 'IU/L', range: '7-56', description: 'Alanine Aminotransferase' },
    AST: { unit: 'IU/L', range: '10-40', description: 'Aspartate Aminotransferase' },
    Bilirubin: { unit: 'mg/dL', range: '0.3-1.2', description: 'Total Bilirubin' },
    GGT: { unit: 'IU/L', range: '9-48', description: 'Gamma-Glutamyl Transferase' },
    Age: { unit: 'years', range: '1-120', description: 'Patient Age' },
    Gender: { unit: '', range: '', description: 'Patient Gender' },
    AlkPhos: { unit: 'IU/L', range: '44-147', description: 'Alkaline Phosphatase' },
    TP: { unit: 'g/dL', range: '6.0-8.5', description: 'Total Protein' },
    ALB: { unit: 'g/dL', range: '3.5-5.0', description: 'Albumin' },
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'application/dicom']
      if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.dcm')) {
        toast.error("Invalid File Type", {
          description: "Please upload a valid image file (PNG, JPG) or PDF.",
        })
        return
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        toast.error("File Too Large", {
          description: "Please upload a file smaller than 10MB.",
        })
        return
      }

      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setAnalysisResult(null) // Reset previous results
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("No File Selected", {
        description: "Please select a file to analyze.",
      })
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("image", selectedFile)

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Analysis failed")
      }

      const result = await response.json()

      if (result.success) {
        setAnalysisResult(result.analysis)
        setResult({
          diagnosis: result.analysis.overallAssessment,
          confidence: Math.round(result.analysis.findings[0]?.confidence * 100 || 0),
          advice: result.analysis.recommendations?.[0] || "Follow up with healthcare provider"
        })
        toast.success("Analysis Complete", {
          description: "Image has been analyzed successfully.",
        })
      } else {
        throw new Error(result.error || "Analysis failed")
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Upload Failed", {
        description: error instanceof Error ? error.message : "Failed to analyze image. Please try again.",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleManualSubmit = async () => {
    // Validate that at least one value is entered and is valid
    const validValues = Object.entries(manualValues).filter(([key, value]) => {
      const trimmed = value.trim()
      return trimmed !== '' && !isNaN(Number(trimmed)) && Number(trimmed) >= 0
    })

    if (validValues.length === 0) {
      toast.error("Invalid Values", {
        description: "Please enter at least one valid lab value (positive numbers only).",
      })
      return
    }

    // Check for reasonable value ranges (basic validation)
    const invalidValues = validValues.filter(([key, value]) => {
      const num = Number(value)
      // Basic sanity checks for common lab values
      if (key.includes('ALT') || key.includes('AST') || key.includes('GGT')) {
        return num > 1000 // Unreasonably high
      }
      if (key.includes('Bilirubin')) {
        return num > 50 // Unreasonably high
      }
      return false
    })

    if (invalidValues.length > 0) {
      toast.error("Unrealistic Values", {
        description: "Some values appear unrealistic. Please double-check your entries.",
      })
      return
    }

    setIsUploading(true)

    try {
      const cleanValues = Object.fromEntries(
        validValues.map(([key, value]) => [key, Number(value).toString()])
      )

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanValues),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Analysis failed")
      }

      const result = await response.json()

      if (result.success) {
        setAnalysisResult(result.analysis)
        // Store both result and input data in context
        setResult({
          diagnosis: result.analysis.diagnosis,
          confidence: result.analysis.confidence,
          advice: result.analysis.advice
        })
        setInput(cleanValues as any) // Store the input values for the report
        toast.success("Analysis Complete", {
          description: "Lab values have been analyzed successfully.",
        })
      } else {
        throw new Error(result.error || "Analysis failed")
      }
    } catch (error) {
      console.error("Analysis error:", error)
      toast.error("Analysis Failed", {
        description: error instanceof Error ? error.message : "Failed to analyze lab values. Please try again.",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
    setAnalysisResult(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  const handleManualValueChange = (key: string, value: string) => {
    // Special handling for gender (not numeric)
    if (key === 'Gender') {
      setManualValues(prev => ({ ...prev, [key]: value }))
      return
    }

    // Allow empty values and decimal points for better UX
    if (value === '' || value === '.' || value === '0.') {
      setManualValues(prev => ({ ...prev, [key]: value }))
      return
    }

    // Validate numeric input with decimal support
    const numericRegex = /^-?\d*\.?\d*$/
    if (!numericRegex.test(value)) {
      return // Don't update if not a valid number format
    }

    // Prevent multiple decimal points
    const decimalCount = (value.match(/\./g) || []).length
    if (decimalCount > 1) {
      return
    }

    // Limit decimal places to 2
    const parts = value.split('.')
    if (parts[1] && parts[1].length > 2) {
      return
    }

    setManualValues(prev => ({ ...prev, [key]: value }))
  }

  const handleFieldNameChange = (key: string, newName: string) => {
    setFieldNames(prev => ({ ...prev, [key]: newName }))
  }

  const startEditingField = (key: string) => {
    setEditingField(key)
  }

  const stopEditingField = () => {
    setEditingField(null)
  }

  const handleKeyDown = (event: React.KeyboardEvent, action?: () => void) => {
    if (event.key === 'Enter' && action) {
      event.preventDefault()
      action()
    }
  }

  const addLabValue = () => {
    const newKey = `Lab${Object.keys(manualValues).length + 1}`
    setManualValues(prev => ({ ...prev, [newKey]: '' }))
  }

  const removeLabValue = (key: string) => {
    setManualValues(prev => {
      const newValues = { ...prev }
      delete newValues[key]
      return newValues
    })
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950 p-4 md:p-6 lg:p-8 shadow-xl border border-white/20 backdrop-blur-xl animate-in fade-in-0 duration-500 hover:shadow-2xl transition-all duration-500 min-h-[500px] md:min-h-[600px]">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-pink-400/10 animate-pulse"></div>
      <div className="absolute -top-10 -right-10 w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-2xl animate-float"></div>
      <div className="absolute -bottom-10 -left-10 w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }}></div>

      <div className="relative z-10 h-full">
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-lg animate-glow mb-4">
            <FileImage className="h-8 w-8 md:h-10 md:w-10 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            AI Medical Analysis
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg">Upload lab reports or enter values for AI analysis</p>
        </div>
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2" role="tablist">
            <TabsTrigger value="upload" aria-controls="upload-panel">Upload Image</TabsTrigger>
            <TabsTrigger value="manual" aria-controls="manual-panel">Manual Input</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4 md:space-y-6" id="upload-panel" role="tabpanel" aria-labelledby="upload-tab">
            {!previewUrl ? (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 gradient-bg p-8 md:p-12 lg:p-16 transition-all duration-300 hover:border-primary/50 hover:scale-105 animate-in zoom-in-95 duration-300 hover-lift focus-within:ring-2 focus-within:ring-primary/50 focus-within:ring-offset-2">
                <div className="flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-2xl gradient-primary mb-4 md:mb-6 animate-glow">
                  <Upload className="h-6 w-6 md:h-8 md:w-8 text-primary-foreground" />
                </div>
                <p className="mb-2 md:mb-3 text-base md:text-lg font-semibold gradient-text">Click to upload or drag and drop</p>
                <p className="text-xs md:text-sm text-muted-foreground">Lab reports (PNG, JPG, PDF)</p>
                <input type="file" className="hidden" accept="image/*,.pdf,.dcm" onChange={handleFileSelect} aria-label="Upload lab report image" />
              </label>
            ) : (
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-2xl gradient-card animate-in slide-in-from-left-4 duration-500 hover-lift">
                <img
                  src={previewUrl || "/placeholder.svg"}
                  alt="Lab report preview"
                  className="h-48 md:h-64 w-full object-contain bg-background/50"
                />
                <Button variant="destructive" size="icon" className="absolute right-2 top-2 md:right-3 md:top-3 rounded-xl gradient-primary hover-lift" onClick={clearFile} aria-label="Remove image">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl gradient-card p-3 md:p-4 animate-in slide-in-from-right-4 duration-500 delay-200 hover-lift gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                    <FileImage className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-semibold truncate max-w-[200px]">{selectedFile?.name}</span>
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {selectedFile && (selectedFile.size / 1024).toFixed(2)} KB
                </span>
              </div>

              {analysisResult && (
                <div className="space-y-4 rounded-2xl gradient-card p-4 md:p-6 animate-in slide-in-from-bottom-4 duration-500 delay-400 hover-lift">
                  <div className="flex items-center gap-3 text-primary">
                    <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-xl gradient-primary animate-glow">
                      <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
                    </div>
                    <h4 className="text-lg md:text-xl font-bold gradient-text">Analysis Results</h4>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Scan Type:</span> {analysisResult.scanType}
                    </p>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Findings:</p>
                      {analysisResult.findings.map((finding, idx) => (
                        <div key={idx} className="rounded bg-background p-2 text-sm animate-in fade-in-0 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                          <p className="font-medium">
                            {finding.region}: {finding.condition}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Confidence: {(finding.confidence * 100).toFixed(0)}%
                          </p>
                          <p className="text-xs">{finding.description}</p>
                        </div>
                      ))}
                    </div>

                    <div>
                      <p className="text-sm font-medium">Assessment:</p>
                      <p className="text-sm text-muted-foreground">{analysisResult.overallAssessment}</p>
                    </div>
                  </div>
                </div>
              )}

              <Button onClick={handleUpload} disabled={isUploading || !!analysisResult} className="w-full rounded-xl gradient-primary hover-lift animate-in fade-in-0 duration-500 delay-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200" aria-label={isUploading ? "Analyzing image" : analysisResult ? "Analysis completed" : "Analyze uploaded image"} onKeyDown={(e) => handleKeyDown(e, handleUpload)}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    <span className="animate-pulse">Analyzing image...</span>
                  </>
                ) : analysisResult ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
                    Analysis Complete
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
                    Analyze Image
                  </>
                )}
              </Button>
            </div>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4 md:space-y-6" id="manual-panel" role="tabpanel" aria-labelledby="manual-tab">
            <Card className="gradient-card">
              <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-lg md:text-xl">Enhanced Lab Analysis</span>
                  <div className="flex gap-2">
                    <Button onClick={addLabValue} size="sm" variant="outline" className="self-start sm:self-auto">
                      <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                      Add Test
                    </Button>
                  </div>
                </CardTitle>
                <p className="text-sm text-muted-foreground">Enter patient information and lab values for AI-powered analysis</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(manualValues).map(([key, value]) => {
                  const metadata = fieldMetadata[key]
                  const displayName = fieldNames[key] || key

                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center gap-2">
                        {editingField === key ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={displayName}
                              onChange={(e) => handleFieldNameChange(key, e.target.value)}
                              onBlur={stopEditingField}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  stopEditingField()
                                }
                              }}
                              className="text-sm font-medium"
                              autoFocus
                            />
                            <Button size="sm" variant="ghost" onClick={stopEditingField}>
                              ✓
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Label className="text-sm font-medium cursor-pointer hover:text-primary" onClick={() => startEditingField(key)}>
                              {displayName}
                              <Edit2 className="h-3 w-3 ml-1 inline opacity-50" />
                            </Label>
                            {metadata && (
                              <span className="text-xs text-muted-foreground">
                                ({metadata.unit}) - Normal: {metadata.range}
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {key === 'Gender' ? (
                          <Select value={value} onValueChange={(newValue) => handleManualValueChange(key, newValue)}>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type="text"
                            inputMode={key === 'Age' ? 'numeric' : 'decimal'}
                            value={value}
                            onChange={(e) => handleManualValueChange(key, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e)}
                            placeholder={key === 'Age' ? 'Enter age' : '0.00'}
                            className="flex-1"
                            aria-describedby={`${key}-help`}
                            maxLength={10}
                          />
                        )}

                        {Object.keys(manualValues).length > 4 && (
                          <Button
                            onClick={() => removeLabValue(key)}
                            size="sm"
                            variant="destructive"
                            aria-label={`Remove ${displayName} field`}
                          >
                            <Minus className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        )}
                      </div>

                      {metadata && (
                        <p className="text-xs text-muted-foreground">{metadata.description}</p>
                      )}
                      <div id={`${key}-help`} className="sr-only">
                        Enter {key === 'Gender' ? 'gender' : 'numerical value'} for {displayName} test
                      </div>
                    </div>
                  )
                })}

                <div className="pt-4 border-t">
                  <Button
                    onClick={handleManualSubmit}
                    disabled={isUploading || Object.values(manualValues).every(v => v === '')}
                    className="w-full rounded-xl gradient-primary hover-lift disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    aria-label={isUploading ? "Analyzing lab values" : "Analyze entered lab values"}
                    onKeyDown={(e) => handleKeyDown(e, handleManualSubmit)}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        <span className="animate-pulse">Analyzing with AI...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
                        Analyze with Advanced AI
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Using 9 medical features for enhanced ML accuracy
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
