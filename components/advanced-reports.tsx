"use client"

import React, { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  FileText,
  Download,
  Filter,
  Calendar as CalendarIcon,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Activity,
  Search,
  Printer,
  Stethoscope,
  AlertCircle,
  CheckCircle2,
  Edit,
  Trash2,
  Eye
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Cell, Area, AreaChart, Pie } from 'recharts'
import { toast } from 'sonner'

// Sample data for reports
const patientReportsData = [
  { month: 'Jan', patients: 120, appointments: 95, analyses: 45 },
  { month: 'Feb', patients: 150, appointments: 110, analyses: 52 },
  { month: 'Mar', patients: 180, appointments: 135, analyses: 68 },
  { month: 'Apr', patients: 200, appointments: 150, analyses: 75 },
  { month: 'May', patients: 220, appointments: 165, analyses: 82 },
  { month: 'Jun', patients: 250, appointments: 185, analyses: 95 },
]

const departmentData = [
  { name: 'Cardiology', patients: 85, percentage: 34 },
  { name: 'Neurology', patients: 63, percentage: 25 },
  { name: 'Orthopedics', patients: 50, percentage: 20 },
  { name: 'Radiology', patients: 38, percentage: 15 },
  { name: 'Emergency', patients: 14, percentage: 6 },
]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

interface AdvancedReportsProps {
  className?: string
}

interface PatientAnalysis {
  id: number
  patient_id: number
  diagnosis: string
  confidence: number
  advice: string
  created_at: string
  updated_at?: string
  patient_name?: string
  patient_id_display?: string
  birth_date?: string
  email?: string
  phone?: string
  profile_picture?: string
  doctor_name?: string
  department?: string
}

