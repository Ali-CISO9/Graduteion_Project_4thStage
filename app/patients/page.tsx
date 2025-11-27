"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { PatientManagement } from "@/components/patient-management"

export default function PatientsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold gradient-text">Patient Management</h1>
        </div>
        <PatientManagement />
      </div>
    </DashboardLayout>
  )
}