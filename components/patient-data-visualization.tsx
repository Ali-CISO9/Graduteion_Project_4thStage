"use client"

import React, { useEffect, useState } from "react"
import { BarChart3, TrendingUp, TrendingDown, Loader2, Download } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { toast } from 'sonner'
import { useLanguage } from "@/lib/language-context"

interface LabTest {
  testName: string
  value: number
  unit: string
  normalRange: string
  status: "normal" | "warning" | "critical"
  date: string
}

function PatientDataVisualization() {
  const [labTests, setLabTests] = useState<LabTest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [patientName, setPatientName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const { t } = useLanguage()

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const response = await fetch("/api/patient-data")
        if (!response.ok) {
          throw new Error("Failed to fetch patient data")
        }
        const data = await response.json()
        setLabTests(data.labTests)
        setPatientName(data.patient.name)
        setError(null)
        if (!isLoading) {
          toast.success("Patient data updated", {
            description: "Latest lab test results have been refreshed.",
          })
        }
      } catch (error) {
        console.error("Error fetching patient data:", error)
        setError("Failed to load patient data. Please check your connection and try again.")
        if (!isLoading) {
          toast.error("Failed to update patient data", {
            description: "Please check your connection.",
          })
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchPatientData()

    // Poll every 30 seconds for real-time updates
    const interval = setInterval(fetchPatientData, 30000)

    return () => clearInterval(interval)
  }, [isLoading])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "normal":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            {t('normal')}
          </Badge>
        )
      case "warning":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            {t('warning')}
          </Badge>
        )
      case "critical":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            {t('critical')}
          </Badge>
        )
      default:
        return null
    }
  }

  const getTrendIcon = (value: number, normalRange: string) => {
    const [min, max] = normalRange.replace(/[<>]/g, "").split("-").map(Number)
    if (value > max) return <TrendingUp className="h-3 w-3 text-red-600" />
    if (value < min) return <TrendingDown className="h-3 w-3 text-yellow-600" />
    return <div className="h-3 w-3 rounded-full bg-green-600" />
  }

  if (isLoading) {
    return (
      <Card className="h-[500px] shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Patient Lab Tests
          </CardTitle>
          <CardDescription>Latest liver function test results</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="h-[500px] shadow-sm animate-in fade-in-0 duration-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            {t('patientLabTests')}
          </CardTitle>
          <CardDescription>{t('latestResults')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              {t('retry')}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = labTests.map(test => ({
    name: test.testName,
    value: test.value,
    normalRange: test.normalRange,
    status: test.status
  }))

  const exportToCSV = () => {
    const headers = ["Test Name", "Value", "Unit", "Normal Range", "Status", "Date"]
    const csvContent = [
      headers.join(","),
      ...labTests.map(test => [
        test.testName,
        test.value,
        test.unit,
        `"${test.normalRange}"`,
        test.status,
        test.date
      ].join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `lab-tests-${patientName || 'patient'}-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Export Complete", {
      description: "Lab test data has been exported to CSV.",
    })
  }

  return (
    <Card className="h-[700px] gradient-card shadow-lg animate-in fade-in-0 duration-500 hover-lift">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary animate-glow">
                <BarChart3 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="gradient-text text-xl">Patient Lab Tests</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground/80">
              {patientName ? `${patientName}'s latest test results` : "Latest liver function test results"}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportToCSV} className="rounded-xl gradient-primary hover-lift animate-in fade-in-0 duration-500 delay-1000">
            <Download className="h-4 w-4 mr-2" />
            {t('exportCSV')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [value, 'Value']}
                labelFormatter={(label) => `Test: ${label}`}
              />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          {labTests.map((test, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-xl gradient-card p-4 transition-all duration-300 hover-lift animate-in slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-3">
                {getTrendIcon(test.value, test.normalRange)}
                <div>
                  <p className="font-medium text-foreground">{test.testName}</p>
                  <p className="text-xs text-muted-foreground">
                    Range: {test.normalRange} {test.unit}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    {test.value} <span className="text-xs font-normal text-muted-foreground">{test.unit}</span>
                  </p>
                </div>
                {getStatusBadge(test.status)}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl gradient-card p-5 animate-in fade-in-0 duration-500 delay-500 hover-lift">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold gradient-text">{t('note')}:</span> {t('apiNote')}{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default React.memo(PatientDataVisualization)
