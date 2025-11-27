"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { AiRadiologyScan } from "@/components/ai-radiology-scan"
import { AiAnalysisResult } from "@/components/ai-analysis-result"

export default function AIAnalysisPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold gradient-text">AI Analysis</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <AiRadiologyScan />
          <AiAnalysisResult />
        </div>
      </div>
    </DashboardLayout>
  )
}