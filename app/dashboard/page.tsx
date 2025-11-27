'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity, Users, FileText, TrendingUp, Calendar, AlertCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { DashboardLayout } from '@/components/dashboard-layout'

// Sample data for charts
const patientData = [
  { month: 'Jan', patients: 120 },
  { month: 'Feb', patients: 150 },
  { month: 'Mar', patients: 180 },
  { month: 'Apr', patients: 200 },
  { month: 'May', patients: 220 },
  { month: 'Jun', patients: 250 },
]

const appointmentData = [
  { day: 'Mon', appointments: 25 },
  { day: 'Tue', appointments: 30 },
  { day: 'Wed', appointments: 28 },
  { day: 'Thu', appointments: 35 },
  { day: 'Fri', appointments: 40 },
  { day: 'Sat', appointments: 15 },
  { day: 'Sun', appointments: 10 },
]

const departmentData = [
  { name: 'Cardiology', value: 35, color: '#0088FE' },
  { name: 'Neurology', value: 25, color: '#00C49F' },
  { name: 'Orthopedics', value: 20, color: '#FFBB28' },
  { name: 'Radiology', value: 15, color: '#FF8042' },
  { name: 'Emergency', value: 5, color: '#8884D8' },
]

const chartConfig = {
  patients: {
    label: 'Patients',
    color: 'hsl(var(--chart-1))',
  },
  appointments: {
    label: 'Appointments',
    color: 'hsl(var(--chart-2))',
  },
}

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              Last 30 days
            </Button>
          </div>
        </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="gradient-card hover-lift animate-in slide-in-from-left-4 duration-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold gradient-text">Total Patients</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary animate-glow">
              <Users className="h-4 w-4 text-primary-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold gradient-text mb-1">1,234</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 font-semibold">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-card hover-lift animate-in slide-in-from-left-4 duration-500 delay-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold gradient-text">Active Appointments</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary animate-glow">
              <Calendar className="h-4 w-4 text-primary-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold gradient-text mb-1">89</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 font-semibold">+8%</span> from yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-card hover-lift animate-in slide-in-from-left-4 duration-500 delay-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold gradient-text">AI Analyses</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary animate-glow">
              <Activity className="h-4 w-4 text-primary-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold gradient-text mb-1">456</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 font-semibold">+23%</span> from last week
            </p>
          </CardContent>
        </Card>

        <Card className="gradient-card hover-lift animate-in slide-in-from-left-4 duration-500 delay-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold gradient-text">Reports Generated</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary animate-glow">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold gradient-text mb-1">78</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 font-semibold">+5%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 gradient-card shadow-lg hover-lift animate-in slide-in-from-bottom-4 duration-500 delay-400">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary animate-glow">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="gradient-text text-xl">Patient Growth</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground/80">Monthly patient registrations over the past 6 months</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={patientData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="patients" fill="var(--color-patients)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3 gradient-card shadow-lg hover-lift animate-in slide-in-from-bottom-4 duration-500 delay-500">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary animate-glow">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="gradient-text text-xl">Department Distribution</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground/80">Patient distribution across departments</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Appointments */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 gradient-card shadow-lg hover-lift animate-in slide-in-from-bottom-4 duration-500 delay-600">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary animate-glow">
                <Calendar className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="gradient-text text-xl">Weekly Appointments</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground/80">Daily appointment schedule for this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={appointmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="appointments"
                    stroke="var(--color-appointments)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--color-appointments)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3 gradient-card shadow-lg hover-lift animate-in slide-in-from-bottom-4 duration-500 delay-700">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary animate-glow">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="gradient-text text-xl">Recent Activity</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground/80">Latest system activities and alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">New patient registered</p>
                  <p className="text-sm text-gray-500">John Doe - Cardiology</p>
                </div>
                <div className="text-sm text-gray-500">2m ago</div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">AI analysis completed</p>
                  <p className="text-sm text-gray-500">Chest X-ray - Normal</p>
                </div>
                <div className="text-sm text-gray-500">5m ago</div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Appointment reminder</p>
                  <p className="text-sm text-gray-500">Dr. Smith - 3:00 PM</p>
                </div>
                <div className="text-sm text-gray-500">1h ago</div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Critical alert</p>
                  <p className="text-sm text-gray-500">High blood pressure detected</p>
                </div>
                <div className="text-sm text-gray-500">2h ago</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="gradient-card shadow-lg hover-lift animate-in fade-in-0 duration-500 delay-800">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary animate-glow">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="gradient-text text-xl">Quick Actions</span>
          </CardTitle>
          <CardDescription className="text-muted-foreground/80">Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" size="sm" className="rounded-xl gradient-primary hover-lift">
              <Users className="mr-2 h-4 w-4" />
              Add New Patient
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl gradient-primary hover-lift">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Appointment
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl gradient-primary hover-lift">
              <Activity className="mr-2 h-4 w-4" />
              Run AI Analysis
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl gradient-primary hover-lift">
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl gradient-primary hover-lift">
              <AlertCircle className="mr-2 h-4 w-4" />
              View Alerts
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  )
}