export function AdvancedReports({ className }: AdvancedReportsProps) {
   const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
     from: new Date(2024, 0, 1),
     to: new Date(),
   })

   const handleDateRangeChange = (range: any) => {
     setDateRange(range || { from: undefined, to: undefined })
   }
   const [reportType, setReportType] = useState("overview")
   const [department, setDepartment] = useState("all")
   const [searchTerm, setSearchTerm] = useState("")
   const [patientAnalyses, setPatientAnalyses] = useState<PatientAnalysis[]>([])
   const [filteredAnalyses, setFilteredAnalyses] = useState<PatientAnalysis[]>([])
   const [isLoadingAnalyses, setIsLoadingAnalyses] = useState(false)
   const [editingAnalysis, setEditingAnalysis] = useState<PatientAnalysis | null>(null)
   const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
   const [selectedAnalysisForReport, setSelectedAnalysisForReport] = useState<PatientAnalysis | null>(null)
   const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)

   // Overview tab state
   const [overviewMetrics, setOverviewMetrics] = useState({
     totalPatients: 0,
     totalAnalyses: 0,
     reportsGenerated: 0,
     successRate: 0,
     avgResponseTime: 0,
     systemUptime: 0
   })
   const [alerts, setAlerts] = useState<Array<{
     id: string
     type: 'critical' | 'warning' | 'info'
     message: string
     timestamp: Date
   }>>([])
   const [recentActivities, setRecentActivities] = useState<Array<{
     id: string
     type: string
     description: string
     timestamp: Date
   }>>([])
   const [isLoadingOverview, setIsLoadingOverview] = useState(false)

   // Calculator state
   const [bmiInputs, setBmiInputs] = useState({ weight: '', height: '' })
   const [bmiResult, setBmiResult] = useState({ bmi: null as string | null, category: '' })

   const [gfrInputs, setGfrInputs] = useState({
     creatinine: '',
     age: '',
     gender: '',
     race: ''
   })
   const [gfrResult, setGfrResult] = useState({ egfr: null as string | null, stage: '' })

   const [fluidInputs, setFluidInputs] = useState({ weight: '', type: 'maintenance' })
   const [fluidResult, setFluidResult] = useState({ daily: null as string | null, hourly: null as string | null })

   const [doseInputs, setDoseInputs] = useState({
     desiredDose: '',
     concentration: '',
     volume: ''
   })
   const [doseResult, setDoseResult] = useState({ totalDose: null as string | null, concentration: null as string | null })

   // Unit converter state
   const [converterInputs, setConverterInputs] = useState({
     value: '',
     fromUnit: '',
     toUnit: ''
   })
   const [converterResult, setConverterResult] = useState(null as string | null)

   // Medical references state
   const [selectedReference, setSelectedReference] = useState<string | null>(null)
   const [isReferenceModalOpen, setIsReferenceModalOpen] = useState(false)

   // AI Analysis tab state
   const [aiInsights, setAiInsights] = useState({
     predictiveRisks: [] as Array<{ patient: string; riskLevel: 'low' | 'medium' | 'high'; probability: number; factors: string[] }>,
     anomalyDetections: [] as Array<{ type: string; severity: 'low' | 'medium' | 'high'; description: string; timestamp: Date }>,
     treatmentEfficacy: [] as Array<{ treatment: string; successRate: number; patientCount: number; avgImprovement: number }>
   })
   const [aiFilters, setAiFilters] = useState({
     demographic: 'all',
     timeRange: '30d',
     modelType: 'all',
     riskLevel: 'all'
   })
   const [selectedInsight, setSelectedInsight] = useState<any>(null)
   const [isInsightModalOpen, setIsInsightModalOpen] = useState(false)
   const [aiSummary, setAiSummary] = useState({
     totalPredictions: 0,
     highRiskAlerts: 0,
     anomalyCount: 0,
     avgConfidence: 0
   })

   // Cases Monitoring state
   const [pendingTasks, setPendingTasks] = useState<Array<{
     id: string
     title: string
     description: string
     priority: 'high' | 'medium' | 'low'
     dueDate: Date
     patientId?: string
     patientName?: string
     completed: boolean
     createdAt: Date
   }>>([])
   const [upcomingAppointments, setUpcomingAppointments] = useState<Array<{
     id: string
     patientName: string
     patientId: string
     dateTime: Date
     type: string
     duration: number
     location?: string
     notes?: string
     status: 'scheduled' | 'confirmed' | 'cancelled'
   }>>([])
   const [activeCases, setActiveCases] = useState<Array<{
     id: string
     patientName: string
     patientId: string
     diagnosis: string
     status: 'active' | 'critical' | 'recovery' | 'pending_review' | 'finished'
     lastUpdate: Date
     treatmentProgress: number
     nextAppointment?: Date
     assignedDoctor: string
     alerts: string[]
     profilePicture?: string
     doctor_name?: string
     department?: string
     notes?: string
   }>>([])
   const [casesFilter, setCasesFilter] = useState('all')
   const [newTask, setNewTask] = useState({
     title: '',
     description: '',
     priority: 'medium' as 'high' | 'medium' | 'low',
     dueDate: '',
     patientId: '',
     patientName: ''
   })
   const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
   const [editingTask, setEditingTask] = useState<any>(null)
   const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false)

   // Active Cases state
   const [selectedCase, setSelectedCase] = useState<any>(null)
   const [isCaseDetailsDialogOpen, setIsCaseDetailsDialogOpen] = useState(false)
   const [isUpdateProgressDialogOpen, setIsUpdateProgressDialogOpen] = useState(false)
   const [progressUpdate, setProgressUpdate] = useState({
     caseId: '',
     progress: 0,
     status: 'active' as 'active' | 'critical' | 'recovery' | 'pending_review' | 'finished',
     doctor: '',
     department: '',
     notes: ''
   })

   // Appointments state
   const [patients, setPatients] = useState<Array<{
     id: number
     name: string
     patient_id: string
     birth_date?: string
     email?: string
     phone?: string
     profile_picture?: string
     department?: string
     doctor_name?: string
   }>>([])
   const [appointmentSearchTerm, setAppointmentSearchTerm] = useState("")
   const [filteredAppointments, setFilteredAppointments] = useState(upcomingAppointments)
   const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false)
   const [newAppointment, setNewAppointment] = useState({
     patientId: "",
     patientName: "",
     dateTime: "",
     type: "",
     duration: 30,
     location: "",
     notes: ""
   })
   const [isLoadingPatients, setIsLoadingPatients] = useState(false)

   // Reschedule dialog state
   const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false)
   const [rescheduleAppointmentData, setRescheduleAppointmentData] = useState<{
     id: string
     patientName: string
     patientId: string
     dateTime: string
     type: string
     duration: number
     location: string
     notes: string
     status: 'scheduled' | 'confirmed' | 'cancelled'
   } | null>(null)

   const [editForm, setEditForm] = useState({
     name: '',
     patientId: '',
     birthDate: '',
     email: '',
     phone: '',
     profilePicture: null as File | null,
     profilePictureUrl: '',
     analysisDate: new Date().toISOString().split('T')[0],
     analysisTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
     diagnosis: '',
     confidence: 0,
     advice: ''
   })

  // Function to expand medical abbreviations
  const expandDiagnosis = (diagnosis: string) => {
    if (diagnosis.toUpperCase() === 'NAFLD') {
      return 'NAFLD (Non-Alcoholic Fatty Liver Disease)'
    }
    return diagnosis
  }
  const reportRef = useRef<HTMLDivElement>(null)

  // Fetch patient analyses from backend
  useEffect(() => {
    const fetchPatientAnalyses = async () => {
      setIsLoadingAnalyses(true)
      try {
        const response = await fetch('/api/patient-analyses')
        if (response.ok) {
          const data = await response.json()
          setPatientAnalyses(data.analyses || [])
          setFilteredAnalyses(data.analyses || [])
        } else {
          console.error('Failed to fetch patient analyses')
        }
      } catch (error) {
        console.error('Error fetching patient analyses:', error)
      } finally {
        setIsLoadingAnalyses(false)
      }
    }

    fetchPatientAnalyses()
  }, [])

  // Fetch overview metrics
  useEffect(() => {
    const fetchOverviewMetrics = async () => {
      setIsLoadingOverview(true)
      try {
        // Fetch patient analyses for metrics
        const analysesResponse = await fetch('/api/patient-analyses')
        const analysesData = analysesResponse.ok ? await analysesResponse.json() : { analyses: [] }

        // Calculate metrics
        const analyses = analysesData.analyses || []
        const totalAnalyses = analyses.length
        const highConfidenceAnalyses = analyses.filter((a: PatientAnalysis) => a.confidence >= 80).length
        const successRate = totalAnalyses > 0 ? Math.round((highConfidenceAnalyses / totalAnalyses) * 100) : 0

        // Mock additional metrics (in real implementation, these would come from backend)
        const totalPatients = new Set(analyses.map((a: PatientAnalysis) => a.patient_id)).size || 0
        const reportsGenerated = totalAnalyses // Assuming each analysis generates a report
        const avgResponseTime = 2.3 // Mock value
        const systemUptime = 99.8 // Mock value

        setOverviewMetrics({
          totalPatients,
          totalAnalyses,
          reportsGenerated,
          successRate,
          avgResponseTime,
          systemUptime
        })

        // Generate alerts based on data
        const newAlerts = []
        if (successRate < 80) {
          newAlerts.push({
            id: '1',
            type: 'warning' as const,
            message: 'AI accuracy rate below 80%. Review recent analyses.',
            timestamp: new Date()
          })
        }
        if (totalAnalyses === 0) {
          newAlerts.push({
            id: '2',
            type: 'info' as const,
            message: 'No analyses found. Start by running some AI analyses.',
            timestamp: new Date()
          })
        }

        setAlerts(newAlerts)

        // Generate recent activities
        const activities = analyses.slice(0, 5).map((analysis: PatientAnalysis, index: number) => ({
          id: `activity-${analysis.id}`,
          type: 'analysis',
          description: `AI analysis completed for ${analysis.patient_name || 'Patient'}`,
          timestamp: new Date(analysis.created_at || Date.now())
        }))

        setRecentActivities(activities)

      } catch (error) {
        console.error('Error fetching overview metrics:', error)
      } finally {
        setIsLoadingOverview(false)
      }
    }

    fetchOverviewMetrics()
  }, [patientAnalyses])

  // Generate AI insights
  useEffect(() => {
    const generateAiInsights = () => {
      // Generate predictive risks based on analysis data
      const predictiveRisks = patientAnalyses
        .filter((analysis: PatientAnalysis) => analysis.confidence < 70)
        .map((analysis: PatientAnalysis) => ({
          patient: analysis.patient_name || 'Unknown',
          riskLevel: (analysis.confidence < 50 ? 'high' : analysis.confidence < 60 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
          probability: Math.round((100 - analysis.confidence) * 0.8),
          factors: ['Elevated liver enzymes', 'Abnormal bilirubin levels', 'GGT elevation']
        }))

      // Generate anomaly detections
      const anomalyDetections = [
        {
          type: 'Biochemical Anomaly',
          severity: 'high' as const,
          description: 'Unusual ALT/AST ratio detected in multiple patients',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          type: 'Trend Anomaly',
          severity: 'medium' as const,
          description: 'Sudden spike in bilirubin levels across age group 45-60',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
        }
      ]

      // Generate treatment efficacy data
      const treatmentEfficacy = [
        { treatment: 'Liver Support Therapy', successRate: 87, patientCount: 45, avgImprovement: 32 },
        { treatment: 'Antioxidant Therapy', successRate: 92, patientCount: 38, avgImprovement: 28 },
        { treatment: 'Dietary Intervention', successRate: 78, patientCount: 52, avgImprovement: 24 },
        { treatment: 'Medication Adjustment', successRate: 95, patientCount: 29, avgImprovement: 41 }
      ]

      setAiInsights({
        predictiveRisks,
        anomalyDetections,
        treatmentEfficacy
      })

      // Calculate AI summary
      const totalPredictions = patientAnalyses.length
      const highRiskAlerts = predictiveRisks.filter(r => r.riskLevel === 'high').length
      const anomalyCount = anomalyDetections.length
      const avgConfidence = patientAnalyses.length > 0
        ? Math.round(patientAnalyses.reduce((sum: number, a: PatientAnalysis) => sum + a.confidence, 0) / patientAnalyses.length)
        : 0

      setAiSummary({
        totalPredictions,
        highRiskAlerts,
        anomalyCount,
        avgConfidence
      })
    }

    generateAiInsights()
  }, [patientAnalyses])

  // Fetch patients from backend
  useEffect(() => {
    const fetchPatients = async () => {
      setIsLoadingPatients(true)
      try {
        const response = await fetch('/api/patients')
        if (response.ok) {
          const data = await response.json()
          setPatients(data.patients || [])
        } else {
          console.error('Failed to fetch patients')
        }
      } catch (error) {
        console.error('Error fetching patients:', error)
      } finally {
        setIsLoadingPatients(false)
      }
    }

    fetchPatients()
  }, [])

  // Filter appointments based on search term
  useEffect(() => {
    if (!appointmentSearchTerm.trim()) {
      setFilteredAppointments(upcomingAppointments)
    } else {
      const filtered = upcomingAppointments.filter(appointment => {
        const searchLower = appointmentSearchTerm.toLowerCase()
        const nameMatch = appointment.patientName.toLowerCase().includes(searchLower)
        const idMatch = appointment.patientId.toLowerCase().includes(searchLower)
        const typeMatch = appointment.type.toLowerCase().includes(searchLower)
        return nameMatch || idMatch || typeMatch
      })
      setFilteredAppointments(filtered)
    }
  }, [appointmentSearchTerm, upcomingAppointments])

  // Initialize cases monitoring data from patient analyses with localStorage persistence
  useEffect(() => {
    if (patientAnalyses.length > 0 && patients.length > 0) {
      // Always create fresh cases from current patient analyses to ensure sync
      const casesFromAnalyses = patientAnalyses.map((analysis, index) => {
        const patient = patients.find(p => p.id === analysis.patient_id)
        const diagnosis = expandDiagnosis(analysis.diagnosis)

        // Determine case status based on confidence and diagnosis
        let caseStatus: 'active' | 'critical' | 'recovery' | 'pending_review' = 'active'
        if (analysis.confidence < 50) {
          caseStatus = 'critical'
        } else if (analysis.confidence > 85) {
          caseStatus = 'recovery'
        } else if (analysis.confidence < 70) {
          caseStatus = 'pending_review'
        }

        // Generate alerts based on analysis
        const alerts: string[] = []
        if (analysis.confidence < 70) {
          alerts.push('Low confidence in diagnosis - requires review')
        }
        if (diagnosis.toLowerCase().includes('cancer') || diagnosis.toLowerCase().includes('disease')) {
          alerts.push('High-risk condition - close monitoring required')
        }

        return {
          id: `case-${analysis.id}`,
          patientName: analysis.patient_name || 'Unknown',
          patientId: analysis.patient_id_display || 'Unknown',
          diagnosis: diagnosis,
          status: caseStatus,
          lastUpdate: new Date(analysis.updated_at || analysis.created_at || Date.now()),
          treatmentProgress: Math.min(100, Math.max(0, analysis.confidence + Math.random() * 20 - 10)), // Mock progress
          nextAppointment: new Date(Date.now() + (Math.random() * 7 + 1) * 24 * 60 * 60 * 1000), // 1-8 days from now
          assignedDoctor: patient?.doctor_name || 'Dr. Assigned',
          alerts: alerts,
          profilePicture: patient?.profile_picture,
          department: patient?.department || 'Unknown Department',
          notes: '' // Initialize with empty notes
        }
      })

      // Check if we have saved cases in localStorage and merge with fresh cases
      const savedCases = localStorage.getItem('activeCases')
      let finalCases = casesFromAnalyses

      if (savedCases) {
        try {
          const parsedCases = JSON.parse(savedCases)
          // For each fresh case, check if we have additional data in saved cases (like user modifications)
          finalCases = casesFromAnalyses.map(freshCase => {
            const savedCase = parsedCases.find((sc: any) => sc.id === freshCase.id)
            if (savedCase) {
              // Merge fresh data with saved user modifications (like status changes)
              return {
                ...freshCase,
                status: savedCase.status || freshCase.status,
                treatmentProgress: savedCase.treatmentProgress || freshCase.treatmentProgress,
                assignedDoctor: savedCase.assignedDoctor || freshCase.assignedDoctor,
                alerts: savedCase.alerts || freshCase.alerts,
                lastUpdate: new Date(savedCase.lastUpdate) || freshCase.lastUpdate,
                nextAppointment: savedCase.nextAppointment ? new Date(savedCase.nextAppointment) : freshCase.nextAppointment,
                notes: savedCase.notes || freshCase.notes // Preserve saved notes
              }
            }
            return freshCase
          })
        } catch (error) {
          console.error('Error parsing saved cases:', error)
        }
      }

      setActiveCases(finalCases)
      // Save merged cases to localStorage
      localStorage.setItem('activeCases', JSON.stringify(finalCases))
    }
  }, [patientAnalyses, patients])

   // Initialize pending tasks and appointments with localStorage persistence
   useEffect(() => {
     // Check for saved pending tasks
     const savedTasks = localStorage.getItem('pendingTasks')
     if (savedTasks) {
       try {
         const parsedTasks = JSON.parse(savedTasks)
         const tasksWithDates = parsedTasks.map((task: any) => ({
           ...task,
           dueDate: new Date(task.dueDate),
           createdAt: new Date(task.createdAt)
         }))
         setPendingTasks(tasksWithDates)
       } catch (error) {
         console.error('Error parsing saved tasks:', error)
       }
     } else {
       // Sample pending tasks (only if no saved data)
       const sampleTasks = [
         {
           id: '1',
           title: 'Review lab results for Patient #1234',
           description: 'Check latest blood work and update treatment plan',
           priority: 'high' as const,
           dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
           patientId: 'P-2024-001',
           patientName: 'Ahmed Al-Rashid',
           completed: false,
           createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
         },
         {
           id: '2',
           title: 'Schedule follow-up MRI',
           description: 'Patient needs MRI scan for treatment evaluation',
           priority: 'medium' as const,
           dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
           patientId: 'P-2024-002',
           patientName: 'Fatima Al-Zahra',
           completed: false,
           createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
         },
         {
           id: '3',
           title: 'Update medication dosage',
           description: 'Adjust insulin dosage based on recent glucose readings',
           priority: 'high' as const,
           dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
           patientId: 'P-2024-003',
           patientName: 'Omar Hassan',
           completed: false,
           createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
         }
       ]
       setPendingTasks(sampleTasks)
       localStorage.setItem('pendingTasks', JSON.stringify(sampleTasks))
     }

     // Check for saved appointments
     const savedAppointments = localStorage.getItem('upcomingAppointments')
     if (savedAppointments) {
       try {
         const parsedAppointments = JSON.parse(savedAppointments)
         const appointmentsWithDates = parsedAppointments.map((apt: any) => ({
           ...apt,
           dateTime: new Date(apt.dateTime)
         }))
         setUpcomingAppointments(appointmentsWithDates)
       } catch (error) {
         console.error('Error parsing saved appointments:', error)
       }
     } else {
       // Sample upcoming appointments (only if no saved data)
       const sampleAppointments = [
         {
           id: '1',
           patientName: 'Ahmed Al-Rashid',
           patientId: 'P-2024-001',
           dateTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
           type: 'Cardiology Consultation',
           duration: 30,
           location: 'Room 203',
           notes: 'Post-surgery follow-up',
           status: 'scheduled' as const
         },
         {
           id: '2',
           patientName: 'Fatima Al-Zahra',
           patientId: 'P-2024-002',
           dateTime: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
           type: 'Oncology Treatment',
           duration: 90,
           location: 'Chemo Suite A',
           notes: 'Cycle 3 of chemotherapy',
           status: 'confirmed' as const
         },
         {
           id: '3',
           patientName: 'Omar Hassan',
           patientId: 'P-2024-003',
           dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
           type: 'Endocrinology Review',
           duration: 45,
           location: 'Room 105',
           notes: 'Diabetes management check',
           status: 'scheduled' as const
         }
       ]
       setUpcomingAppointments(sampleAppointments)
       localStorage.setItem('upcomingAppointments', JSON.stringify(sampleAppointments))
     }
   }, [])

   // Save active cases to localStorage whenever they change
   useEffect(() => {
     if (activeCases.length > 0) {
       localStorage.setItem('activeCases', JSON.stringify(activeCases))
     }
   }, [activeCases])

   // Save appointments to localStorage whenever they change
   useEffect(() => {
     if (upcomingAppointments.length > 0) {
       localStorage.setItem('upcomingAppointments', JSON.stringify(upcomingAppointments))
     }
   }, [upcomingAppointments])

  // Task management functions
  const addTask = () => {
    if (!newTask.title.trim()) return

    const task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      dueDate: new Date(newTask.dueDate),
      patientId: newTask.patientId || undefined,
      patientName: newTask.patientName || undefined,
      completed: false,
      createdAt: new Date()
    }

    setPendingTasks(prev => {
      const updatedTasks = [...prev, task]
      // Update localStorage immediately
      localStorage.setItem('pendingTasks', JSON.stringify(updatedTasks))
      return updatedTasks
    })
    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      patientId: '',
      patientName: ''
    })
    setIsTaskDialogOpen(false)
    toast.success('Task added successfully')
  }

  const toggleTaskCompletion = (taskId: string) => {
    setPendingTasks(prev => {
      const updatedTasks = prev.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
      // Update localStorage immediately
      localStorage.setItem('pendingTasks', JSON.stringify(updatedTasks))
      return updatedTasks
    })
  }

  const deleteTask = (taskId: string) => {
    setPendingTasks(prev => {
      const updatedTasks = prev.filter(task => task.id !== taskId)
      // Update localStorage immediately
      localStorage.setItem('pendingTasks', JSON.stringify(updatedTasks))
      return updatedTasks
    })
    toast.success('Task deleted successfully')
  }

  const editTask = (task: any) => {
    setEditingTask(task)
    setNewTask({
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate.toISOString().slice(0, 16), // Format for datetime-local input
      patientId: task.patientId || '',
      patientName: task.patientName || ''
    })
    setIsEditTaskDialogOpen(true)
  }

  const updateTask = () => {
    if (!editingTask || !newTask.title.trim()) return

    const updatedTask = {
      ...editingTask,
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      dueDate: new Date(newTask.dueDate),
      patientId: newTask.patientId || undefined,
      patientName: newTask.patientName || undefined
    }

    // Update state first
    setPendingTasks(prev => {
      const updatedTasks = prev.map(task =>
        task.id === editingTask.id ? updatedTask : task
      )
      // Update localStorage immediately after state update
      localStorage.setItem('pendingTasks', JSON.stringify(updatedTasks))
      return updatedTasks
    })

    setIsEditTaskDialogOpen(false)
    setEditingTask(null)
    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      patientId: '',
      patientName: ''
    })
    toast.success('Task updated successfully')
  }

  // Active Cases management functions
  const viewCaseDetails = (case_: any) => {
    setSelectedCase(case_)
    setIsCaseDetailsDialogOpen(true)
  }

  const updateCaseProgress = (case_: any) => {
    setProgressUpdate({
      caseId: case_.id,
      progress: case_.treatmentProgress,
      status: case_.status,
      doctor: case_.assignedDoctor,
      department: case_.department || '',
      notes: ''
    })
    setIsUpdateProgressDialogOpen(true)
  }

  const deleteCase = (caseId: string) => {
    if (!confirm('Are you sure you want to delete this case? This action cannot be undone.')) {
      return
    }
    setActiveCases(prev => {
      const updatedCases = prev.filter(case_ => case_.id !== caseId);
      localStorage.setItem('activeCases', JSON.stringify(updatedCases));
      return updatedCases;
    });
    toast.success('Case deleted successfully')
  }

  const saveProgressUpdate = async () => {
    const caseToUpdate = activeCases.find(c => c.id === progressUpdate.caseId)
    if (!caseToUpdate) return

    // Update active cases
    setActiveCases(prev => prev.map(case_ => {
      const newStatus = progressUpdate.progress === 100 ? 'finished' : progressUpdate.status;
      return case_.id === progressUpdate.caseId
        ? {
            ...case_,
            treatmentProgress: progressUpdate.progress,
            status: newStatus,
            assignedDoctor: progressUpdate.doctor,
            department: progressUpdate.department,
            notes: progressUpdate.notes, // Will save empty string or the notes text
            lastUpdate: new Date()
          }
        : case_
    }))

    // Update patient department if changed
    if (progressUpdate.department !== caseToUpdate.department) {
      try {
        const patientResponse = await fetch(`/api/patients/${caseToUpdate.patientId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ department: progressUpdate.department }),
        });
        if (patientResponse.ok) {
          // Update patients state
          setPatients(prev => prev.map(p => p.patient_id === caseToUpdate.patientId ? { ...p, department: progressUpdate.department } : p));
        } else {
          console.error('Failed to update patient department');
        }
      } catch (error) {
        console.error('Error updating patient department:', error);
      }
    }

    setIsUpdateProgressDialogOpen(false)
    setProgressUpdate({ caseId: '', progress: 0, status: 'active', doctor: '', department: '', notes: '' })
    toast.success('Case updated successfully')
  }

  // Appointment management functions
  const rescheduleAppointment = (appointmentId: string) => {
    const appointment = upcomingAppointments.find(apt => apt.id === appointmentId)
    if (appointment) {
      setRescheduleAppointmentData({
        id: appointment.id,
        patientName: appointment.patientName,
        patientId: appointment.patientId,
        dateTime: appointment.dateTime.toISOString().slice(0, 16), // Format for datetime-local input
        type: appointment.type,
        duration: appointment.duration,
        location: appointment.location || '',
        notes: appointment.notes || '',
        status: appointment.status
      })
      setIsRescheduleDialogOpen(true)
    }
  }

  const cancelAppointment = (appointmentId: string) => {
    setUpcomingAppointments(prev => {
      const updatedAppointments = prev.filter(apt => apt.id !== appointmentId)
      // Update localStorage immediately
      localStorage.setItem('upcomingAppointments', JSON.stringify(updatedAppointments))
      return updatedAppointments
    })
    toast.success('Appointment cancelled successfully')
  }

  const updateRescheduledAppointment = () => {
    if (!rescheduleAppointmentData) return

    // Check for duplicate appointments (same patient, same date/time, different appointment)
    const isDuplicate = upcomingAppointments.some(apt =>
      apt.id !== rescheduleAppointmentData.id &&
      apt.patientId === rescheduleAppointmentData.patientId &&
      new Date(apt.dateTime).toDateString() === new Date(rescheduleAppointmentData.dateTime).toDateString() &&
      apt.type === rescheduleAppointmentData.type
    )

    if (isDuplicate) {
      toast.error('An appointment with the same patient, date, and type already exists')
      return
    }

    setUpcomingAppointments(prev => prev.map(apt =>
      apt.id === rescheduleAppointmentData.id
        ? {
            ...apt,
            dateTime: new Date(rescheduleAppointmentData.dateTime),
            type: rescheduleAppointmentData.type,
            duration: rescheduleAppointmentData.duration,
            location: rescheduleAppointmentData.location || undefined,
            notes: rescheduleAppointmentData.notes || undefined,
            status: rescheduleAppointmentData.status
          }
        : apt
    ))

    setIsRescheduleDialogOpen(false)
    setRescheduleAppointmentData(null)
    toast.success('Appointment rescheduled successfully')
  }

  // Appointment management functions
  const addAppointment = () => {
    if (!newAppointment.patientId || !newAppointment.patientName || !newAppointment.dateTime || !newAppointment.type) {
      toast.error('Please fill in all required fields')
      return
    }

    // Check for duplicate appointments (same patient, same date/time)
    const isDuplicate = upcomingAppointments.some(apt =>
      apt.patientId === newAppointment.patientId &&
      new Date(apt.dateTime).toDateString() === new Date(newAppointment.dateTime).toDateString() &&
      apt.type === newAppointment.type
    )

    if (isDuplicate) {
      toast.error('An appointment with the same patient, date, and type already exists')
      return
    }

    const appointment = {
      id: Date.now().toString(),
      patientName: newAppointment.patientName,
      patientId: newAppointment.patientId,
      dateTime: new Date(newAppointment.dateTime),
      type: newAppointment.type,
      duration: newAppointment.duration,
      location: newAppointment.location || undefined,
      notes: newAppointment.notes || undefined,
      status: 'scheduled' as const
    }

    setUpcomingAppointments(prev => [...prev, appointment])
    setNewAppointment({
      patientId: "",
      patientName: "",
      dateTime: "",
      type: "",
      duration: 30,
      location: "",
      notes: ""
    })
    setIsAppointmentDialogOpen(false)
    toast.success('Appointment added successfully')
  }

  const handlePatientSelect = (patientId: string) => {
    const patient = patients.find(p => p.patient_id === patientId)
    if (patient) {
      setNewAppointment(prev => ({
        ...prev,
        patientId: patient.patient_id,
        patientName: patient.name
      }))
    }
  }

  // Filter analyses based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredAnalyses(patientAnalyses)
    } else {
      const filtered = patientAnalyses.filter(analysis => {
        const searchLower = searchTerm.toLowerCase()
        const nameMatch = analysis.patient_name?.toLowerCase().includes(searchLower)
        const idMatch = analysis.patient_id_display?.toLowerCase().includes(searchLower)
        return nameMatch || idMatch
      })
      setFilteredAnalyses(filtered)
    }
  }, [searchTerm, patientAnalyses])

  const handleEditAnalysis = (analysis: PatientAnalysis) => {
    console.log('Editing analysis:', analysis)
    setEditingAnalysis(analysis)
    setEditForm({
      name: (analysis.patient_name || '').trim(),
      patientId: (analysis.patient_id_display || '').trim(),
      birthDate: analysis.birth_date || '',
      email: (analysis.email || '').trim(),
      phone: (analysis.phone || '').trim(),
      profilePicture: null,
      profilePictureUrl: analysis.profile_picture || '',
      analysisDate: new Date().toISOString().split('T')[0],
      analysisTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
      diagnosis: analysis.diagnosis,
      confidence: analysis.confidence,
      advice: analysis.advice
    })
    setIsEditDialogOpen(true)
  }

  const handleViewReport = (analysis: PatientAnalysis) => {
    setSelectedAnalysisForReport(analysis)
    setIsReportDialogOpen(true)
  }

  const handleUpdateAnalysis = async () => {
    if (!editingAnalysis) return

    try {
      // Handle profile picture upload
      let profilePictureUrl = editForm.profilePictureUrl;
      if (editForm.profilePicture) {
        try {
          // Convert file to base64 for storage
          const reader = new FileReader();
          profilePictureUrl = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(editForm.profilePicture as Blob);
          });
          console.log('Profile picture converted to base64, length:', profilePictureUrl.length);
        } catch (error) {
          console.error('Error converting profile picture:', error);
          toast.error('Failed to process profile picture');
          return;
        }
      }

      // Update patient information first - use the patient ID from the analysis
      const currentPatientId = editingAnalysis.patient_id_display
      const patientData = {
        name: editForm.name,
        patient_id: editForm.patientId,
        birth_date: editForm.birthDate,
        email: editForm.email,
        phone: editForm.phone,
        profile_picture: profilePictureUrl,
      }

      console.log('Updating patient with data:', patientData);

      // Use PUT to update the specific patient by their current patient_id
      const patientResponse = await fetch(`/api/patients/${currentPatientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData),
      })

      if (!patientResponse.ok) {
        const errorData = await patientResponse.json()
        console.error('Patient update failed:', errorData);
        throw new Error(errorData.detail || 'Failed to update patient information')
      }

      const patientResult = await patientResponse.json()
      console.log('Patient update result:', patientResult);
      const newPatientId = patientResult.patient.id

      // Update analysis information, including the patient_id if it changed
      const analysisData = {
        diagnosis: editForm.diagnosis,
        confidence: editForm.confidence,
        advice: editForm.advice,
        patient_id: newPatientId  // Update the patient association (database ID)
      }

      console.log('Updating analysis with data:', analysisData);

      const analysisResponse = await fetch(`/api/patient-analyses/${editingAnalysis.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisData)
      })

      if (analysisResponse.ok) {
        // Refresh the analyses list
        const refreshResponse = await fetch('/api/patient-analyses')
        if (refreshResponse.ok) {
          const data = await refreshResponse.json()
          setPatientAnalyses(data.analyses || [])
        }

        // Also refresh patients list to get updated patient data
        const patientsResponse = await fetch('/api/patients')
        if (patientsResponse.ok) {
          const patientsData = await patientsResponse.json()
          setPatients(patientsData.patients || [])
        }

        // Update any appointments that reference this patient (by old patient ID) to use the new patient ID
        const oldPatientIdDisplay = editingAnalysis.patient_id_display
        const newPatientId = patientResult.patient.patient_id
        const newPatientName = patientResult.patient.name

        setUpcomingAppointments(prev => prev.map(appointment =>
          appointment.patientId === oldPatientIdDisplay
            ? { ...appointment, patientId: newPatientId, patientName: newPatientName }
            : appointment
        ))

        // Update localStorage for appointments
        const currentAppointments = JSON.parse(localStorage.getItem('upcomingAppointments') || '[]')
        const updatedAppointments = currentAppointments.map((appointment: any) =>
          appointment.patientId === oldPatientIdDisplay
            ? { ...appointment, patientId: newPatientId, patientName: newPatientName }
            : appointment
        )
        localStorage.setItem('upcomingAppointments', JSON.stringify(updatedAppointments))

        // Update active cases that reference this patient (by patient_id_display)
        setActiveCases(prev => prev.map(case_ =>
          case_.patientId === oldPatientIdDisplay
            ? { ...case_, patientId: newPatientId, patientName: newPatientName }
            : case_
        ))

        // Update localStorage for active cases
        const updatedCases = activeCases.map(case_ =>
          case_.patientId === oldPatientIdDisplay
            ? { ...case_, patientId: newPatientId, patientName: newPatientName }
            : case_
        )
        localStorage.setItem('activeCases', JSON.stringify(updatedCases))

        setEditingAnalysis(null)
        setIsEditDialogOpen(false)
        toast.success('Analysis and patient information updated successfully')
      } else {
        const errorData = await analysisResponse.json()
        console.error('Analysis update failed:', errorData);
        toast.error('Failed to update analysis')
      }
    } catch (error) {
      console.error('Update error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update analysis')
    }
  }

  const handleDeleteAnalysis = async (analysisId: number) => {
    if (!confirm('Are you sure you want to delete this analysis and the associated patient? This action cannot be undone.')) {
      return
    }

    try {
      // First, get the analysis to find the patient_id
      const analysis = patientAnalyses.find(a => a.id === analysisId)
      if (!analysis) {
        toast.error('Analysis not found')
        return
      }

      // Delete the analysis first
      const analysisResponse = await fetch(`/api/patient-analyses/${analysisId}`, {
        method: 'DELETE'
      })

      if (!analysisResponse.ok) {
        toast.error('Failed to delete analysis')
        return
      }

      // Then delete the associated patient
      const patientResponse = await fetch(`/api/patients/${analysis.patient_id_display}`, {
        method: 'DELETE'
      })

      if (patientResponse.ok) {
        // Remove from local state
        setPatientAnalyses(prev => prev.filter(analysis => analysis.id !== analysisId))

        // Also remove the active case for this patient
        const caseIdToRemove = `case-${analysisId}`
        setActiveCases(prev => prev.filter(case_ => case_.id !== caseIdToRemove))

        // Cancel all appointments for this patient
        setUpcomingAppointments(prev => prev.map(appointment =>
          appointment.patientId === analysis.patient_id_display
            ? { ...appointment, status: 'cancelled' as const }
            : appointment
        ))

        // Remove all pending tasks for this patient
        setPendingTasks(prev => {
          const updatedTasks = prev.filter(task => task.patientId !== analysis.patient_id_display)
          // Update localStorage immediately
          localStorage.setItem('pendingTasks', JSON.stringify(updatedTasks))
          return updatedTasks
        })

        // Update localStorage for cases and appointments
        const updatedCases = activeCases.filter(case_ => case_.id !== caseIdToRemove)
        localStorage.setItem('activeCases', JSON.stringify(updatedCases))

        const updatedAppointments = upcomingAppointments.map(appointment =>
          appointment.patientId === analysis.patient_id_display
            ? { ...appointment, status: 'cancelled' as const }
            : appointment
        )
        localStorage.setItem('upcomingAppointments', JSON.stringify(updatedAppointments))

        toast.success('Analysis, patient, and active case deleted successfully. Related appointments cancelled.')
      } else {
        toast.error('Analysis deleted but failed to delete patient')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete analysis and patient')
    }
  }

  const exportToPDF = async () => {
    if (!reportRef.current) return

    try {
      // Create a simplified version for PDF export
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      let yPosition = margin

      // Add title
      pdf.setFontSize(20)
      pdf.text('Medical Dashboard Report', margin, yPosition)
      yPosition += 15

      // Add date
      pdf.setFontSize(12)
      pdf.text(`Generated on: ${format(new Date(), 'PPP')}`, margin, yPosition)
      yPosition += 10

      // Add metrics summary
      pdf.setFontSize(16)
      pdf.text('Key Metrics:', margin, yPosition)
      yPosition += 10

      pdf.setFontSize(12)
      const metrics = [
        'Total Patients: 1,234',
        'AI Analyses: 456',
        'Reports Generated: 78',
        'Success Rate: 94.2%',
        'Avg Response Time: 2.3s',
        'System Uptime: 99.8%'
      ]

      metrics.forEach(metric => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage()
          yPosition = margin
        }
        pdf.text(metric, margin, yPosition)
        yPosition += 8
      })

      pdf.save(`medical-dashboard-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
      toast.success('PDF report exported successfully')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to export PDF. Please try again.')
    }
  }

  const printReport = () => {
    window.print()
  }

  // Calculator functions
  const calculateBMI = () => {
    const weight = parseFloat(bmiInputs.weight)
    const height = parseFloat(bmiInputs.height) / 100 // Convert cm to meters

    if (weight > 0 && height > 0) {
      const bmi = weight / (height * height)
      let category = ''

      if (bmi < 18.5) category = 'Underweight'
      else if (bmi < 25) category = 'Normal weight'
      else if (bmi < 30) category = 'Overweight'
      else category = 'Obese'

      setBmiResult({ bmi: bmi.toFixed(1), category })
    }
  }

  const calculateGFR = () => {
    const creatinine = parseFloat(gfrInputs.creatinine)
    const age = parseInt(gfrInputs.age)
    const isFemale = gfrInputs.gender === 'female'
    const isBlack = gfrInputs.race === 'black'

    if (creatinine > 0 && age > 0) {
      // CKD-EPI formula
      let egfr = 0
      if (isFemale) {
        if (creatinine <= 0.7) {
          egfr = 144 * Math.pow(creatinine / 0.7, -0.329) * Math.pow(0.993, age)
        } else {
          egfr = 144 * Math.pow(creatinine / 0.7, -1.209) * Math.pow(0.993, age)
        }
      } else {
        if (creatinine <= 0.9) {
          egfr = 141 * Math.pow(creatinine / 0.9, -0.411) * Math.pow(0.993, age)
        } else {
          egfr = 141 * Math.pow(creatinine / 0.9, -1.209) * Math.pow(0.993, age)
        }
      }

      if (isBlack) egfr *= 1.159

      let stage = ''
      if (egfr >= 90) stage = 'Stage 1 (Normal)'
      else if (egfr >= 60) stage = 'Stage 2 (Mild)'
      else if (egfr >= 30) stage = 'Stage 3 (Moderate)'
      else if (egfr >= 15) stage = 'Stage 4 (Severe)'
      else stage = 'Stage 5 (Kidney Failure)'

      setGfrResult({ egfr: egfr.toFixed(0), stage })
    }
  }

  const calculateFluid = () => {
    const weight = parseFloat(fluidInputs.weight)
    const isMaintenance = fluidInputs.type === 'maintenance'

    if (weight > 0) {
      let daily = 0
      if (isMaintenance) {
        // Holliday-Segar formula
        if (weight <= 10) daily = weight * 100
        else if (weight <= 20) daily = 1000 + (weight - 10) * 50
        else daily = 1500 + (weight - 20) * 20
      } else {
        // Replacement fluid (simplified)
        daily = weight * 30 // 30 mL/kg for replacement
      }

      const hourly = daily / 24
      setFluidResult({
        daily: daily.toFixed(0),
        hourly: hourly.toFixed(0)
      })
    }
  }

  const calculateDose = () => {
    const desiredDose = parseFloat(doseInputs.desiredDose)
    const concentration = parseFloat(doseInputs.concentration)
    const volume = parseFloat(doseInputs.volume)

    if (desiredDose > 0 && concentration > 0 && volume > 0) {
      const totalDose = (concentration * volume) / 1000 // Convert to grams if needed
      const finalConcentration = (desiredDose / volume) * 1000 // mg/mL

      setDoseResult({
        totalDose: totalDose.toFixed(2),
        concentration: finalConcentration.toFixed(1)
      })
    }
  }

  const convertUnits = () => {
    const { value, fromUnit, toUnit } = converterInputs
    const numValue = parseFloat(value)

    if (!numValue || !fromUnit || !toUnit || fromUnit === toUnit) {
      setConverterResult(null)
      return
    }

    let result = numValue

    // Common lab value conversions
    if (fromUnit === 'mg-dl' && toUnit === 'mmol-l') {
      // Glucose: mg/dL to mmol/L
      result = numValue / 18.018
    } else if (fromUnit === 'mmol-l' && toUnit === 'mg-dl') {
      // Glucose: mmol/L to mg/dL
      result = numValue * 18.018
    } else if (fromUnit === 'mg-dl' && toUnit === 'g-l') {
      // Convert mg/dL to g/L
      result = numValue / 100
    } else if (fromUnit === 'g-l' && toUnit === 'mg-dl') {
      // Convert g/L to mg/dL
      result = numValue * 100
    } else if (fromUnit === 'mmol-l' && toUnit === 'g-l') {
      // mmol/L to g/L (assuming molecular weight ~180 for glucose)
      result = (numValue * 180.18) / 1000
    } else if (fromUnit === 'g-l' && toUnit === 'mmol-l') {
      // g/L to mmol/L (assuming molecular weight ~180 for glucose)
      result = (numValue * 1000) / 180.18
    }

    setConverterResult(result.toFixed(2))
  }

  const openReferenceModal = (referenceType: string) => {
    setSelectedReference(referenceType)
    setIsReferenceModalOpen(true)
  }

  return (
    <div className={cn("space-y-6", className)} ref={reportRef}>
      {/* Report Header */}
      {/* <Card className="gradient-card shadow-lg hover-lift">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary animate-glow">
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="gradient-text text-2xl">Advanced Reports</CardTitle>
                <CardDescription className="text-muted-foreground/80">
                  Comprehensive analytics and reporting dashboard
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={printReport} variant="outline" className="rounded-xl gradient-primary hover-lift">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button onClick={exportToPDF} className="rounded-xl gradient-primary hover-lift">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card> */}

      {/* Filters */}
      <Card className="gradient-card shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="report-type">Sections</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="patients">Patient Analytics</SelectItem>
                  <SelectItem value="medical-tools">Medical Tools</SelectItem>
                  <SelectItem value="ongoing-cases">Case Management</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by patient name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-xl"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <Tabs value={reportType} onValueChange={setReportType} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 rounded-xl gradient-bg">
            <TabsTrigger value="overview" className="rounded-lg hover-lift data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:via-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="patients" className="rounded-lg hover-lift data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:via-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">Patients</TabsTrigger>
            <TabsTrigger value="medical-tools" className="rounded-lg hover-lift data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:via-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">Medical Tools</TabsTrigger>
            <TabsTrigger value="ongoing-cases" className="rounded-lg hover-lift data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:via-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">Case Management</TabsTrigger>
          </TabsList>

        <TabsContent value="overview" className="space-y-6">
           {/* Key Metrics */}
           <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
             <Card className="gradient-card hover-lift">
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                 <CardTitle className="text-sm font-semibold gradient-text">Total Patients</CardTitle>
                 <Users className="h-4 w-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold gradient-text">
                   {isLoadingOverview ? '...' : overviewMetrics.totalPatients}
                 </div>
                 <p className="text-xs text-muted-foreground">
                   Active patients in system
                 </p>
               </CardContent>
             </Card>

             <Card className="gradient-card hover-lift">
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                 <CardTitle className="text-sm font-semibold gradient-text">AI Analyses</CardTitle>
                 <Activity className="h-4 w-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold gradient-text">
                   {isLoadingOverview ? '...' : overviewMetrics.totalAnalyses}
                 </div>
                 <p className="text-xs text-muted-foreground">
                   Total analyses performed
                 </p>
               </CardContent>
             </Card>

             <Card className="gradient-card hover-lift">
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                 <CardTitle className="text-sm font-semibold gradient-text">Reports Generated</CardTitle>
                 <FileText className="h-4 w-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold gradient-text">
                   {isLoadingOverview ? '...' : overviewMetrics.reportsGenerated}
                 </div>
                 <p className="text-xs text-muted-foreground">
                   Available medical reports
                 </p>
               </CardContent>
             </Card>

             <Card className="gradient-card hover-lift">
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                 <CardTitle className="text-sm font-semibold gradient-text">Success Rate</CardTitle>
                 <TrendingUp className="h-4 w-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold gradient-text">
                   {isLoadingOverview ? '...' : `${overviewMetrics.successRate}%`}
                 </div>
                 <p className="text-xs text-muted-foreground">
                   High confidence analyses
                 </p>
               </CardContent>
             </Card>
           </div>

           {/* Performance Indicators */}
           <div className="grid gap-6 md:grid-cols-2">
             <Card className="gradient-card shadow-lg">
               <CardHeader>
                 <CardTitle className="flex items-center gap-3">
                   <Activity className="h-5 w-5" />
                   <span className="gradient-text">System Performance</span>
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="text-center p-4 bg-muted/50 rounded-lg">
                     <div className="text-2xl font-bold gradient-text">{overviewMetrics.avgResponseTime}s</div>
                     <div className="text-sm text-muted-foreground">Avg Response Time</div>
                   </div>
                   <div className="text-center p-4 bg-muted/50 rounded-lg">
                     <div className="text-2xl font-bold gradient-text">{overviewMetrics.systemUptime}%</div>
                     <div className="text-sm text-muted-foreground">System Uptime</div>
                   </div>
                 </div>
               </CardContent>
             </Card>

             <Card className="gradient-card shadow-lg">
               <CardHeader>
                 <CardTitle className="flex items-center gap-3">
                   <AlertCircle className="h-5 w-5" />
                   <span className="gradient-text">System Alerts</span>
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 {alerts.length === 0 ? (
                   <div className="text-center py-8">
                     <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                     <p className="text-muted-foreground">All systems operational</p>
                   </div>
                 ) : (
                   <div className="space-y-3">
                     {alerts.map((alert) => (
                       <div key={alert.id} className={`p-3 rounded-lg border ${
                         alert.type === 'critical' ? 'bg-red-50 border-red-200' :
                         alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                         'bg-blue-50 border-blue-200'
                       }`}>
                         <div className="flex items-center gap-2">
                           {alert.type === 'critical' && <AlertCircle className="h-4 w-4 text-red-600" />}
                           {alert.type === 'warning' && <AlertCircle className="h-4 w-4 text-yellow-600" />}
                           {alert.type === 'info' && <Activity className="h-4 w-4 text-blue-600" />}
                           <span className={`text-sm font-medium ${
                             alert.type === 'critical' ? 'text-red-800' :
                             alert.type === 'warning' ? 'text-yellow-800' :
                             'text-blue-800'
                           }`}>
                             {alert.message}
                           </span>
                         </div>
                         <div className="text-xs text-muted-foreground mt-1">
                           {alert.timestamp.toLocaleTimeString()}
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </CardContent>
             </Card>
           </div>

           {/* Recent Activities and Quick Actions */}
           <div className="grid gap-6 md:grid-cols-2">
             <Card className="gradient-card shadow-lg">
               <CardHeader>
                 <CardTitle className="flex items-center gap-3">
                   <Activity className="h-5 w-5" />
                   <span className="gradient-text">Recent Activities</span>
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 {recentActivities.length === 0 ? (
                   <div className="text-center py-8">
                     <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                     <p className="text-muted-foreground">No recent activities</p>
                   </div>
                 ) : (
                   <div className="space-y-3">
                     {recentActivities.map((activity) => (
                       <div key={activity.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                         <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                         <div className="flex-1">
                           <p className="text-sm font-medium">{activity.description}</p>
                           <p className="text-xs text-muted-foreground">
                             {activity.timestamp.toLocaleString()}
                           </p>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </CardContent>
             </Card>

             <Card className="gradient-card shadow-lg">
               <CardHeader>
                 <CardTitle className="flex items-center gap-3">
                   <Activity className="h-5 w-5" />
                   <span className="gradient-text">Quick Actions</span>
                 </CardTitle>
                 <CardDescription>Common tasks and shortcuts</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="grid grid-cols-2 gap-3">
                   <Button
                     className="h-auto p-4 flex flex-col items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 transform hover:scale-105 transition-all duration-300 ease-in-out text-white"
                     onClick={() => setReportType("patients")}
                   >
                     <Users className="h-5 w-5" />
                     <span className="text-xs">View Patients</span>
                   </Button>
                   <Button
                     className="h-auto p-4 flex flex-col items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 transform hover:scale-105 transition-all duration-300 ease-in-out text-white"
                     onClick={() => window.open('/', '_blank')}
                   >
                     <Activity className="h-5 w-5" />
                     <span className="text-xs">Run Analysis</span>
                   </Button>
                   <Button
                     className="h-auto p-4 flex flex-col items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 transform hover:scale-105 transition-all duration-300 ease-in-out text-white"
                     onClick={() => setReportType("medical-tools")}
                   >
                     <BarChart3 className="h-5 w-5" />
                     <span className="text-xs">View Analytics</span>
                   </Button>
                   <Button
                     className="h-auto p-4 flex flex-col items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 transform hover:scale-105 transition-all duration-300 ease-in-out text-white"
                     onClick={exportToPDF}
                   >
                     <Download className="h-5 w-5" />
                     <span className="text-xs">Export Report</span>
                   </Button>
                 </div>
               </CardContent>
             </Card>
           </div>
         </TabsContent>

        <TabsContent value="patients" className="space-y-6">
          <Card className="gradient-card shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Stethoscope className="h-5 w-5" />
                <span className="gradient-text">Patient Analysis Reports</span>
              </CardTitle>
              <CardDescription>
                AI analysis results linked to patient records
                {searchTerm.trim() && (
                  <span className="block text-sm mt-1">
                    Showing {filteredAnalyses.length} of {patientAnalyses.length} analyses
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAnalyses ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Loading patient analyses...</span>
                </div>
              ) : filteredAnalyses.length === 0 ? (
                <div className="text-center py-8">
                  <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  {searchTerm.trim() ? (
                    <>
                      <p className="text-muted-foreground">No patient analyses found matching "{searchTerm}"</p>
                      <p className="text-sm text-muted-foreground/60">Try searching with a different name or ID</p>
                    </>
                  ) : (
                    <>
                      <p className="text-muted-foreground">No patient analyses found</p>
                      <p className="text-sm text-muted-foreground/60">Save AI analysis results with patient information to see them here</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Table Header */}
                  <div className="hidden md:grid grid-cols-13 gap-4 p-4 bg-muted/50 rounded-t-lg font-semibold text-sm text-muted-foreground border-b">
                    <div className="col-span-1">Photo</div>
                    <div className="col-span-2">Patient Info</div>
                    <div className="col-span-2">Contacts</div>
                    <div className="col-span-5">Test Results</div>
                    <div className="col-span-3">Actions</div>
                  </div>

                  {/* Mobile Header - Hidden on desktop */}
                  <div className="md:hidden p-4 bg-muted/50 rounded-t-lg">
                    <h3 className="font-semibold text-sm text-muted-foreground">Patient Records</h3>
                  </div>
                  
                  {/* Scrollable container that only appears when there are more than 5 patients */}
                  <div className={filteredAnalyses.length > 5 ? "overflow-y-auto max-h-[400px] pr-2" : ""}>
                    {/* Patient Rows */}
                  {filteredAnalyses.map((analysis, index) => (
                    <div key={`analysis-${analysis.id}`}>
                      {/* Desktop Table Row */}
                      <div className="hidden md:grid grid-cols-13 gap-4 p-4 border-b border-border/50 hover:bg-muted/20 transition-colors animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                        {/* Profile Picture */}
                        <div className="col-span-1 flex items-center">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                            {analysis.profile_picture ? (
                              <img
                                src={analysis.profile_picture}
                                alt={`${analysis.patient_name} profile`}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              (analysis.patient_name || 'U')[0].toUpperCase()
                            )}
                          </div>
                        </div>

                        {/* Patient Info */}
                        <div className="col-span-2 flex flex-col justify-center">
                          <h3 className="font-semibold text-foreground text-sm">{analysis.patient_name}</h3>
                          <p className="text-xs text-muted-foreground">ID: {analysis.patient_id_display}</p>
                          <p className="text-xs text-muted-foreground">
                            Age: {analysis.birth_date ? new Date().getFullYear() - new Date(analysis.birth_date).getFullYear() : 'N/A'} / Gender: Male
                          </p>
                        </div>

                        {/* Contacts */}
                        <div className="col-span-2 flex flex-col justify-center space-y-1">
                          {analysis.email && (
                            <p className="text-xs text-muted-foreground">📧 {analysis.email}</p>
                          )}
                          {analysis.phone && (
                            <p className="text-xs text-muted-foreground">📱 {analysis.phone}</p>
                          )}
                          {!analysis.email && !analysis.phone && (
                            <p className="text-xs text-muted-foreground text-center">-</p>
                          )}
                        </div>


                        {/* Test Results */}
                        <div className="col-span-4 flex flex-col justify-center space-y-2">
                          <div className="flex items-center gap-2">
                            {analysis.confidence >= 80 ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : analysis.confidence >= 60 ? (
                              <AlertCircle className="h-4 w-4 text-yellow-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            )}
                            <Badge variant="outline" className={
                              analysis.confidence >= 80 ? "bg-green-100 text-green-800 border-green-200 text-xs" :
                              analysis.confidence >= 60 ? "bg-yellow-100 text-yellow-800 border-yellow-200 text-xs" :
                              "bg-red-100 text-red-800 border-red-200 text-xs"
                            }>
                              {analysis.confidence}% confidence
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-foreground">Diagnosis: {expandDiagnosis(analysis.diagnosis)}</p>
                            <p className="text-xs text-muted-foreground mt-1">Advice: {analysis.advice}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Last Updated: {analysis.updated_at ? new Date(analysis.updated_at).toLocaleDateString() : 'N/A'} at{' '}
                            {analysis.updated_at ? new Date(new Date(analysis.updated_at).getTime() + (3 * 60 * 60 * 1000)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="col-span-3 flex items-center gap-1">
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => handleViewReport(analysis)}
                             className="text-green-600 border-green-200 hover:bg-green-50 text-xs px-2"
                           >
                             <Eye className="h-3 w-3 mr-1" />
                             View
                           </Button>
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => handleEditAnalysis(analysis)}
                             className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs px-2"
                           >
                             <Edit className="h-3 w-3 mr-1" />
                             Edit
                           </Button>
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => handleDeleteAnalysis(analysis.id)}
                             className="text-red-600 border-red-200 hover:bg-red-50 text-xs px-2"
                           >
                             <Trash2 className="h-3 w-3 mr-1" />
                             Delete
                           </Button>
                         </div>
                      </div>

                      {/* Mobile Card Layout */}
                      <Card key={`mobile-${analysis.id}`} className="md:hidden gradient-card hover-lift animate-in slide-in-from-bottom-2 duration-300 mx-4 mb-4" style={{ animationDelay: `${index * 50}ms` }}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3 mb-3">
                            {/* Profile Picture */}
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {analysis.profile_picture ? (
                                <img
                                  src={analysis.profile_picture}
                                  alt={`${analysis.patient_name} profile`}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                (analysis.patient_name || 'U')[0].toUpperCase()
                              )}
                            </div>

                            {/* Patient Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground text-sm">{analysis.patient_name}</h3>
                              <p className="text-xs text-muted-foreground">ID: {analysis.patient_id_display}</p>
                              <p className="text-xs text-muted-foreground">
                                Age: {analysis.birth_date ? new Date().getFullYear() - new Date(analysis.birth_date).getFullYear() : 'N/A'} / Gender: Male
                              </p>
                            </div>
                          </div>

                          {/* Contacts */}
                          <div className="mb-3 space-y-1">
                            {analysis.email && (
                              <p className="text-xs text-muted-foreground">📧 {analysis.email}</p>
                            )}
                            {analysis.phone && (
                              <p className="text-xs text-muted-foreground">📱 {analysis.phone}</p>
                            )}
                          </div>


                          {/* Test Results */}
                          <div className="mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              {analysis.confidence >= 80 ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : analysis.confidence >= 60 ? (
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-600" />
                              )}
                              <Badge variant="outline" className={
                                analysis.confidence >= 80 ? "bg-green-100 text-green-800 border-green-200 text-xs" :
                                analysis.confidence >= 60 ? "bg-yellow-100 text-yellow-800 border-yellow-200 text-xs" :
                                "bg-red-100 text-red-800 border-red-200 text-xs"
                              }>
                                {analysis.confidence}% confidence
                              </Badge>
                            </div>
                            <p className="text-xs font-medium text-foreground mb-1">Diagnosis: {expandDiagnosis(analysis.diagnosis)}</p>
                            <p className="text-xs text-muted-foreground mb-2">Advice: {analysis.advice}</p>
                            <p className="text-xs text-muted-foreground">
                              Last Updated: {analysis.updated_at ? new Date(analysis.updated_at).toLocaleDateString() : 'N/A'} at{' '}
                              {analysis.updated_at ? new Date(new Date(analysis.updated_at).getTime() + (3 * 60 * 60 * 1000)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewReport(analysis)}
                              className="text-green-600 border-green-200 hover:bg-green-50 text-xs flex-1"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Report
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditAnalysis(analysis)}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs flex-1"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteAnalysis(analysis.id)}
                              className="text-red-600 border-red-200 hover:bg-red-50 text-xs flex-1"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medical-tools" className="space-y-6">
           {/* Medical Calculators */}
           <Card className="gradient-card shadow-lg">
             <CardHeader>
               <CardTitle className="flex items-center gap-3">
                 <Activity className="h-5 w-5" />
                 <span className="gradient-text">Medical Calculators</span>
               </CardTitle>
               <CardDescription>Quick medical calculations for clinical decision making</CardDescription>
             </CardHeader>
             <CardContent>
               <Tabs defaultValue="bmi" className="w-full">
                 <TabsList className="grid w-full grid-cols-4">
                   <TabsTrigger value="bmi">BMI Calculator</TabsTrigger>
                   <TabsTrigger value="gfr">GFR Calculator</TabsTrigger>
                   <TabsTrigger value="fluid">Fluid Balance</TabsTrigger>
                   <TabsTrigger value="dose">Dose Calculator</TabsTrigger>
                 </TabsList>

                 <TabsContent value="bmi" className="space-y-4 mt-4">
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="weight">Weight (kg)</Label>
                       <Input
                         id="weight"
                         type="number"
                         placeholder="70"
                         value={bmiInputs.weight}
                         onChange={(e) => setBmiInputs({...bmiInputs, weight: e.target.value})}
                       />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="height">Height (cm)</Label>
                       <Input
                         id="height"
                         type="number"
                         placeholder="170"
                         value={bmiInputs.height}
                         onChange={(e) => setBmiInputs({...bmiInputs, height: e.target.value})}
                       />
                     </div>
                   </div>
                   <Button
                     className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out"
                     onClick={calculateBMI}
                   >
                     Calculate BMI
                   </Button>
                   <div className="p-4 bg-muted rounded-lg">
                     <p className="text-sm text-muted-foreground">BMI Result: <span className="font-bold text-foreground">{bmiResult.bmi || '--'}</span></p>
                     <p className="text-xs text-muted-foreground mt-1">Category: {bmiResult.category || '--'}</p>
                   </div>
                 </TabsContent>

                 <TabsContent value="gfr" className="space-y-4 mt-4">
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="creatinine">Creatinine (mg/dL)</Label>
                       <Input
                         id="creatinine"
                         type="number"
                         placeholder="1.0"
                         value={gfrInputs.creatinine}
                         onChange={(e) => setGfrInputs({...gfrInputs, creatinine: e.target.value})}
                       />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="age">Age (years)</Label>
                       <Input
                         id="age"
                         type="number"
                         placeholder="45"
                         value={gfrInputs.age}
                         onChange={(e) => setGfrInputs({...gfrInputs, age: e.target.value})}
                       />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="gender">Gender</Label>
                       <Select value={gfrInputs.gender} onValueChange={(value) => setGfrInputs({...gfrInputs, gender: value})}>
                         <SelectTrigger>
                           <SelectValue placeholder="Select gender" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="male">Male</SelectItem>
                           <SelectItem value="female">Female</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="race">Race</Label>
                       <Select value={gfrInputs.race} onValueChange={(value) => setGfrInputs({...gfrInputs, race: value})}>
                         <SelectTrigger>
                           <SelectValue placeholder="Select race" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="black">Black</SelectItem>
                           <SelectItem value="other">Other</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                   </div>
                   <Button
                     className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out"
                     onClick={calculateGFR}
                   >
                     Calculate GFR (CKD-EPI)
                   </Button>
                   <div className="p-4 bg-muted rounded-lg">
                     <p className="text-sm text-muted-foreground">eGFR: <span className="font-bold text-foreground">{gfrResult.egfr || '--'} mL/min/1.73m²</span></p>
                     <p className="text-xs text-muted-foreground mt-1">Stage: {gfrResult.stage || '--'}</p>
                   </div>
                 </TabsContent>

                 <TabsContent value="fluid" className="space-y-4 mt-4">
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="weight-fluid">Weight (kg)</Label>
                       <Input
                         id="weight-fluid"
                         type="number"
                         placeholder="70"
                         value={fluidInputs.weight}
                         onChange={(e) => setFluidInputs({...fluidInputs, weight: e.target.value})}
                       />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="maintenance-type">Type</Label>
                       <Select value={fluidInputs.type} onValueChange={(value) => setFluidInputs({...fluidInputs, type: value})}>
                         <SelectTrigger>
                           <SelectValue placeholder="Select type" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="maintenance">Maintenance</SelectItem>
                           <SelectItem value="replacement">Fluid Replacement</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                   </div>
                   <Button
                     className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out"
                     onClick={calculateFluid}
                   >
                     Calculate Fluid Requirements
                   </Button>
                   <div className="p-4 bg-muted rounded-lg">
                     <p className="text-sm text-muted-foreground">Daily Fluid: <span className="font-bold text-foreground">{fluidResult.daily || '--'} mL/day</span></p>
                     <p className="text-xs text-muted-foreground mt-1">Hourly Rate: {fluidResult.hourly || '--'} mL/hr</p>
                   </div>
                 </TabsContent>

                 <TabsContent value="dose" className="space-y-4 mt-4">
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="desired-dose">Desired Dose (mg)</Label>
                       <Input
                         id="desired-dose"
                         type="number"
                         placeholder="500"
                         value={doseInputs.desiredDose}
                         onChange={(e) => setDoseInputs({...doseInputs, desiredDose: e.target.value})}
                       />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="concentration">Concentration (mg/mL)</Label>
                       <Input
                         id="concentration"
                         type="number"
                         placeholder="250"
                         value={doseInputs.concentration}
                         onChange={(e) => setDoseInputs({...doseInputs, concentration: e.target.value})}
                       />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="volume">Volume (mL)</Label>
                       <Input
                         id="volume"
                         type="number"
                         placeholder="2"
                         value={doseInputs.volume}
                         onChange={(e) => setDoseInputs({...doseInputs, volume: e.target.value})}
                       />
                     </div>
                   </div>
                   <Button
                     className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out"
                     onClick={calculateDose}
                   >
                     Calculate Dose
                   </Button>
                   <div className="p-4 bg-muted rounded-lg">
                     <p className="text-sm text-muted-foreground">Total Dose: <span className="font-bold text-foreground">{doseResult.totalDose || '--'} mg</span></p>
                     <p className="text-xs text-muted-foreground mt-1">Concentration: {doseResult.concentration || '--'} mg/mL</p>
                   </div>
                 </TabsContent>
               </Tabs>
             </CardContent>
           </Card>

           {/* Medical Reference Tools */}
           <div className="grid gap-6 md:grid-cols-2">
             <Card className="gradient-card shadow-lg">
               <CardHeader>
                 <CardTitle className="flex items-center gap-3">
                   <FileText className="h-5 w-5" />
                   <span className="gradient-text">Medical References</span>
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="space-y-3">
                   <Button
                     variant="outline"
                     className="w-full justify-start bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 hover:shadow-lg transform hover:scale-102 transition-all duration-300 ease-in-out"
                     onClick={() => openReferenceModal('lab-values')}
                   >
                     📚 Normal Lab Values Reference
                   </Button>
                   <Button
                     variant="outline"
                     className="w-full justify-start bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:from-green-100 hover:to-emerald-100 hover:border-green-300 hover:shadow-lg transform hover:scale-102 transition-all duration-300 ease-in-out"
                     onClick={() => openReferenceModal('drug-dosage')}
                   >
                     💊 Drug Dosage Guidelines
                   </Button>
                   <Button
                     variant="outline"
                     className="w-full justify-start bg-gradient-to-r from-red-50 to-pink-50 border-red-200 hover:from-red-100 hover:to-pink-100 hover:border-red-300 hover:shadow-lg transform hover:scale-102 transition-all duration-300 ease-in-out"
                     onClick={() => openReferenceModal('vital-signs')}
                   >
                     🩺 Vital Signs Reference
                   </Button>
                   <Button
                     variant="outline"
                     className="w-full justify-start bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200 hover:from-purple-100 hover:to-violet-100 hover:border-purple-300 hover:shadow-lg transform hover:scale-102 transition-all duration-300 ease-in-out"
                     onClick={() => openReferenceModal('abbreviations')}
                   >
                     🏥 Medical Abbreviations
                   </Button>
                 </div>
               </CardContent>
             </Card>

             <Card className="gradient-card shadow-lg">
               <CardHeader>
                 <CardTitle className="flex items-center gap-3">
                   <BarChart3 className="h-5 w-5" />
                   <span className="gradient-text">Unit Converters</span>
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="space-y-3">
                   <div className="grid grid-cols-2 gap-2">
                     <Input
                       placeholder="Value"
                       value={converterInputs.value}
                       onChange={(e) => setConverterInputs({...converterInputs, value: e.target.value})}
                     />
                     <Select
                       value={converterInputs.fromUnit}
                       onValueChange={(value) => setConverterInputs({...converterInputs, fromUnit: value})}
                     >
                       <SelectTrigger>
                         <SelectValue placeholder="From" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="mg-dl">mg/dL</SelectItem>
                         <SelectItem value="mmol-l">mmol/L</SelectItem>
                         <SelectItem value="g-l">g/L</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                     <div className="text-center p-2 bg-muted rounded text-sm font-medium">
                       {converterResult || 'Result'}
                     </div>
                     <Select
                       value={converterInputs.toUnit}
                       onValueChange={(value) => setConverterInputs({...converterInputs, toUnit: value})}
                     >
                       <SelectTrigger>
                         <SelectValue placeholder="To" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="mg-dl">mg/dL</SelectItem>
                         <SelectItem value="mmol-l">mmol/L</SelectItem>
                         <SelectItem value="g-l">g/L</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   <Button
                     className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out"
                     onClick={convertUnits}
                   >
                     Convert
                   </Button>
                 </div>
               </CardContent>
             </Card>
           </div>

           {/* Data Analytics Dashboard */}
           <Card className="gradient-card shadow-lg">
             <CardHeader>
               <CardTitle className="flex items-center gap-3">
                 <BarChart3 className="h-5 w-5" />
                 <span className="gradient-text">Data Analytics Dashboard</span>
               </CardTitle>
               <CardDescription>Real-time insights and analytics from patient data</CardDescription>
             </CardHeader>
             <CardContent>
               <div className="grid gap-6 md:grid-cols-2">
                 {/* Age Distribution */}
                 <Card className="gradient-card">
                   <CardHeader className="pb-3">
                     <CardTitle className="text-base flex items-center gap-2">
                       <Users className="h-4 w-4" />
                       Patient Age Distribution
                     </CardTitle>
                   </CardHeader>
                   <CardContent>
                     <div className="h-48">
                       <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={
                           (() => {
                             const ageGroups = { '18-30': 0, '31-45': 0, '46-60': 0, '61-75': 0, '76+': 0 }
                             patientAnalyses.forEach(analysis => {
                               if (analysis.birth_date) {
                                 const age = new Date().getFullYear() - new Date(analysis.birth_date).getFullYear()
                                 if (age <= 30) ageGroups['18-30']++
                                 else if (age <= 45) ageGroups['31-45']++
                                 else if (age <= 60) ageGroups['46-60']++
                                 else if (age <= 75) ageGroups['61-75']++
                                 else ageGroups['76+']++
                               }
                             })
                             return Object.entries(ageGroups).map(([range, count]) => ({ range, count }))
                           })()
                        }>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                          <XAxis dataKey="range" stroke="#ccc" tickLine={{ stroke: '#ccc' }} style={{ fontSize: '12px', fill: '#666', fontWeight: 'bold' }} />
                          <YAxis stroke="#ccc" tickLine={{ stroke: '#ccc' }} style={{ fontSize: '12px', fill: '#666', fontWeight: 'bold' }} />
                          <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: '#fff' }} labelStyle={{ fontWeight: 'bold', color: '#333' }} itemStyle={{ color: '#555' }} />
                          <Bar dataKey="count" fill="#4299e1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                       </ResponsiveContainer>
                     </div>
                   </CardContent>
                 </Card>

                 {/* Diagnosis Confidence Distribution */}
                 <Card className="gradient-card">
                   <CardHeader className="pb-3">
                     <CardTitle className="text-base flex items-center gap-2">
                       <Activity className="h-4 w-4" />
                       Diagnosis Confidence Levels
                     </CardTitle>
                   </CardHeader>
                   <CardContent>
                     <div className="h-48">
                       <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={
                           (() => {
                             const confidenceGroups = { '90-100%': 0, '80-89%': 0, '70-79%': 0, '60-69%': 0, '<60%': 0 }
                             patientAnalyses.forEach(analysis => {
                               if (analysis.confidence >= 90) confidenceGroups['90-100%']++
                               else if (analysis.confidence >= 80) confidenceGroups['80-89%']++
                               else if (analysis.confidence >= 70) confidenceGroups['70-79%']++
                               else if (analysis.confidence >= 60) confidenceGroups['60-69%']++
                               else confidenceGroups['<60%']++
                             })
                             return Object.entries(confidenceGroups).map(([range, count]) => ({ range, count }))
                           })()
                        }>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                          <XAxis dataKey="range" stroke="#ccc" tickLine={{ stroke: '#ccc' }} style={{ fontSize: '12px', fill: '#666', fontWeight: 'bold' }} />
                          <YAxis stroke="#ccc" tickLine={{ stroke: '#ccc' }} style={{ fontSize: '12px', fill: '#666', fontWeight: 'bold' }} />
                          <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: '#fff' }} labelStyle={{ fontWeight: 'bold', color: '#333' }} itemStyle={{ color: '#555' }} />
                          <Bar dataKey="count" fill="#48bb78" radius={[4, 4, 0, 0]} />
                        </BarChart>
                       </ResponsiveContainer>
                     </div>
                   </CardContent>
                 </Card>

                 {/* Appointment Types */}
                 <Card className="gradient-card">
                   <CardHeader className="pb-3">
                     <CardTitle className="text-base flex items-center gap-2">
                       <CalendarIcon className="h-4 w-4" />
                       Appointment Types Distribution
                     </CardTitle>
                   </CardHeader>
                   <CardContent>
                     <div className="h-48">
                       <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={
                           (() => {
                             const typeCount: { [key: string]: number } = {}
                             upcomingAppointments.forEach(apt => {
                               typeCount[apt.type] = (typeCount[apt.type] || 0) + 1
                             })
                             return Object.entries(typeCount).map(([type, count]) => ({ type, count }))
                           })()
                        }>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                          <XAxis dataKey="type" height={40} stroke="#ccc" tickLine={{ stroke: '#ccc' }} style={{ fontSize: '12px', fill: '#333', fontWeight: 'bold' }} />
                          <YAxis stroke="#ccc" tickLine={{ stroke: '#ccc' }} style={{ fontSize: '12px', fill: '#666', fontWeight: 'bold' }} />
                          <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: '#fff' }} labelStyle={{ fontWeight: 'bold', color: '#333' }} itemStyle={{ color: '#555' }} />
                          <Bar dataKey="count" fill="#ed8936" radius={[4, 4, 0, 0]} />
                        </BarChart>
                       </ResponsiveContainer>
                     </div>
                   </CardContent>
                 </Card>

                 {/* Case Status Distribution */}
                 <Card className="gradient-card">
                   <CardHeader className="pb-3">
                     <CardTitle className="text-base flex items-center gap-2">
                       <TrendingUp className="h-4 w-4" />
                       Active Cases Status
                     </CardTitle>
                   </CardHeader>
                   <CardContent>
                     <div className="h-48">
                       <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={
                           (() => {
                             const statusCount: { [key: string]: number } = { active: 0, critical: 0, recovery: 0, pending_review: 0, finished: 0 }
                              activeCases.forEach(case_ => {
                                statusCount[case_.status]++
                              })
                              return Object.entries(statusCount).map(([status, count]) => ({
                                status: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                                count
                              }))
                            })()
                         }>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                           <XAxis dataKey="status" height={40} stroke="#ccc" tickLine={{ stroke: '#ccc' }} style={{ fontSize: '12px', fill: '#333', fontWeight: 'bold' }} />
                           <YAxis stroke="#ccc" tickLine={{ stroke: '#ccc' }} style={{ fontSize: '12px', fill: '#666', fontWeight: 'bold' }} />
                           <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: '#fff' }} labelStyle={{ fontWeight: 'bold', color: '#333' }} itemStyle={{ color: '#555' }} />
                           <Bar dataKey="count" fill="#667eea" radius={[4, 4, 0, 0]} />
                         </BarChart>
                       </ResponsiveContainer>
                     </div>
                   </CardContent>
                 </Card>
               </div>
             </CardContent>
           </Card>
         </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="gradient-card shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <PieChart className="h-5 w-5" />
                  <span className="gradient-text">Department Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={departmentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="patients"
                      >
                        {departmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="gradient-card shadow-lg">
              <CardHeader>
                <CardTitle className="gradient-text">Department Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departmentData.map((dept, index) => (
                    <div key={dept.name} className="flex items-center justify-between p-3 rounded-xl gradient-card">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{dept.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{dept.patients}</div>
                        <div className="text-sm text-muted-foreground">{dept.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ongoing-cases" className="space-y-6">
            {/* Active Cases */}
            <Card className="gradient-card shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Stethoscope className="h-5 w-5" />
                  <span className="gradient-text">Active Cases</span>
                </CardTitle>
                <CardDescription>Real-time patient cases from analysis data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-muted-foreground">
                    {activeCases.length} active cases
                  </div>
                  <Select value={casesFilter} onValueChange={setCasesFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cases</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="recovery">Recovery</SelectItem>
                      <SelectItem value="pending_review">Pending Review</SelectItem>
                      <SelectItem value="finished">Finished</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className={activeCases.length > 2 ? "overflow-y-auto max-h-[400px] pr-2" : ""}>
                  <div className="space-y-3">
                    {activeCases
                      .filter(c => casesFilter === 'all' || c.status === casesFilter)
                      .map((case_) => (
                        <div key={case_.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-200 hover:border-gray-300">
                           {/* Header with patient info and actions */}
                           <div className="flex items-center justify-between mb-3">
                             <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                                 {case_.profilePicture ? (
                                   <img
                                     src={case_.profilePicture}
                                     alt={`${case_.patientName} profile`}
                                     className="w-10 h-10 rounded-full object-cover"
                                   />
                                 ) : (
                                   case_.patientName[0].toUpperCase()
                                 )}
                               </div>
                               <div className="min-w-0 flex-1">
                                 <h3 className="font-semibold text-gray-900 text-base truncate">{case_.patientName}</h3>
                                 <p className="text-sm text-gray-600 truncate">{case_.diagnosis}</p>
                                 <p className="text-xs text-gray-500">ID: {case_.patientId}</p>
                               </div>
                             </div>
                             <div className="flex gap-1 ml-2">
                               <Button
                                 size="sm"
                                 variant="outline"
                                 className="text-blue-600 border-blue-200 hover:bg-blue-50 h-8 px-2"
                                 onClick={() => viewCaseDetails(case_)}
                               >
                                 <Eye className="h-3 w-3" />
                               </Button>
                               {case_.status !== 'finished' && (
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   className="text-green-600 border-green-200 hover:bg-green-50 h-8 px-2"
                                   onClick={() => updateCaseProgress(case_)}
                                 >
                                   <Edit className="h-3 w-3" />
                                 </Button>
                               )}
                               <Button
                                 size="sm"
                                 variant="outline"
                                 className="text-red-600 border-red-200 hover:bg-red-50 h-8 px-2"
                                 onClick={() => deleteCase(case_.id)}
                               >
                                 <Trash2 className="h-3 w-3" />
                               </Button>
                             </div>
                           </div>

                          {/* Case details in compact grid */}
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div className="flex items-start gap-2">
                              <Activity className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="text-xs font-medium text-gray-700">Status</div>
                                <Badge variant="outline" className={`text-xs px-2 py-0.5 mt-1 ${
                                  case_.status === 'critical' ? 'border-red-200 text-red-800 bg-red-50' :
                                  case_.status === 'active' ? 'border-blue-200 text-blue-800 bg-blue-50' :
                                  case_.status === 'recovery' ? 'border-green-200 text-green-800 bg-green-50' :
                                  case_.status === 'finished' ? 'border-purple-200 text-purple-800 bg-purple-50' :
                                  'border-yellow-200 text-yellow-800 bg-yellow-50'
                                }`}>
                                  {case_.status.replace('_', ' ')}
                                </Badge>
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <TrendingUp className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="text-xs font-medium text-gray-700">Progress</div>
                                <div className="text-sm text-gray-900 mt-1">{Math.round(case_.treatmentProgress)}%</div>
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <CalendarIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="text-xs font-medium text-gray-700">Last Update</div>
                                <div className="text-sm text-gray-900">{case_.lastUpdate.toLocaleDateString()}</div>
                                <div className="text-xs text-gray-600">{case_.lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <Users className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0">
                                <div className="text-xs font-medium text-gray-700">Doctor/Department</div>
                                <div className="text-sm text-gray-900 truncate">
                                  {case_.assignedDoctor} {case_.department ? ` / ${case_.department}` : ''}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Alerts section */}
                          {case_.alerts.length > 0 && (
                            <div className="pt-3 border-t border-gray-100">
                              <div className="bg-red-50 rounded-md p-3 border border-red-100">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-semibold text-red-700 mb-1">Alerts</div>
                                    <div className="space-y-1">
                                      {case_.alerts.map((alert, index) => (
                                        <div key={index} className="text-sm text-red-700 leading-tight">{alert}</div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
  
                          {/* Notes section - similar to Appointments */}
                          {case_.notes && (
                            <div className="pt-3 border-t border-gray-100">
                              <div className="bg-blue-50 rounded-md p-3 border border-blue-100">
                                <div className="flex items-start gap-2">
                                  <FileText className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-semibold text-blue-700 mb-1">Notes</div>
                                    <div className="text-sm text-gray-700 leading-relaxed">{case_.notes}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    {activeCases.length === 0 && (
                      <div className="text-center py-8">
                        <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No active cases found</p>
                        <p className="text-sm text-muted-foreground/60 mt-2">
                          Active cases will appear here when patients have analysis data
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Appointments */}
            <Card className="gradient-card shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <CalendarIcon className="h-5 w-5" />
                  <span className="gradient-text">Upcoming Appointments</span>
                </CardTitle>
                <CardDescription>Scheduled appointments and consultations linked to patient records</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPatients && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading patient data...</span>
                  </div>
                )}
                {!isLoadingPatients && (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-sm text-muted-foreground">
                        {filteredAppointments.length} upcoming appointments
                      </div>
                      <div className="flex gap-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search by patient name, ID, or type..."
                            value={appointmentSearchTerm}
                            onChange={(e) => setAppointmentSearchTerm(e.target.value)}
                            className="pl-10 w-64"
                          />
                        </div>
                        <Button onClick={() => setIsAppointmentDialogOpen(true)} className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white rounded-xl">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          Add Appointment
                        </Button>
                      </div>
                    </div>
                    <div className={filteredAppointments.length > 2 ? "overflow-y-auto max-h-[400px] pr-2 space-y-4" : "space-y-4"}>
                      {filteredAppointments.map((appointment) => {
                        const patient = patients.find(p => p.patient_id === appointment.patientId)
                        return (
                          <div key={appointment.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-200 hover:border-gray-300">
                            {/* Compact header with patient info and actions */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                                  {(() => {
                                    const patient = patients.find(p => p.patient_id === appointment.patientId)
                                    return patient?.profile_picture ? (
                                      <img
                                        src={patient.profile_picture}
                                        alt={`${appointment.patientName} profile`}
                                        className="w-10 h-10 rounded-full object-cover"
                                      />
                                    ) : (
                                      appointment.patientName[0].toUpperCase()
                                    )
                                  })()}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-semibold text-gray-900 text-base truncate">{appointment.patientName}</h3>
                                  <p className="text-sm text-gray-600 truncate">{appointment.type}</p>
                                  <p className="text-xs text-gray-500">ID: {appointment.patientId}</p>
                                </div>
                              </div>
                              <div className="flex gap-1 ml-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50 h-8 px-2"
                                  onClick={() => rescheduleAppointment(appointment.id)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-200 hover:bg-red-50 h-8 px-2"
                                  onClick={() => cancelAppointment(appointment.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Compact appointment details grid */}
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div className="flex items-start gap-2">
                                <CalendarIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0">
                                  <div className="text-xs font-medium text-gray-700">Date & Time</div>
                                  <div className="text-sm text-gray-900 font-medium">{appointment.dateTime.toLocaleDateString()}</div>
                                  <div className="text-xs text-gray-600">
                                    {appointment.dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                <Activity className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0">
                                  <div className="text-xs font-medium text-gray-700">Status</div>
                                  <Badge variant="outline" className={`text-xs px-2 py-0.5 mt-1 ${
                                    appointment.status === 'confirmed' ? 'border-green-200 text-green-800 bg-green-50' :
                                    appointment.status === 'scheduled' ? 'border-blue-200 text-blue-800 bg-blue-50' :
                                    'border-red-200 text-red-800 bg-red-50'
                                  }`}>
                                    {appointment.status}
                                  </Badge>
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                <Stethoscope className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0">
                                  <div className="text-xs font-medium text-gray-700">Duration</div>
                                  <div className="text-sm text-gray-900">{appointment.duration} min</div>
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0">
                                  <div className="text-xs font-medium text-gray-700">Location</div>
                                  <div className="text-sm text-gray-900 truncate">{appointment.location || 'Not specified'}</div>
                                </div>
                              </div>
                            </div>

                            {/* Enhanced notes section */}
                            {appointment.notes && (
                              <div className="pt-3 border-t border-gray-100">
                                <div className="bg-blue-50 rounded-md p-3 border border-blue-100">
                                  <div className="flex items-start gap-2">
                                    <FileText className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-semibold text-blue-700 mb-1">Notes</div>
                                      <div className="text-sm text-gray-700 leading-relaxed">{appointment.notes}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                      {filteredAppointments.length === 0 && (
                        <div className="text-center py-8">
                          <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            {appointmentSearchTerm.trim() ? 'No appointments match your search' : 'No upcoming appointments'}
                          </p>
                          {!appointmentSearchTerm.trim() && (
                            <p className="text-sm text-muted-foreground/60 mt-2">
                              Click "Add Appointment" to schedule your first appointment
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Pending Tasks */}
            <Card className="gradient-card shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="gradient-text">Pending Tasks</span>
                </CardTitle>
                <CardDescription>Manage tasks and follow-ups for patient cases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-muted-foreground">
                    {pendingTasks.filter(t => !t.completed).length} pending tasks
                  </div>
                  <Button onClick={() => setIsTaskDialogOpen(true)} className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white rounded-xl">
                    <Edit className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </div>
                <div className="space-y-3">
                  {pendingTasks.map((task) => (
                    <div key={task.id} className={`p-4 border rounded-lg ${task.completed ? 'bg-green-50 border-green-200' : 'bg-white border-border'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => toggleTaskCompletion(task.id)}
                            className="w-4 h-4"
                          />
                          <div className={`flex-1 ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                            <h4 className="font-semibold">{task.title}</h4>
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                            {task.patientName && (
                              <p className="text-xs text-blue-600">Patient: {task.patientName}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={
                            task.priority === 'high' ? 'border-red-200 text-red-800' :
                            task.priority === 'medium' ? 'border-yellow-200 text-yellow-800' :
                            'border-green-200 text-green-800'
                          }>
                            {task.priority.toUpperCase()}
                          </Badge>
                          <div className="text-right text-xs text-muted-foreground">
                            <div>Due: {task.dueDate.toLocaleDateString()}</div>
                            <div>{task.dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => editTask(task)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteTask(task.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {pendingTasks.length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <p className="text-muted-foreground">No pending tasks</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
         </TabsContent>
      </Tabs>

      {/* Edit Analysis Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Analysis & Patient Information
            </DialogTitle>
            <DialogDescription>
              Update patient information and analysis details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Patient Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Patient Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-patient-name">Patient Name *</Label>
                  <Input
                    id="edit-patient-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    placeholder="Enter patient full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-patient-id">Patient ID *</Label>
                  <Input
                    id="edit-patient-id"
                    value={editForm.patientId}
                    onChange={(e) => setEditForm({...editForm, patientId: e.target.value})}
                    placeholder="P-2024-XXX"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-birth-date">Birth Date</Label>
                  <Input
                    id="edit-birth-date"
                    type="date"
                    value={editForm.birthDate}
                    onChange={(e) => setEditForm({...editForm, birthDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    placeholder="patient@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone Number</Label>
                  <Input
                    id="edit-phone"
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-profile-picture">Profile Picture</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="edit-profile-picture"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file) {
                        // Create preview URL for the selected file
                        const previewUrl = URL.createObjectURL(file);
                        setEditForm({...editForm, profilePicture: file, profilePictureUrl: previewUrl});
                      } else {
                        setEditForm({...editForm, profilePicture: null});
                      }
                    }}
                    className="flex-1"
                  />
                  {editForm.profilePictureUrl && (
                    <img
                      src={editForm.profilePictureUrl}
                      alt="Profile preview"
                      className="w-12 h-12 rounded-full object-cover border-2 border-primary"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Analysis Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Analysis Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-analysis-date">Analysis Date</Label>
                  <Input
                    id="edit-analysis-date"
                    type="date"
                    value={editForm.analysisDate}
                    onChange={(e) => setEditForm({...editForm, analysisDate: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-analysis-time">Analysis Time</Label>
                  <Input
                    id="edit-analysis-time"
                    type="time"
                    value={editForm.analysisTime}
                    onChange={(e) => setEditForm({...editForm, analysisTime: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-confidence">Confidence (%)</Label>
                  <Input
                    id="edit-confidence"
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.confidence}
                    onChange={(e) => setEditForm({...editForm, confidence: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-diagnosis">Diagnosis</Label>
                <Input
                  id="edit-diagnosis"
                  value={editForm.diagnosis}
                  onChange={(e) => setEditForm({...editForm, diagnosis: e.target.value})}
                  placeholder="Medical diagnosis"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-advice">Medical Advice</Label>
                <Textarea
                  id="edit-advice"
                  value={editForm.advice}
                  onChange={(e) => setEditForm({...editForm, advice: e.target.value})}
                  placeholder="Medical advice and recommendations..."
                  rows={3}
                />
              </div>

            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateAnalysis}
              className="gradient-primary"
            >
              Update Analysis
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Medical Report Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Comprehensive Medical Report
            </DialogTitle>
            <DialogDescription>
              Detailed analysis and interpretation for {selectedAnalysisForReport?.patient_name}
            </DialogDescription>
          </DialogHeader>

          {selectedAnalysisForReport && (
            <div id="medical-report" className="space-y-6 p-4 bg-white rounded-lg">
              {/* Report Header */}
              <div className="text-center border-b pb-4">
                <h1 className="text-2xl font-bold text-gray-900">Medical Laboratory Report</h1>
                <p className="text-gray-600 mt-1">Liver Function Analysis</p>
                <p className="text-sm text-gray-500 mt-2">Report Date: {new Date().toLocaleDateString()}</p>
              </div>

              {/* Patient Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-3">Patient Information</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Patient Name:</strong> {selectedAnalysisForReport.patient_name}</div>
                  <div><strong>Patient ID:</strong> {selectedAnalysisForReport.patient_id_display}</div>
                  <div><strong>Report ID:</strong> {selectedAnalysisForReport.id}</div>
                  <div><strong>Analysis Date:</strong> {new Date(selectedAnalysisForReport.created_at).toLocaleDateString()}</div>
                  <div><strong>Confidence Level:</strong> {selectedAnalysisForReport.confidence}%</div>
                  {selectedAnalysisForReport.birth_date && (
                    <div><strong>Birth Date:</strong> {new Date(selectedAnalysisForReport.birth_date).toLocaleDateString()}</div>
                  )}
                </div>
                {(selectedAnalysisForReport.email || selectedAnalysisForReport.phone) && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {selectedAnalysisForReport.email && (
                        <div><strong>Email:</strong> {selectedAnalysisForReport.email}</div>
                      )}
                      {selectedAnalysisForReport.phone && (
                        <div><strong>Phone:</strong> {selectedAnalysisForReport.phone}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Test Results */}
              <div>
                <h2 className="text-lg font-semibold mb-3">Test Results & Interpretation</h2>
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 text-left">Test</th>
                      <th className="border border-gray-300 p-2 text-center">Result</th>
                      <th className="border border-gray-300 p-2 text-center">Normal Range</th>
                      <th className="border border-gray-300 p-2 text-left">Interpretation</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-2 font-medium">ALT (SGPT)</td>
                      <td className="border border-gray-300 p-2 text-center">50 IU/L</td>
                      <td className="border border-gray-300 p-2 text-center">7-56 IU/L</td>
                      <td className="border border-gray-300 p-2">Elevated levels indicate liver cell damage</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 p-2 font-medium">AST (SGOT)</td>
                      <td className="border border-gray-300 p-2 text-center">20 IU/L</td>
                      <td className="border border-gray-300 p-2 text-center">10-40 IU/L</td>
                      <td className="border border-gray-300 p-2">Marker for liver inflammation</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2 font-medium">ALP</td>
                      <td className="border border-gray-300 p-2 text-center">80 IU/L</td>
                      <td className="border border-gray-300 p-2 text-center">44-147 IU/L</td>
                      <td className="border border-gray-300 p-2">Elevated in liver/bone diseases</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 p-2 font-medium">GGT</td>
                      <td className="border border-gray-300 p-2 text-center">50 IU/L</td>
                      <td className="border border-gray-300 p-2 text-center">9-48 IU/L</td>
                      <td className="border border-gray-300 p-2">Sensitive marker for liver damage</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2 font-medium">Total Bilirubin</td>
                      <td className="border border-gray-300 p-2 text-center">1.2 mg/dL</td>
                      <td className="border border-gray-300 p-2 text-center">0.3-1.2 mg/dL</td>
                      <td className="border border-gray-300 p-2">Elevated in liver dysfunction</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 p-2 font-medium">Albumin</td>
                      <td className="border border-gray-300 p-2 text-center">6 g/dL</td>
                      <td className="border border-gray-300 p-2 text-center">3.5-5.0 g/dL</td>
                      <td className="border border-gray-300 p-2">Protein synthesized by liver</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* AI Diagnosis */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-3 text-blue-900">AI-Powered Diagnosis</h2>
                <div className="space-y-2">
                  <p className="font-medium text-blue-800">{expandDiagnosis(selectedAnalysisForReport.diagnosis)}</p>
                  <p className="text-sm text-blue-700">Confidence Level: {selectedAnalysisForReport.confidence}%</p>
                  <p className="text-sm text-blue-600 mt-2">
                    This diagnosis is based on pattern recognition from extensive medical databases and should be confirmed by a qualified healthcare professional.
                  </p>
                </div>
              </div>

              {/* Medical Interpretation */}
              <div>
                <h2 className="text-lg font-semibold mb-3">Clinical Interpretation</h2>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm leading-relaxed text-gray-800">
                    {selectedAnalysisForReport.advice}
                  </p>
                  <div className="mt-3 text-sm">
                    <strong>Key Considerations:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1 text-gray-700">
                      <li>Results should be interpreted in clinical context with patient history</li>
                      <li>Further testing may be required for definitive diagnosis</li>
                      <li>Regular monitoring is essential for chronic liver conditions</li>
                      <li>Lifestyle modifications may improve liver function</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h2 className="text-lg font-semibold mb-3">Treatment Recommendations</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-green-800 mb-2">Immediate Actions</h3>
                    <ul className="text-sm space-y-1 text-green-700">
                      <li>• Consult hepatologist within 1-2 weeks</li>
                      <li>• Avoid alcohol and hepatotoxic medications</li>
                      <li>• Maintain adequate hydration</li>
                      <li>• Follow balanced diet rich in antioxidants</li>
                    </ul>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-medium text-purple-800 mb-2">Follow-up Tests</h3>
                    <ul className="text-sm space-y-1 text-purple-700">
                      <li>• Repeat LFTs in 2-4 weeks</li>
                      <li>• Viral hepatitis screening (HCV, HBV)</li>
                      <li>• Abdominal ultrasound if indicated</li>
                      <li>• Consider liver biopsy if necessary</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* References */}
              <div className="border-t pt-4">
                <h2 className="text-lg font-semibold mb-3">Medical References</h2>
                <div className="text-sm space-y-1 text-gray-600">
                  <p><strong>AASLD Guidelines:</strong> American Association for the Study of Liver Diseases</p>
                  <p><strong>WHO Standards:</strong> World Health Organization diagnostic criteria</p>
                  <p><strong>PubMed References:</strong> Latest research on liver function interpretation</p>
                  <p><strong>Clinical Chemistry:</strong> Standard laboratory reference ranges</p>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-xs text-gray-500 border-t pt-4">
                <p>This report is generated by AI analysis and should not replace professional medical advice.</p>
                <p>Please consult with a qualified healthcare provider for interpretation and treatment decisions.</p>
              </div>
            </div>
          )}

          <Separator className="my-4" />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button onClick={async () => {
              if (!selectedAnalysisForReport) return

              try {
                const pdf = new jsPDF('p', 'mm', 'a4')
                const pageWidth = pdf.internal.pageSize.getWidth()
                const margin = 20
                let yPosition = margin

                // Add title
                pdf.setFontSize(20)
                pdf.text('Medical Report', margin, yPosition)
                yPosition += 15

                // Add patient info
                pdf.setFontSize(14)
                pdf.text('Patient Information:', margin, yPosition)
                yPosition += 10

                pdf.setFontSize(12)
                pdf.text(`Name: ${selectedAnalysisForReport.patient_name}`, margin, yPosition)
                yPosition += 8
                pdf.text(`ID: ${selectedAnalysisForReport.patient_id_display}`, margin, yPosition)
                yPosition += 8
                pdf.text(`Diagnosis: ${expandDiagnosis(selectedAnalysisForReport.diagnosis)}`, margin, yPosition)
                yPosition += 8
                pdf.text(`Confidence: ${selectedAnalysisForReport.confidence}%`, margin, yPosition)
                yPosition += 8
                pdf.text(`Advice: ${selectedAnalysisForReport.advice}`, margin, yPosition, { maxWidth: pageWidth - 2 * margin })

                pdf.save(`medical-report-${selectedAnalysisForReport.patient_name}-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
                toast.success('Medical report PDF exported successfully')
              } catch (error) {
                console.error('Error generating PDF:', error)
                toast.error('Failed to export PDF')
              }
            }}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Medical References Modal */}
      <Dialog open={isReferenceModalOpen} onOpenChange={setIsReferenceModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedReference === 'lab-values' && '📚 Normal Laboratory Values Reference'}
              {selectedReference === 'drug-dosage' && '💊 Drug Dosage Guidelines'}
              {selectedReference === 'vital-signs' && '🩺 Vital Signs Reference'}
              {selectedReference === 'abbreviations' && '🏥 Medical Abbreviations'}
            </DialogTitle>
            <DialogDescription>
              Educational reference guide for healthcare professionals
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {selectedReference === 'lab-values' && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">Common Laboratory Reference Ranges</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 text-sm">
                      <thead>
                        <tr className="bg-blue-100">
                          <th className="border border-gray-300 p-2 text-left">Test</th>
                          <th className="border border-gray-300 p-2 text-center">Reference Range</th>
                          <th className="border border-gray-300 p-2 text-left">Units</th>
                          <th className="border border-gray-300 p-2 text-left">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 p-2 font-medium">Glucose (Fasting)</td>
                          <td className="border border-gray-300 p-2 text-center">70-100</td>
                          <td className="border border-gray-300 p-2">mg/dL</td>
                          <td className="border border-gray-300 p-2">Diabetes screening</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="border border-gray-300 p-2 font-medium">Hemoglobin</td>
                          <td className="border border-gray-300 p-2 text-center">12-16 (F), 14-18 (M)</td>
                          <td className="border border-gray-300 p-2">g/dL</td>
                          <td className="border border-gray-300 p-2">Anemia assessment</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2 font-medium">Creatinine</td>
                          <td className="border border-gray-300 p-2 text-center">0.6-1.2 (F), 0.9-1.4 (M)</td>
                          <td className="border border-gray-300 p-2">mg/dL</td>
                          <td className="border border-gray-300 p-2">Kidney function</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="border border-gray-300 p-2 font-medium">ALT (SGPT)</td>
                          <td className="border border-gray-300 p-2 text-center">7-56</td>
                          <td className="border border-gray-300 p-2">IU/L</td>
                          <td className="border border-gray-300 p-2">Liver function</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2 font-medium">Total Cholesterol</td>
                          <td className="border border-gray-300 p-2 text-center">{`<`} 200</td>
                          <td className="border border-gray-300 p-2">mg/dL</td>
                          <td className="border border-gray-300 p-2">Cardiovascular risk</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 text-sm text-blue-700">
                    <strong>Note:</strong> Reference ranges may vary by laboratory and patient demographics. Always consult with local laboratory standards and clinical context.
                  </div>
                </div>
              </div>
            )}

            {selectedReference === 'drug-dosage' && (
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900 mb-3">Common Drug Dosage Guidelines</h3>
                  <div className="space-y-4">
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-semibold text-green-800">Acetaminophen (Tylenol)</h4>
                      <ul className="text-sm text-green-700 mt-1 space-y-1">
                        <li>• Adults: 325-650 mg every 4-6 hours (max 3g/day)</li>
                        <li>• Children: 10-15 mg/kg every 4-6 hours</li>
                        <li>• Maximum daily dose: 75 mg/kg or 3g (whichever is less)</li>
                      </ul>
                    </div>
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-semibold text-green-800">Ibuprofen (Advil/Motrin)</h4>
                      <ul className="text-sm text-green-700 mt-1 space-y-1">
                        <li>• Adults: 200-400 mg every 4-6 hours (max 1.2g/day)</li>
                        <li>• Children: 5-10 mg/kg every 6-8 hours</li>
                        <li>• Maximum daily dose: 40 mg/kg</li>
                      </ul>
                    </div>
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-semibold text-green-800">Amoxicillin</h4>
                      <ul className="text-sm text-green-700 mt-1 space-y-1">
                        <li>• Adults: 500 mg every 8 hours or 875 mg every 12 hours</li>
                        <li>• Children: 20-40 mg/kg/day divided every 8 hours</li>
                        <li>• Duration: 7-10 days for most infections</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-yellow-100 rounded text-sm text-yellow-800">
                    <strong>⚠️ Important:</strong> Dosages should be adjusted for renal/hepatic impairment, age, and weight. Always double-check calculations and consult drug references for contraindications.
                  </div>
                </div>
              </div>
            )}

            {selectedReference === 'vital-signs' && (
              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-red-900 mb-3">Vital Signs Reference Ranges</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-red-800 mb-2">Blood Pressure</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Normal:</span>
                          <span className="font-medium">&lt; 120/80 mmHg</span>

                        </div>
                        <div className="flex justify-between">
                          <span>Elevated:</span>
                          <span className="font-medium">120-129/{`<`}80 mmHg</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Stage 1 Hypertension:</span>
                          <span className="font-medium">130-139/80-89 mmHg</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Stage 2 Hypertension:</span>
                          <span className="font-medium">≥140/≥90 mmHg</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-red-800 mb-2">Heart Rate</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Adults (resting):</span>
                          <span className="font-medium">60-100 bpm</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Children 1-3 years:</span>
                          <span className="font-medium">90-150 bpm</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Infants:</span>
                          <span className="font-medium">100-160 bpm</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tachycardia:</span>
                          <span className="font-medium">&gt;100 bpm (adults)</span>

                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-red-800 mb-2">Respiratory Rate</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Adults:</span>
                          <span className="font-medium">12-20 breaths/min</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Children 1-5 years:</span>
                          <span className="font-medium">20-30 breaths/min</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Infants:</span>
                          <span className="font-medium">30-60 breaths/min</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-red-800 mb-2">Temperature</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Normal (oral):</span>
                          <span className="font-medium">36.5-37.5°C (97.7-99.5°F)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fever:</span>
                          <span className="font-medium">&gt;38.0°C (&gt;100.4°F)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Hypothermia:</span>
                          <span className="font-medium">&lt;35.0°C (&lt;95.0°F)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedReference === 'abbreviations' && (
              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-900 mb-3">Common Medical Abbreviations</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-purple-800 mb-2">Laboratory</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>CBC:</span>
                          <span className="font-medium">Complete Blood Count</span>
                        </div>
                        <div className="flex justify-between">
                          <span>BMP:</span>
                          <span className="font-medium">Basic Metabolic Panel</span>
                        </div>
                        <div className="flex justify-between">
                          <span>LFT:</span>
                          <span className="font-medium">Liver Function Test</span>
                        </div>
                        <div className="flex justify-between">
                          <span>LDL:</span>
                          <span className="font-medium">Low-Density Lipoprotein</span>
                        </div>
                        <div className="flex justify-between">
                          <span>HDL:</span>
                          <span className="font-medium">High-Density Lipoprotein</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-purple-800 mb-2">Clinical</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>BID:</span>
                          <span className="font-medium">Twice Daily</span>
                        </div>
                        <div className="flex justify-between">
                          <span>TID:</span>
                          <span className="font-medium">Three Times Daily</span>
                        </div>
                        <div className="flex justify-between">
                          <span>QID:</span>
                          <span className="font-medium">Four Times Daily</span>
                        </div>
                        <div className="flex justify-between">
                          <span>PRN:</span>
                          <span className="font-medium">As Needed</span>
                        </div>
                        <div className="flex justify-between">
                          <span>NPO:</span>
                          <span className="font-medium">Nothing by Mouth</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-purple-800 mb-2">Vital Signs</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>BP:</span>
                          <span className="font-medium">Blood Pressure</span>
                        </div>
                        <div className="flex justify-between">
                          <span>HR:</span>
                          <span className="font-medium">Heart Rate</span>
                        </div>
                        <div className="flex justify-between">
                          <span>RR:</span>
                          <span className="font-medium">Respiratory Rate</span>
                        </div>
                        <div className="flex justify-between">
                          <span>TEMP:</span>
                          <span className="font-medium">Temperature</span>
                        </div>
                        <div className="flex justify-between">
                          <span>O2 SAT:</span>
                          <span className="font-medium">Oxygen Saturation</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-purple-800 mb-2">Medical Conditions</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>MI:</span>
                          <span className="font-medium">Myocardial Infarction</span>
                        </div>
                        <div className="flex justify-between">
                          <span>CHF:</span>
                          <span className="font-medium">Congestive Heart Failure</span>
                        </div>
                        <div className="flex justify-between">
                          <span>COPD:</span>
                          <span className="font-medium">Chronic Obstructive Pulmonary Disease</span>
                        </div>
                        <div className="flex justify-between">
                          <span>DM:</span>
                          <span className="font-medium">Diabetes Mellitus</span>
                        </div>
                        <div className="flex justify-between">
                          <span>HTN:</span>
                          <span className="font-medium">Hypertension</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-100 rounded text-sm text-blue-800">
                    <strong>💡 Tip:</strong> Always write abbreviations in full first, then use the abbreviation in parentheses. Avoid non-standard abbreviations to prevent miscommunication.
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsReferenceModalOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Insight Details Modal */}
      <Dialog open={isInsightModalOpen} onOpenChange={setIsInsightModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              AI Insight Details
            </DialogTitle>
            <DialogDescription>
              Detailed analysis and recommendations for {selectedInsight?.patient}
            </DialogDescription>
          </DialogHeader>

          {selectedInsight && (
            <div className="space-y-6">
              {/* Risk Assessment */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-lg border border-red-200">
                <h3 className="font-semibold text-red-900 mb-2">Risk Assessment</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-red-700">Risk Level:</span>
                    <Badge variant="outline" className="ml-2 border-red-200 text-red-800">
                      {selectedInsight.riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-red-700">Probability:</span>
                    <span className="ml-2 font-bold">{selectedInsight.probability}%</span>
                  </div>
                </div>
              </div>

              {/* Contributing Factors */}
              <div>
                <h3 className="font-semibold mb-3">Contributing Factors</h3>
                <div className="space-y-2">
                  {selectedInsight.factors.map((factor: string, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">{factor}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Recommendations */}
              <div>
                <h3 className="font-semibold mb-3">AI Recommendations</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-1">Immediate Actions</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Schedule follow-up appointment within 7 days</li>
                      <li>• Order additional liver function tests</li>
                      <li>• Consider ultrasound imaging</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-1">Preventive Measures</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Lifestyle counseling (diet, exercise)</li>
                      <li>• Monitor medication compliance</li>
                      <li>• Regular health screenings</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Confidence Metrics */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">AI Confidence Metrics</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">87%</div>
                    <div className="text-sm text-muted-foreground">Model Accuracy</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">92%</div>
                    <div className="text-sm text-muted-foreground">Data Quality</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">95%</div>
                    <div className="text-sm text-muted-foreground">Prediction Stability</div>
                  </div>
                </div>
              </div>

              {/* User Feedback */}
              <div>
                <h3 className="font-semibold mb-3">Provide Feedback</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
                    onClick={() => toast.success('Thank you for confirming this insight!')}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Accurate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                    onClick={() => toast.success('Feedback noted for AI improvement')}
                  >
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Needs Review
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                    onClick={() => toast.success('Feedback submitted for model retraining')}
                  >
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Inaccurate
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Separator className="my-4" />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsInsightModalOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              toast.success('Report exported successfully')
              setIsInsightModalOpen(false)
            }}>
              <Download className="h-4 w-4 mr-2" />
              Export Details
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Task Dialog */}
      <Dialog open={isTaskDialogOpen || isEditTaskDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsTaskDialogOpen(false)
          setIsEditTaskDialogOpen(false)
          setEditingTask(null)
          setNewTask({
            title: '',
            description: '',
            priority: 'medium',
            dueDate: '',
            patientId: '',
            patientName: ''
          })
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              {isEditTaskDialogOpen ? 'Edit Task' : 'Add New Task'}
            </DialogTitle>
            <DialogDescription>
              {isEditTaskDialogOpen ? 'Update task details for patient case management' : 'Create a new task for patient case management'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Task Title *</Label>
                <Input
                  id="task-title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  placeholder="Enter task title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-priority">Priority</Label>
                <Select value={newTask.priority} onValueChange={(value: 'high' | 'medium' | 'low') => setNewTask({...newTask, priority: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                placeholder="Enter task description..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-patient">Patient *</Label>
              <Select value={newTask.patientId} onValueChange={(value) => {
                const patient = patients.find(p => p.patient_id === value)
                if (patient) {
                  setNewTask({...newTask, patientId: patient.patient_id, patientName: patient.name})
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingPatients ? (
                    <SelectItem value="" disabled>Loading patients...</SelectItem>
                  ) : patients.length === 0 ? (
                    <SelectItem value="" disabled>No patients available</SelectItem>
                  ) : (
                    patients
                      .filter(patient => patientAnalyses.some(analysis => analysis.patient_id === patient.id))
                      .map((patient) => (
                        <SelectItem key={patient.id} value={patient.patient_id}>
                          {patient.name} ({patient.patient_id})
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-due-date">Due Date & Time</Label>
              <Input
                id="task-due-date"
                type="datetime-local"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                required
              />
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsTaskDialogOpen(false)
                setNewTask({
                  title: '',
                  description: '',
                  priority: 'medium',
                  dueDate: '',
                  patientId: '',
                  patientName: ''
                })
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={isEditTaskDialogOpen ? updateTask : addTask}
              className="gradient-primary"
              disabled={!newTask.title.trim() || !newTask.dueDate}
            >
              {isEditTaskDialogOpen ? 'Update Task' : 'Add Task'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Appointment Dialog */}
      <Dialog open={isAppointmentDialogOpen} onOpenChange={setIsAppointmentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Schedule New Appointment
            </DialogTitle>
            <DialogDescription>
              Create a new appointment for a patient
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="appointment-patient">Patient *</Label>
                <Select value={newAppointment.patientId} onValueChange={handlePatientSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingPatients ? (
                      <SelectItem value="" disabled>Loading patients...</SelectItem>
                    ) : patients.length === 0 ? (
                      <SelectItem value="" disabled>No patients available</SelectItem>
                    ) : (
                      patients
                        .filter(patient => patientAnalyses.some(analysis => analysis.patient_id === patient.id))
                        .map((patient) => (
                          <SelectItem key={patient.id} value={patient.patient_id}>
                            {patient.name} ({patient.patient_id})
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="appointment-type">Appointment Type *</Label>
                <Select value={newAppointment.type} onValueChange={(value) => setNewAppointment({...newAppointment, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Consultation">Consultation</SelectItem>
                    <SelectItem value="Follow-up">Follow-up</SelectItem>
                    <SelectItem value="Check-up">Check-up</SelectItem>
                    <SelectItem value="Treatment">Treatment</SelectItem>
                    <SelectItem value="Surgery">Surgery</SelectItem>
                    <SelectItem value="Emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="appointment-datetime">Date & Time *</Label>
                <Input
                  id="appointment-datetime"
                  type="datetime-local"
                  value={newAppointment.dateTime}
                  onChange={(e) => setNewAppointment({...newAppointment, dateTime: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="appointment-duration">Duration (minutes)</Label>
                <Input
                  id="appointment-duration"
                  type="number"
                  min="15"
                  max="480"
                  step="15"
                  value={newAppointment.duration}
                  onChange={(e) => setNewAppointment({...newAppointment, duration: parseInt(e.target.value) || 30})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointment-location">Location</Label>
              <Input
                id="appointment-location"
                placeholder="Room number or location"
                value={newAppointment.location}
                onChange={(e) => setNewAppointment({...newAppointment, location: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointment-notes">Notes</Label>
              <Textarea
                id="appointment-notes"
                placeholder="Additional notes or special instructions..."
                value={newAppointment.notes}
                onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
                rows={3}
              />
            </div>

            {newAppointment.patientId && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Patient Details</h4>
                {(() => {
                  const patient = patients.find(p => p.patient_id === newAppointment.patientId)
                  return patient ? (
                    <div className="text-sm text-blue-800 space-y-1">
                      <div><strong>Name:</strong> {patient.name}</div>
                      <div><strong>ID:</strong> {patient.patient_id}</div>
                      {patient.email && <div><strong>Email:</strong> {patient.email}</div>}
                      {patient.phone && <div><strong>Phone:</strong> {patient.phone}</div>}
                      {patient.doctor_name && <div><strong>Doctor:</strong> {patient.doctor_name}</div>}
                      {patient.department && <div><strong>Department:</strong> {patient.department}</div>}
                    </div>
                  ) : null
                })()}
              </div>
            )}
          </div>

          <Separator className="my-4" />

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAppointmentDialogOpen(false)
                setNewAppointment({
                  patientId: "",
                  patientName: "",
                  dateTime: "",
                  type: "",
                  duration: 30,
                  location: "",
                  notes: ""
                })
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={addAppointment}
              className="gradient-primary"
              disabled={!newAppointment.patientId || !newAppointment.patientName || !newAppointment.dateTime || !newAppointment.type}
            >
              Schedule Appointment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reschedule Appointment Dialog */}
      <Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Reschedule Appointment
            </DialogTitle>
            <DialogDescription>
              Update the appointment details for {rescheduleAppointmentData?.patientName}
            </DialogDescription>
          </DialogHeader>

          {rescheduleAppointmentData && (
            <div className="space-y-6 py-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Patient Information</h4>
                <div className="text-sm text-blue-800">
                  <div><strong>Name:</strong> {rescheduleAppointmentData.patientName}</div>
                  <div><strong>ID:</strong> {rescheduleAppointmentData.patientId}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reschedule-type">Appointment Type</Label>
                  <Select
                    value={rescheduleAppointmentData.type}
                    onValueChange={(value) => setRescheduleAppointmentData({...rescheduleAppointmentData, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Consultation">Consultation</SelectItem>
                      <SelectItem value="Follow-up">Follow-up</SelectItem>
                      <SelectItem value="Check-up">Check-up</SelectItem>
                      <SelectItem value="Treatment">Treatment</SelectItem>
                      <SelectItem value="Surgery">Surgery</SelectItem>
                      <SelectItem value="Emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reschedule-duration">Duration (minutes)</Label>
                  <Input
                    id="reschedule-duration"
                    type="number"
                    min="15"
                    max="480"
                    step="15"
                    value={rescheduleAppointmentData.duration}
                    onChange={(e) => setRescheduleAppointmentData({...rescheduleAppointmentData, duration: parseInt(e.target.value) || 30})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reschedule-status">Status</Label>
                  <Select
                    value={rescheduleAppointmentData.status}
                    onValueChange={(value: 'scheduled' | 'confirmed' | 'cancelled') => setRescheduleAppointmentData({...rescheduleAppointmentData, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reschedule-datetime">New Date & Time *</Label>
                <Input
                  id="reschedule-datetime"
                  type="datetime-local"
                  value={rescheduleAppointmentData.dateTime}
                  onChange={(e) => setRescheduleAppointmentData({...rescheduleAppointmentData, dateTime: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reschedule-location">Location</Label>
                <Input
                  id="reschedule-location"
                  placeholder="Room number or location"
                  value={rescheduleAppointmentData.location}
                  onChange={(e) => setRescheduleAppointmentData({...rescheduleAppointmentData, location: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reschedule-notes">Notes</Label>
                <Textarea
                  id="reschedule-notes"
                  placeholder="Additional notes or special instructions..."
                  value={rescheduleAppointmentData.notes}
                  onChange={(e) => setRescheduleAppointmentData({...rescheduleAppointmentData, notes: e.target.value})}
                  rows={3}
                />
              </div>
            </div>
          )}

          <Separator className="my-4" />

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsRescheduleDialogOpen(false)
                setRescheduleAppointmentData(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={updateRescheduledAppointment}
              className="gradient-primary"
              disabled={!rescheduleAppointmentData?.dateTime || !rescheduleAppointmentData?.type}
            >
              Update Appointment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Case Details Dialog */}
      <Dialog open={isCaseDetailsDialogOpen} onOpenChange={setIsCaseDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Case Details - {selectedCase?.patientName}
            </DialogTitle>
            <DialogDescription>
              Comprehensive information about this patient's active case
            </DialogDescription>
          </DialogHeader>

          {selectedCase && (
            <div className="space-y-6 py-4">
              {/* Patient Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Patient Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Name:</strong> {selectedCase.patientName}</div>
                  <div><strong>ID:</strong> {selectedCase.patientId}</div>
                  <div><strong>Diagnosis:</strong> {selectedCase.diagnosis}</div>
                  <div><strong>Status:</strong>
                    <Badge variant="outline" className={`ml-2 ${
                      selectedCase.status === 'critical' ? 'border-red-200 text-red-800' :
                      selectedCase.status === 'active' ? 'border-blue-200 text-blue-800' :
                      selectedCase.status === 'recovery' ? 'border-green-200 text-green-800' :
                      'border-yellow-200 text-yellow-800'
                    }`}>
                      {selectedCase.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div><strong>Doctor:</strong> {selectedCase.assignedDoctor}</div>
                  <div><strong>Last Update:</strong> {selectedCase.lastUpdate.toLocaleString()}</div>
                </div>
              </div>

              {/* Treatment Progress */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Treatment Progress</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm font-bold">{Math.round(selectedCase.treatmentProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${selectedCase.treatmentProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Alerts */}
              {selectedCase.alerts.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Active Alerts</h3>
                  <div className="space-y-2">
                    {selectedCase.alerts.map((alert: string, index: number) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-red-800">{alert}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Appointment */}
              {selectedCase.nextAppointment && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Next Appointment</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-800">
                        {selectedCase.nextAppointment.toLocaleDateString()} at {selectedCase.nextAppointment.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes Section in Case Details */}
              {selectedCase?.notes && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Notes</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-gray-700 leading-relaxed">{selectedCase.notes}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <Separator className="my-4" />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCaseDetailsDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Progress Dialog */}
      <Dialog open={isUpdateProgressDialogOpen} onOpenChange={setIsUpdateProgressDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Update Case Information
            </DialogTitle>
            <DialogDescription>
              Update treatment progress, status, and assigned doctor for this patient case
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="case-status">Case Status</Label>
                <Select
                  value={progressUpdate.status}
                  onValueChange={(value: 'active' | 'critical' | 'recovery' | 'pending_review' | 'finished') =>
                    setProgressUpdate({...progressUpdate, status: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="recovery">Recovery</SelectItem>
                    <SelectItem value="pending_review">Pending Review</SelectItem>
                    <SelectItem value="finished">Finished</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigned-doctor">Assigned Doctor</Label>
                <Input
                  id="assigned-doctor"
                  placeholder="Dr. Full Name"
                  value={progressUpdate.doctor}
                  onChange={(e) => setProgressUpdate({...progressUpdate, doctor: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department-select">Department</Label>
                <Select
                  value={progressUpdate.department}
                  onValueChange={(value) => setProgressUpdate({...progressUpdate, department: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hepatology">Hepatology</SelectItem>
                    <SelectItem value="gastroenterology">Gastroenterology</SelectItem>
                    <SelectItem value="radiology">Radiology</SelectItem>
                    <SelectItem value="pathology">Pathology</SelectItem>
                    <SelectItem value="transplant-surgery">Transplant Surgery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="progress-slider">Treatment Progress (%)</Label>
              <div className="px-2">
                <input
                  id="progress-slider"
                  type="range"
                  min="0"
                  max="100"
                  value={progressUpdate.progress}
                  onChange={(e) => setProgressUpdate({...progressUpdate, progress: parseInt(e.target.value)})}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span className="font-bold text-lg">{progressUpdate.progress}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="progress-notes">Notes</Label>
                {progressUpdate.notes && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-red-500 hover:text-red-700"
                    onClick={() => setProgressUpdate({...progressUpdate, notes: ''})}
                  >
                    Clear Notes
                  </Button>
                )}
              </div>
              <Textarea
                id="progress-notes"
                placeholder="Add notes about this case update... (leave empty to remove existing notes)"
                value={progressUpdate.notes}
                onChange={(e) => setProgressUpdate({...progressUpdate, notes: e.target.value})}
                rows={3}
              />
              {progressUpdate.notes === '' && (
                <div className="text-xs text-muted-foreground">
                  Empty notes field will remove any existing notes from this case.
                </div>
              )}
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsUpdateProgressDialogOpen(false)
                setProgressUpdate({ caseId: '', progress: 0, status: 'active' as 'active' | 'critical' | 'recovery' | 'pending_review' | 'finished', doctor: '', department: '', notes: '' })
              }}
            >
              Cancel
            </Button>
            <Button onClick={saveProgressUpdate} className="gradient-primary">
              Update Case
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
