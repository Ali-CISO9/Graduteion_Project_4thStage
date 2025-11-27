"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { AiChatbot } from "@/components/ai-chatbot"

export default function ChatbotPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold gradient-text">AI Medical Assistant</h1>
        </div>
        <div className="flex justify-center">
          <AiChatbot />
        </div>
      </div>
    </DashboardLayout>
  )
}