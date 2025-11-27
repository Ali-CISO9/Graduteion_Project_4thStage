import { Suspense, lazy } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LayoutDashboard, Users, Scan, MessageSquare, Settings } from "lucide-react"

const AiRadiologyScan = lazy(() => import("@/components/ai-radiology-scan").then(mod => ({ default: mod.AiRadiologyScan })))
const AiChatbot = lazy(() => import("@/components/ai-chatbot").then(mod => ({ default: mod.AiChatbot })))
const AiAnalysisResult = lazy(() => import("@/components/ai-analysis-result").then(mod => ({ default: mod.AiAnalysisResult })))
const AdvancedReports = lazy(() => import("@/components/advanced-reports").then(mod => ({ default: mod.AdvancedReports })))

export default function MedicalDashboard() {
  return (
    <DashboardLayout>
      <div className="h-full flex flex-col">
        <Tabs defaultValue="ai-analysis" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/30 p-1.5 flex-shrink-0 shadow-2xl shadow-gray-200/20 ring-1 ring-white/20">
            <TabsTrigger value="ai-analysis" className="rounded-xl flex items-center gap-1.5 text-xs px-3 py-2.5 md:px-4 md:py-3 transition-all duration-300 hover:bg-gradient-to-br hover:from-blue-50/80 hover:via-indigo-50/60 hover:to-blue-100/80 hover:text-blue-800 hover:scale-110 hover:shadow-2xl hover:shadow-blue-300/40 hover:-translate-y-0.5 hover:border hover:border-blue-200/50 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:via-indigo-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:shadow-blue-500/50 data-[state=active]:ring-2 data-[state=active]:ring-blue-300/50 data-[state=active]:border data-[state=active]:border-blue-400/30 backdrop-blur-sm" aria-label="AI Analysis tab">
              <Scan className="h-3.5 w-3.5 md:h-4.5 md:w-4.5 transition-transform duration-200 group-hover:scale-110" />
              <span className="hidden sm:inline font-medium tracking-wide">AI Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="chatbot" className="rounded-xl flex items-center gap-1.5 text-xs px-3 py-2.5 md:px-4 md:py-3 transition-all duration-300 hover:bg-gradient-to-br hover:from-green-50/80 hover:via-emerald-50/60 hover:to-green-100/80 hover:text-green-800 hover:scale-110 hover:shadow-2xl hover:shadow-green-300/40 hover:-translate-y-0.5 hover:border hover:border-green-200/50 data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-500 data-[state=active]:via-emerald-600 data-[state=active]:to-green-700 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:shadow-green-500/50 data-[state=active]:ring-2 data-[state=active]:ring-green-300/50 data-[state=active]:border data-[state=active]:border-green-400/30 backdrop-blur-sm" aria-label="Chatbot tab">
              <MessageSquare className="h-3.5 w-3.5 md:h-4.5 md:w-4.5 transition-transform duration-200 group-hover:scale-110" />
              <span className="hidden sm:inline font-medium tracking-wide">Chatbot</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="rounded-xl flex items-center gap-1.5 text-xs px-3 py-2.5 md:px-4 md:py-3 transition-all duration-300 hover:bg-gradient-to-br hover:from-purple-50/80 hover:via-violet-50/60 hover:to-purple-100/80 hover:text-purple-800 hover:scale-110 hover:shadow-2xl hover:shadow-purple-300/40 hover:-translate-y-0.5 hover:border hover:border-purple-200/50 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500 data-[state=active]:via-violet-600 data-[state=active]:to-purple-700 data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:shadow-purple-500/50 data-[state=active]:ring-2 data-[state=active]:ring-purple-300/50 data-[state=active]:border data-[state=active]:border-purple-400/30 backdrop-blur-sm" aria-label="Reports tab">
              <Settings className="h-3.5 w-3.5 md:h-4.5 md:w-4.5 transition-transform duration-200 group-hover:scale-110" />
              <span className="hidden sm:inline font-medium tracking-wide">Reports</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden mt-4">
            <TabsContent value="ai-analysis" className="h-full overflow-auto space-y-6 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-300">
              <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
                <Suspense fallback={
                  <div className="h-[500px] md:h-[600px] bg-muted animate-pulse rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="h-12 w-12 bg-muted-foreground/20 rounded-full mx-auto mb-4 animate-pulse"></div>
                      <div className="h-4 bg-muted-foreground/20 rounded w-32 mx-auto mb-2 animate-pulse"></div>
                      <div className="h-3 bg-muted-foreground/20 rounded w-24 mx-auto animate-pulse"></div>
                    </div>
                  </div>
                }>
                  <AiRadiologyScan />
                </Suspense>
                <Suspense fallback={
                  <div className="h-[500px] md:h-[600px] bg-muted animate-pulse rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="h-12 w-12 bg-muted-foreground/20 rounded-full mx-auto mb-4 animate-pulse"></div>
                      <div className="h-4 bg-muted-foreground/20 rounded w-32 mx-auto mb-2 animate-pulse"></div>
                      <div className="h-3 bg-muted-foreground/20 rounded w-24 mx-auto animate-pulse"></div>
                    </div>
                  </div>
                }>
                  <AiAnalysisResult />
                </Suspense>
              </div>
            </TabsContent>

            <TabsContent value="chatbot" className="h-full overflow-auto space-y-3 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-300">
              <Suspense fallback={<div className="h-[350px] bg-muted animate-pulse rounded-lg" />}>
                <div className="scale-90 origin-top">
                  <AiChatbot />
                </div>
              </Suspense>
            </TabsContent>

            <TabsContent value="reports" className="h-full overflow-auto space-y-3 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-300">
              <Suspense fallback={<div className="h-[400px] bg-muted animate-pulse rounded-lg" />}>
                <div className="scale-90 origin-top">
                  <AdvancedReports />
                </div>
              </Suspense>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
