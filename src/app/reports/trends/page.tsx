"use client"

import * as React from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface TrendsData {
  leadsOverTime: Array<{
    month: string
    totalLeads: number
    qualified: number
    closed: number
    conversions: number
  }>
  weeklyData: Array<{
    week: string
    leads: number
    conversions: number
  }>
}

export default function TrendsPage() {
  const [period, setPeriod] = React.useState("monthly")
  const [dateRange, setDateRange] = React.useState("last-90-days")
  const [data, setData] = React.useState<TrendsData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchTrendsData = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/reports/analytics?dateRange=${dateRange}`)
      if (!response.ok) {
        throw new Error('Failed to fetch trends data')
      }
      const analyticsData = await response.json()
      setData({
        leadsOverTime: analyticsData.leadsOverTime,
        weeklyData: analyticsData.weeklyData
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching trends:', err)
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  React.useEffect(() => {
    fetchTrendsData()
  }, [fetchTrendsData])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-3">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-muted-foreground">Loading trends data...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-3">
            <p className="text-destructive">Error loading trends: {error}</p>
            <button
              onClick={fetchTrendsData}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Format month labels for monthly charts
  const formattedMonthlyData = data.leadsOverTime.map(item => ({
    month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
    leads: item.totalLeads,
    qualified: item.qualified,
    closed: item.closed,
    revenue: (item.closed * 4.2).toFixed(1) // Simulated revenue calculation
  }))

  // Calculate conversion rates for monthly data
  const monthlyConversionData = data.leadsOverTime.map(item => ({
    month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
    closed: item.closed
  }))

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trends Analysis</h1>
          <p className="text-muted-foreground">
            Comprehensive trend analysis for leads, conversions, and revenue
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-30-days">Last 30 days</SelectItem>
              <SelectItem value="last-90-days">Last 90 days</SelectItem>
              <SelectItem value="last-year">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lead Generation Trends</CardTitle>
          <CardDescription>Track leads over time with qualification and closure rates</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={formattedMonthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: '#1f2937'
                }}
              />
              <Legend />
              <Area type="monotone" dataKey="leads" stackId="1" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.6} name="Total Leads" />
              <Area type="monotone" dataKey="qualified" stackId="2" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.6} name="Qualified" />
              <Area type="monotone" dataKey="closed" stackId="3" stroke="#4ade80" fill="#4ade80" fillOpacity={0.6} name="Closed" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
          <CardDescription>Monthly revenue performance in millions</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={formattedMonthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: '#1f2937'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#a78bfa" strokeWidth={3} name="Revenue ($M)" dot={{ fill: '#a78bfa', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Conversion Rate Trend</CardTitle>
            <CardDescription>Lead to customer conversion over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyConversionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    color: '#1f2937'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="closed" 
                  stroke="#4ade80" 
                  strokeWidth={2}
                  name="Conversions"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Performance</CardTitle>
            <CardDescription>Current month weekly breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="week" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    color: '#1f2937'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="leads" stroke="#a78bfa" strokeWidth={2} name="Leads" />
                <Line type="monotone" dataKey="conversions" stroke="#4ade80" strokeWidth={2} name="Conversions" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}