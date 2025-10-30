"use client"

import * as React from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, Cell, PieChart, Pie } from 'recharts'
import { Users, Target, TrendingUp, BarChart3 } from "lucide-react"

interface AnalyticsData {
  summary: {
    totalLeads: number
    conversionRate: number
    totalRevenue: number
    totalBrokerRevenue: number
  }
  leadsOverTime: Array<{
    month: string
    totalLeads: number
    conversions: number
  }>
  sourcePerformance: Array<{
    source: string
    totalLeads: number
    conversions: number
    conversionRate: number
  }>
  brokerPerformance: Array<{
    brokerId: number
    brokerName: string
    totalLeads: number
    attemptedLeads: number
    closedLeads: number
    attemptRate: number
  }>
  conversionFunnel: Array<{
    stage: string
    count: number
    percentage: number
  }>
}

const BROKER_COLORS = [
  '#a78bfa', '#60a5fa', '#34d399', '#fbbf24', '#f87171',
  '#c084fc', '#38bdf8', '#4ade80', '#facc15', '#fb923c'
]

export default function ReportsPage() {
  const [dateRange, setDateRange] = React.useState("last-30-days")
  const [brokerMetric, setBrokerMetric] = React.useState<"assigned" | "attempted" | "closed">("assigned")
  const [data, setData] = React.useState<AnalyticsData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchAnalytics = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/reports/analytics?dateRange=${dateRange}`)
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }
      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching analytics:', err)
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  React.useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-3">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-muted-foreground text-lg">Loading analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <BarChart3 className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground mb-1">Failed to load analytics</p>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <button
              onClick={fetchAnalytics}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Format month labels for charts
  const formattedLeadsOverTime = data.leadsOverTime.map(item => ({
    month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
    leads: item.totalLeads,
    conversions: item.conversions
  }))

  // Format source names
  const formattedSourcePerformance = data.sourcePerformance.map(item => ({
    name: item.source.charAt(0).toUpperCase() + item.source.slice(1).replace('-', ' '),
    leads: item.totalLeads,
    conversions: item.conversions
  }))

  // Format funnel data with light colors
  const formattedConversionFunnel = data.conversionFunnel.map(item => ({
    stage: item.stage.charAt(0).toUpperCase() + item.stage.slice(1).replace('-', ' '),
    value: item.count,
    fill: item.stage === 'new' ? '#a78bfa' :
          item.stage === 'contacted' ? '#60a5fa' :
          item.stage === 'qualified' ? '#34d399' :
          item.stage === 'negotiation' ? '#fbbf24' :
          '#4ade80'
  }))

  // Format broker performance for pie chart based on selected metric
  const brokerPieData = data.brokerPerformance.map((broker, index) => {
    const value = brokerMetric === "assigned" 
      ? broker.totalLeads 
      : brokerMetric === "attempted"
      ? broker.attemptedLeads
      : broker.closedLeads
    
    return {
      name: broker.brokerName,
      value,
      fill: BROKER_COLORS[index % BROKER_COLORS.length]
    }
  }).filter(item => item.value > 0)

  const totalBrokerValue = brokerPieData.reduce((sum, item) => sum + item.value, 0)

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-400 via-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground text-lg">
            Comprehensive insights into your sales performance
          </p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[200px] h-11 shadow-md hover:shadow-lg transition-all duration-200 border-border/50 bg-card/50 backdrop-blur">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last-7-days">Last 7 days</SelectItem>
            <SelectItem value="last-30-days">Last 30 days</SelectItem>
            <SelectItem value="last-90-days">Last 90 days</SelectItem>
            <SelectItem value="last-year">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card className="border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/30 group overflow-hidden relative bg-gradient-to-br from-card via-card to-purple-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-medium text-muted-foreground">Total Leads</CardTitle>
            <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors duration-300 shadow-lg">
              <Users className="h-5 w-5 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground mb-1">{data.summary.totalLeads.toLocaleString()}</div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <p className="text-sm text-muted-foreground">
                Real-time lead count
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/30 group overflow-hidden relative bg-gradient-to-br from-card via-card to-blue-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-medium text-muted-foreground">Conversion Rate</CardTitle>
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors duration-300 shadow-lg">
              <Target className="h-5 w-5 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground mb-1">{data.summary.conversionRate}%</div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <p className="text-sm text-muted-foreground">
                Leads converted to closed won
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="bg-card/80 backdrop-blur-md p-1.5 shadow-lg border border-border/50">
          <TabsTrigger value="trends" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200 font-medium">
            Trends
          </TabsTrigger>
          <TabsTrigger value="sources" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200 font-medium">
            Lead Sources
          </TabsTrigger>
          <TabsTrigger value="brokers" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200 font-medium">
            Broker Performance
          </TabsTrigger>
          <TabsTrigger value="funnel" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200 font-medium">
            Conversion Funnel
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card className="border-border/50 shadow-xl bg-gradient-to-br from-card via-card to-purple-500/5">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Leads & Conversions Over Time</CardTitle>
              <CardDescription className="text-base">Monthly trend analysis showing growth patterns</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={450}>
                <LineChart data={formattedLeadsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(168, 139, 250, 0.15)" strokeWidth={1} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#d1d5db" 
                    style={{ fontSize: '14px', fontWeight: 500 }} 
                    tick={{ fill: '#d1d5db' }}
                  />
                  <YAxis 
                    stroke="#d1d5db" 
                    style={{ fontSize: '14px', fontWeight: 500 }}
                    tick={{ fill: '#d1d5db' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(24, 24, 27, 0.98)',
                      border: '2px solid rgba(168, 139, 250, 0.4)',
                      borderRadius: '12px',
                      color: '#fff',
                      backdropFilter: 'blur(12px)',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontWeight: 500
                    }}
                    labelStyle={{ color: '#e5e7eb', fontWeight: 600, marginBottom: '8px' }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '24px', fontSize: '14px', fontWeight: 500 }} 
                    iconType="line"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="leads" 
                    stroke="#a78bfa" 
                    strokeWidth={4} 
                    name="Total Leads"
                    dot={{ fill: '#a78bfa', strokeWidth: 2, r: 5, stroke: '#1f2937' }}
                    activeDot={{ r: 7, strokeWidth: 2, stroke: '#1f2937' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="conversions" 
                    stroke="#4ade80" 
                    strokeWidth={4} 
                    name="Conversions"
                    dot={{ fill: '#4ade80', strokeWidth: 2, r: 5, stroke: '#1f2937' }}
                    activeDot={{ r: 7, strokeWidth: 2, stroke: '#1f2937' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <Card className="border-border/50 shadow-xl bg-gradient-to-br from-card via-card to-blue-500/5">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Lead Source Performance</CardTitle>
              <CardDescription className="text-base">Compare performance across different lead sources</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={450}>
                <BarChart data={formattedSourcePerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(168, 139, 250, 0.15)" strokeWidth={1} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#d1d5db" 
                    style={{ fontSize: '14px', fontWeight: 500 }}
                    tick={{ fill: '#d1d5db' }}
                  />
                  <YAxis 
                    stroke="#d1d5db" 
                    style={{ fontSize: '14px', fontWeight: 500 }}
                    tick={{ fill: '#d1d5db' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(24, 24, 27, 0.98)',
                      border: '2px solid rgba(168, 139, 250, 0.4)',
                      borderRadius: '12px',
                      color: '#fff',
                      backdropFilter: 'blur(12px)',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontWeight: 500
                    }}
                    labelStyle={{ color: '#e5e7eb', fontWeight: 600, marginBottom: '8px' }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '24px', fontSize: '14px', fontWeight: 500 }} 
                  />
                  <Bar dataKey="leads" fill="#a78bfa" name="Total Leads" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="conversions" fill="#4ade80" name="Conversions" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brokers" className="space-y-4">
          <Card className="border-border/50 shadow-xl bg-gradient-to-br from-card via-card to-green-500/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold">Broker Performance</CardTitle>
                  <CardDescription className="text-base">Distribution of leads across brokers</CardDescription>
                </div>
                <Select value={brokerMetric} onValueChange={(value: any) => setBrokerMetric(value)}>
                  <SelectTrigger className="w-[200px] h-11 shadow-md hover:shadow-lg transition-all duration-200 border-border/50 bg-card/50 backdrop-blur">
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assigned">Assigned Leads</SelectItem>
                    <SelectItem value="attempted">Attempted Leads</SelectItem>
                    <SelectItem value="closed">Closed Leads</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {brokerPieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={450}>
                    <PieChart>
                      <Pie
                        data={brokerPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={(entry) => {
                          const percent = ((entry.value / totalBrokerValue) * 100).toFixed(1)
                          return `${entry.name}: ${percent}%`
                        }}
                        outerRadius={140}
                        fill="#8884d8"
                        dataKey="value"
                        stroke="rgba(31, 41, 55, 0.8)"
                        strokeWidth={3}
                      >
                        {brokerPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(24, 24, 27, 0.98)',
                          border: '2px solid rgba(168, 139, 250, 0.4)',
                          borderRadius: '12px',
                          color: '#fff',
                          backdropFilter: 'blur(12px)',
                          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                          padding: '12px 16px',
                          fontSize: '14px',
                          fontWeight: 500
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="mt-10">
                    <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Detailed Broker Statistics
                    </h3>
                    <div className="space-y-3">
                      {data.brokerPerformance.map((broker, index) => {
                        const currentValue = brokerMetric === "assigned" 
                          ? broker.totalLeads 
                          : brokerMetric === "attempted"
                          ? broker.attemptedLeads
                          : broker.closedLeads
                        
                        const percentage = totalBrokerValue > 0 
                          ? ((currentValue / totalBrokerValue) * 100).toFixed(1)
                          : '0.0'

                        return (
                          <div 
                            key={broker.brokerId}
                            className="flex items-center justify-between p-5 rounded-xl bg-card/50 hover:bg-card/70 border-2 border-border/30 hover:border-primary/30 transition-all duration-200 hover:shadow-lg backdrop-blur-sm"
                          >
                            <div className="flex items-center gap-4">
                              <div 
                                className="w-5 h-5 rounded-full shadow-xl ring-2 ring-background"
                                style={{ backgroundColor: BROKER_COLORS[index % BROKER_COLORS.length] }}
                              />
                              <span className="font-semibold text-foreground text-lg">{broker.brokerName}</span>
                            </div>
                            <div className="flex items-center gap-8 text-sm">
                              <div className="text-center">
                                <div className="text-muted-foreground text-xs font-medium mb-1">Assigned</div>
                                <div className="font-bold text-foreground text-lg">{broker.totalLeads}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-muted-foreground text-xs font-medium mb-1">Attempted</div>
                                <div className="font-bold text-foreground text-lg">{broker.attemptedLeads}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-muted-foreground text-xs font-medium mb-1">Closed</div>
                                <div className="font-bold text-foreground text-lg">{broker.closedLeads}</div>
                              </div>
                              <div className="text-center min-w-[70px]">
                                <div className="text-muted-foreground text-xs font-medium mb-1">Share</div>
                                <div className="font-bold text-primary text-lg">{percentage}%</div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-[450px]">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto">
                      <BarChart3 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-lg">No broker data available for the selected metric</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-4">
          <Card className="border-border/50 shadow-xl bg-gradient-to-br from-card via-card to-yellow-500/5">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Conversion Funnel</CardTitle>
              <CardDescription className="text-base">Lead progression through sales stages</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={450}>
                <BarChart data={formattedConversionFunnel} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(168, 139, 250, 0.15)" strokeWidth={1} />
                  <XAxis 
                    type="number" 
                    stroke="#d1d5db" 
                    style={{ fontSize: '14px', fontWeight: 500 }}
                    tick={{ fill: '#d1d5db' }}
                  />
                  <YAxis 
                    dataKey="stage" 
                    type="category" 
                    stroke="#d1d5db" 
                    width={130} 
                    style={{ fontSize: '14px', fontWeight: 500 }}
                    tick={{ fill: '#d1d5db' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(24, 24, 27, 0.98)',
                      border: '2px solid rgba(168, 139, 250, 0.4)',
                      borderRadius: '12px',
                      color: '#fff',
                      backdropFilter: 'blur(12px)',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                      padding: '12px 16px',
                      fontSize: '14px',
                      fontWeight: 500
                    }}
                    labelStyle={{ color: '#e5e7eb', fontWeight: 600, marginBottom: '8px' }}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[0, 8, 8, 0]}
                    label={{ position: 'right', fill: '#e5e7eb', fontSize: 14, fontWeight: 600 }}
                  >
                    {formattedConversionFunnel.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}