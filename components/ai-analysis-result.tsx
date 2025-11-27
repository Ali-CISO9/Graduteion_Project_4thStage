"use client"

import { Activity, AlertCircle, CheckCircle2, TrendingUp, Stethoscope, User, Save, Calendar, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAnalysis } from "@/lib/analysis-context"
import { useState, useEffect } from "react"
import { toast } from 'sonner'

export function AiAnalysisResult() {
  const { result, input, reset, resetAll } = useAnalysis()
  const [isPatientFormOpen, setIsPatientFormOpen] = useState(false)

  // Function to expand medical abbreviations
  const expandDiagnosis = (diagnosis: string) => {
    if (diagnosis.toUpperCase() === 'NAFLD') {
      return 'NAFLD (Non-Alcoholic Fatty Liver Disease)'
    }
    return diagnosis
  }
  const [patientInfo, setPatientInfo] = useState({
    name: '',
    patientId: '',
    birthDate: '',
    email: '',
    phone: '',
    profilePicture: null as File | null,
    profilePictureUrl: '',
    doctorName: '',
    department: '',
    analysisDate: new Date().toISOString().split('T')[0],
    analysisTime: new Date().toTimeString().split(' ')[0].substring(0, 5)
  })
  const [isSaving, setIsSaving] = useState(false)

  // Reset patient form when result changes (new analysis)
  useEffect(() => {
    if (result) {
      setPatientInfo({
        name: '',
        patientId: '',
        birthDate: '',
        email: '',
        phone: '',
        profilePicture: null,
        profilePictureUrl: '',
        doctorName: '',
        department: '',
        analysisDate: new Date().toISOString().split('T')[0],
        analysisTime: new Date().toTimeString().split(' ')[0].substring(0, 5)
      })
    }
  }, [result])


  const handleReset = () => {
    // Reset analysis context
    resetAll()

    // Show success message
    toast.success("Analysis Reset", {
      description: "All analysis results and inputs have been cleared. You can now start a new analysis."
    })
  }

  const handleSavePatientReport = async () => {
    if (!result) return

    // Validate required fields
    if (!patientInfo.name || !patientInfo.patientId) {
      toast.error("Patient Information Required", {
        description: "Please fill in at least the patient name and patient ID.",
      })
      return
    }

    setIsSaving(true)

    try {
      // Handle profile picture upload
      let profilePictureUrl = patientInfo.profilePictureUrl;
      if (patientInfo.profilePicture) {
        try {
          // Convert file to base64 for storage
          const reader = new FileReader();
          profilePictureUrl = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(patientInfo.profilePicture as Blob);
          });
          console.log('Profile picture converted to base64, length:', profilePictureUrl.length);
        } catch (error) {
          console.error('Error converting profile picture:', error);
          toast.error('Failed to process profile picture');
          return;
        }
      }

      // First, create or update patient
      const patientData = {
        name: patientInfo.name,
        birth_date: patientInfo.birthDate,
        patient_id: patientInfo.patientId,
        email: patientInfo.email,
        phone: patientInfo.phone,
        profile_picture: profilePictureUrl,
        department: patientInfo.department,
        doctor_name: patientInfo.doctorName,
      }

      // Create patient if doesn't exist
      const patientResponse = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData),
      })

      if (!patientResponse.ok) {
        const errorData = await patientResponse.json()
        throw new Error(errorData.error || 'Failed to save patient information')
      }

      const patientResult = await patientResponse.json()
      const patientId = patientResult.patient.id

      // Now save the analysis by re-running it with patient association
      // Include patient_id in the lab values to trigger saving in backend
      const analysisData = {
        ...input,
        patient_id: patientId,
      }

      const analysisResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisData),
      })

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json()
        throw new Error(errorData.error || 'Failed to save analysis')
      }

      toast.success("Patient Report Saved", {
        description: `Analysis for ${patientInfo.name} has been saved successfully.`,
      })

      setIsPatientFormOpen(false)

      // Reset form
      setPatientInfo({
        name: '',
        patientId: '',
        birthDate: '',
        email: '',
        phone: '',
        profilePicture: null,
        profilePictureUrl: '',
        doctorName: '',
        department: '',
        analysisDate: new Date().toISOString().split('T')[0],
        analysisTime: new Date().toTimeString().split(' ')[0].substring(0, 5)
      })

    } catch (error) {
      console.error('Save error:', error)
      toast.error("Save Failed", {
        description: error instanceof Error ? error.message : "Failed to save patient report.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!result) {
    return (
      <Card className="gradient-card shadow-lg animate-in fade-in-0 duration-500 hover-lift">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary animate-glow">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="gradient-text text-xl">AI Analysis Result</span>
          </CardTitle>
          <CardDescription className="text-muted-foreground/80">
            Upload an image or enter lab values to see analysis results
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32 md:h-40">
          <div className="text-center text-muted-foreground">
            <Stethoscope className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-2 opacity-50" />
            <p className="text-sm md:text-base">No analysis results yet</p>
            <p className="text-xs md:text-sm text-muted-foreground/60 mt-1">Upload an image or enter lab values to see results</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusIcon = (confidence: number) => {
    if (confidence >= 80) return <CheckCircle2 className="h-4 w-4 text-green-600" />
    if (confidence >= 60) return <AlertCircle className="h-4 w-4 text-yellow-600" />
    return <AlertCircle className="h-4 w-4 text-red-600" />
  }

  const getStatusColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-100 text-green-800 border-green-200"
    if (confidence >= 60) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-red-100 text-red-800 border-red-200"
  }

  return (
    <Card className="gradient-card shadow-lg animate-in fade-in-0 duration-500 hover-lift min-h-[400px] md:min-h-[500px]">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary animate-glow">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="gradient-text text-lg md:text-xl">AI Analysis Result</span>
        </CardTitle>
        <CardDescription className="text-muted-foreground/80 text-sm md:text-base">Latest analysis results</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl gradient-card p-3 md:p-4 animate-in slide-in-from-left-4 duration-300 hover-lift gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background/50" aria-hidden="true">
              {getStatusIcon(result.confidence)}
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm md:text-base">{expandDiagnosis(result.diagnosis)}</p>
              <p className="text-xs text-muted-foreground">Confidence: {result.confidence}%</p>
            </div>
          </div>
          <Badge variant="outline" className={`${getStatusColor(result.confidence)} font-semibold text-xs md:text-sm`}>
            {result.confidence}%
          </Badge>
        </div>

        <div className="mt-4 md:mt-6 rounded-xl gradient-card p-4 md:p-5 animate-in fade-in-0 duration-500 delay-500 hover-lift">
           <div className="flex items-start gap-3 md:gap-4">
             <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-xl gradient-primary animate-glow" aria-hidden="true">
               <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
             </div>
             <div className="flex-1">
               <p className="text-base md:text-lg font-semibold gradient-text mb-2">Medical Advice</p>
               <p className="text-sm leading-relaxed text-muted-foreground">
                 {result.advice}
               </p>
             </div>
           </div>
         </div>

         <div className="mt-4 md:mt-6 flex flex-col sm:flex-row gap-3 justify-center">
           <Button
             onClick={() => setIsPatientFormOpen(true)}
             className="gradient-primary hover-lift"
           >
             <User className="h-4 w-4 mr-2" />
             Link to Patient & Save
           </Button>

           <Button
             onClick={handleReset}
             variant="outline"
             className="gradient-card hover-lift border-red-200 hover:border-red-400 text-red-600 hover:text-red-700"
           >
             <div className="h-4 w-4 mr-2 rounded-full border-2 border-red-500 flex items-center justify-center">
               <div className="w-2 h-2 bg-red-500 rounded-full"></div>
             </div>
             Reset
           </Button>


           {/* Patient Information Form Dialog */}
           <Dialog open={isPatientFormOpen} onOpenChange={setIsPatientFormOpen}>
             <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
               <DialogHeader>
                 <DialogTitle className="flex items-center gap-2">
                   <User className="h-5 w-5" />
                   Link Analysis to Patient
                 </DialogTitle>
                 <DialogDescription>
                   Associate this AI analysis with a patient record and save to database
                 </DialogDescription>
               </DialogHeader>

               <div className="space-y-4 py-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="patient-name">Patient Name *</Label>
                     <Input
                       id="patient-name"
                       value={patientInfo.name}
                       onChange={(e) => setPatientInfo({...patientInfo, name: e.target.value})}
                       placeholder="Enter patient full name"
                       required
                     />
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="patient-id">Patient ID *</Label>
                     <Input
                       id="patient-id"
                       value={patientInfo.patientId}
                       onChange={(e) => setPatientInfo({...patientInfo, patientId: e.target.value})}
                       placeholder="P-2024-XXX"
                       required
                     />
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="birth-date">Birth Date</Label>
                     <Input
                       id="birth-date"
                       type="date"
                       value={patientInfo.birthDate}
                       onChange={(e) => setPatientInfo({...patientInfo, birthDate: e.target.value})}
                     />
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="email">Email</Label>
                     <Input
                       id="email"
                       type="email"
                       value={patientInfo.email}
                       onChange={(e) => setPatientInfo({...patientInfo, email: e.target.value})}
                       placeholder="patient@example.com"
                     />
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="phone">Phone Number</Label>
                     <Input
                       id="phone"
                       type="tel"
                       value={patientInfo.phone}
                       onChange={(e) => setPatientInfo({...patientInfo, phone: e.target.value})}
                       placeholder="+1 (555) 123-4567"
                     />
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="doctor-name">Doctor Name</Label>
                     <Input
                       id="doctor-name"
                       value={patientInfo.doctorName}
                       onChange={(e) => setPatientInfo({...patientInfo, doctorName: e.target.value})}
                       placeholder="Attending physician"
                     />
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="department">Department</Label>
                     <Select value={patientInfo.department} onValueChange={(value) => setPatientInfo({...patientInfo, department: value})}>
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

                   <div className="space-y-2">
                     <Label htmlFor="analysis-date">Analysis Date</Label>
                     <Input
                       id="analysis-date"
                       type="date"
                       value={patientInfo.analysisDate}
                       onChange={(e) => setPatientInfo({...patientInfo, analysisDate: e.target.value})}
                     />
                   </div>

                   <div className="space-y-2 md:col-span-2">
                     <Label htmlFor="profile-picture">Profile Picture</Label>
                     <div className="flex items-center gap-4">
                       <Input
                         id="profile-picture"
                         type="file"
                         accept="image/*"
                         onChange={(e) => {
                           const file = e.target.files?.[0] || null;
                           if (file) {
                             // Create preview URL for the selected file
                             const previewUrl = URL.createObjectURL(file);
                             setPatientInfo({...patientInfo, profilePicture: file, profilePictureUrl: previewUrl});
                           } else {
                             setPatientInfo({...patientInfo, profilePicture: null});
                           }
                         }}
                         className="flex-1"
                       />
                       {patientInfo.profilePictureUrl && (
                         <img
                           src={patientInfo.profilePictureUrl}
                           alt="Profile preview"
                           className="w-12 h-12 rounded-full object-cover border-2 border-primary"
                         />
                       )}
                     </div>
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="analysis-time">Analysis Time</Label>
                     <Input
                       id="analysis-time"
                       type="time"
                       value={patientInfo.analysisTime}
                       onChange={(e) => setPatientInfo({...patientInfo, analysisTime: e.target.value})}
                     />
                   </div>
                 </div>

               </div>

               <Separator className="my-4" />

               <div className="flex justify-end gap-2">
                 <Button
                   variant="outline"
                   onClick={() => setIsPatientFormOpen(false)}
                   disabled={isSaving}
                 >
                   Cancel
                 </Button>
                 <Button
                   onClick={handleSavePatientReport}
                   disabled={isSaving || !patientInfo.name || !patientInfo.patientId}
                   className="gradient-primary"
                 >
                   {isSaving ? (
                     <>
                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                       Saving...
                     </>
                   ) : (
                     <>
                       <Save className="h-4 w-4 mr-2" />
                       Save Patient Report
                     </>
                   )}
                 </Button>
               </div>
             </DialogContent>
           </Dialog>
         </div>
      </CardContent>
   </Card>
 )
}
