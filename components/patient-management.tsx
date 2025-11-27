"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/lib/language-context"
import { toast } from "sonner"

interface Patient {
  id: number
  name: string
  patient_id: string
  birth_date?: string
  email?: string
  phone?: string
  profile_picture?: string
  department?: string
  doctor_name?: string
  created_at?: string
  updated_at?: string
}

export function PatientManagement() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    patient_id: "",
    birth_date: "",
    email: "",
    phone: "",
    department: "",
    doctor_name: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const { t } = useLanguage()

  // Fetch patients from backend
  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients')
      if (response.ok) {
        const data = await response.json()
        setPatients(data.patients || [])
      } else {
        console.error('Failed to fetch patients')
        toast.error('Failed to load patients')
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
      toast.error('Error loading patients')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const patientData = {
        name: formData.name,
        patient_id: formData.patient_id,
        birth_date: formData.birth_date || null,
        email: formData.email || null,
        phone: formData.phone || null,
        department: formData.department || null,
        doctor_name: formData.doctor_name || null
      }

      const url = editingPatient ? `/api/patients` : `/api/patients`
      const method = editingPatient ? 'POST' : 'POST' // Both create and update use POST

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData),
      })

      if (response.ok) {
        await fetchPatients() // Refresh the list
        setFormData({
          name: "",
          patient_id: "",
          birth_date: "",
          email: "",
          phone: "",
          department: "",
          doctor_name: ""
        })
        setEditingPatient(null)
        setIsDialogOpen(false)
        toast.success(editingPatient ? 'Patient updated successfully' : 'Patient added successfully')
      } else {
        const errorData = await response.json()
        toast.error(errorData.detail || 'Failed to save patient')
      }
    } catch (error) {
      console.error('Error saving patient:', error)
      toast.error('Error saving patient')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient)
    setFormData({
      name: patient.name,
      patient_id: patient.patient_id,
      birth_date: patient.birth_date || "",
      email: patient.email || "",
      phone: patient.phone || "",
      department: patient.department || "",
      doctor_name: patient.doctor_name || ""
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (patientId: string) => {
    if (!confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setPatients(patients.filter(p => p.patient_id !== patientId))
        toast.success('Patient deleted successfully')
      } else {
        toast.error('Failed to delete patient')
      }
    } catch (error) {
      console.error('Error deleting patient:', error)
      toast.error('Error deleting patient')
    }
  }

  return (
    <Card className="gradient-card shadow-lg hover-lift">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary animate-glow">
                <Plus className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="gradient-text text-xl">Patient Management</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground/80">Manage patient records</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingPatient(null); setFormData({ name: "", patient_id: "", birth_date: "", email: "", phone: "", department: "", doctor_name: "" }) }} className="rounded-xl gradient-primary hover-lift">
                <Plus className="h-4 w-4 mr-2" />
                Add Patient
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingPatient ? "Edit Patient" : "Add New Patient"}</DialogTitle>
                <DialogDescription>
                  {editingPatient ? "Update patient information" : "Enter patient details"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="patient_id">Patient ID</Label>
                  <Input
                    id="patient_id"
                    value={formData.patient_id}
                    onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="birth_date">Birth Date</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="doctor_name">Doctor Name</Label>
                  <Input
                    id="doctor_name"
                    value={formData.doctor_name}
                    onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Saving...' : (editingPatient ? "Update" : "Add") + " Patient"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {patients.map((patient, index) => (
            <div key={patient.id} className="flex items-center justify-between p-4 gradient-card rounded-xl hover-lift animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${index * 100}ms` }}>
              <div>
                <p className="font-semibold text-foreground">{patient.name}</p>
                <p className="text-sm text-muted-foreground">ID: {patient.patient_id}</p>
                {patient.birth_date && <p className="text-sm text-muted-foreground">Birth: {new Date(patient.birth_date).toLocaleDateString()}</p>}
                {patient.department && <p className="text-sm text-muted-foreground">Dept: {patient.department}</p>}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={() => handleEdit(patient)} className="rounded-xl gradient-primary hover-lift">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(patient.patient_id)} className="rounded-xl hover:bg-destructive/10 hover:border-destructive/50">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}