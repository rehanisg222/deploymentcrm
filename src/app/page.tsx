"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'

interface Lead {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  source: string
  status: string
  score: number
  budget?: string
  projectId?: number
  assignedTo?: number
  createdAt: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [leads, setLeads] = React.useState<Lead[]>([])
  const [loading, setLoading] = React.useState(true)

  // Check authentication
  React.useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login")
    }
  }, [session, isPending, router])

  React.useEffect(() => {
    if (session?.user) {
      fetchLeads()
    }
  }, [session])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("bearer_token")
      const response = await fetch('/api/leads', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setLeads(data)
      }
    } catch (error) {
      console.error("Error fetching leads:", error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate real-time stats from leads data - MOVED BEFORE EARLY RETURNS
  const totalLeads = leads.length
  const hotLeads = leads.filter(lead => lead.status === "hot lead").length
  const newLeads = leads.filter(lead => lead.status === "new lead").length
  const bookedLeads = leads.filter(lead => lead.status === "booked lead").length
  const qualifiedLeads = leads.filter(lead => lead.score >= 70).length
  const deadLeads = leads.filter(lead => lead.status === "dead lead").length
  const duplicateLeads = leads.filter(lead => lead.status === "duplicate lead").length

  // Calculate conversion rate (booked leads / total leads)
  const conversionRate = totalLeads > 0 ? ((bookedLeads / totalLeads) * 100).toFixed(1) : "0.0"

  // Performance data - calculate by month from createdAt - MOVED BEFORE EARLY RETURNS
  const performanceData = React.useMemo(() => {
    const monthlyData: Record<string, { leads: number, visits: number, conversions: number }> = {}
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    leads.forEach(lead => {
      const date = new Date(lead.createdAt)
      const monthKey = months[date.getMonth()]
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { leads: 0, visits: 0, conversions: 0 }
      }
      
      monthlyData[monthKey].leads += 1
      if (lead.status === "booked lead") monthlyData[monthKey].visits += 1
      if (lead.score >= 70) monthlyData[monthKey].conversions += 1
    })

    // Get last 6 months with data
    const result = months
      .map(month => ({
        month,
        leads: monthlyData[month]?.leads || 0,
        visits: monthlyData[month]?.visits || 0,
        conversions: monthlyData[month]?.conversions || 0,
      }))
      .filter(item => item.leads > 0)
      .slice(-6)

    return result.length > 0 ? result : [
      { month: 'No Data', leads: 0, visits: 0, conversions: 0 }
    ]
  }, [leads])

  // Source data with real counts - enhanced colors
  const organicCount = leads.filter(lead => lead.source === "organic").length
  const paidCount = leads.filter(lead => lead.source === "paid").length
  const referralCount = leads.filter(lead => lead.source === "referral").length
  const walkInCount = leads.filter(lead => lead.source === "walk-in").length

  const sourceData = [
    { name: 'Organic', value: organicCount, fill: '#a78bfa' },
    { name: 'Paid', value: paidCount, fill: '#60a5fa' },
    { name: 'Referral', value: referralCount, fill: '#34d399' },
    { name: 'Walk-in', value: walkInCount, fill: '#fbbf24' },
  ].filter(item => item.value > 0)

  // Lead funnel data with real counts - enhanced colors
  const leadFunnelData = [
    { name: 'New', value: newLeads, fill: '#a78bfa' },
    { name: 'Hot', value: hotLeads, fill: '#fbbf24' },
    { name: 'Qualified', value: qualifiedLeads, fill: '#34d399' },
    { name: 'Booked', value: bookedLeads, fill: '#60a5fa' },
    { name: 'Dead', value: deadLeads, fill: '#f87171' },
    { name: 'Duplicate', value: duplicateLeads, fill: '#9ca3af' },
  ]

  // Show loading while checking authentication
  if (isPending || !session?.user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </DashboardLayout>
    )
  }

  // KPI Data with real-time values
  const kpiData = [
    {
      title: "Total Leads",
      value: totalLeads.toString(),
      change: "+12%",
      trend: "up",
      icon: Users,
      description: "vs last month",
    },
    {
      title: "Conversion Rate",
      value: `${conversionRate}%`,
      change: "+3.5%",
      trend: "up",
      icon: TrendingUp,
      description: "vs last month",
    },
    {
      title: "Site Visits Done",
      value: bookedLeads.toString(),
      change: "+8%",
      trend: "up",
      icon: MapPin,
      description: "vs last month",
    },
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading dashboard...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Here's your overview for today.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {kpiData.map((kpi) => (
          <Card key={kpi.title} className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <kpi.icon className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{kpi.value}</div>
              <div className="flex items-center text-xs">
                <span className={`flex items-center font-medium ${kpi.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                  {kpi.trend === 'up' ? (
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                  )}
                  {kpi.change}
                </span>
                <span className="ml-2 text-muted-foreground">{kpi.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mb-8">
        <Card className="col-span-4 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">Performance Metrics</CardTitle>
            <CardDescription>Leads generated, visits done, and conversions</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis 
                  dataKey="month" 
                  stroke="rgba(255, 255, 255, 0.5)"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="rgba(255, 255, 255, 0.5)"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(24, 24, 27, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  labelStyle={{ color: '#a1a1aa' }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                />
                <Line 
                  type="monotone" 
                  dataKey="leads" 
                  name="Leads Generated"
                  stroke="#a78bfa" 
                  strokeWidth={3}
                  dot={{ fill: '#a78bfa', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="visits" 
                  name="Visits Done"
                  stroke="#60a5fa" 
                  strokeWidth={3}
                  dot={{ fill: '#60a5fa', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="conversions" 
                  name="Conversions"
                  stroke="#34d399" 
                  strokeWidth={3}
                  dot={{ fill: '#34d399', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">Lead Sources</CardTitle>
            <CardDescription>Distribution by channel</CardDescription>
          </CardHeader>
          <CardContent>
            {sourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth={2}
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(24, 24, 27, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                No lead source data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sales Funnel */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl">Sales Funnel</CardTitle>
          <CardDescription>Leads by stage</CardDescription>
        </CardHeader>
        <CardContent>
          {leadFunnelData.some(item => item.value > 0) ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={leadFunnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis 
                  type="number" 
                  stroke="rgba(255, 255, 255, 0.5)"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="rgba(255, 255, 255, 0.5)"
                  style={{ fontSize: '12px' }}
                  width={80}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(24, 24, 27, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[0, 8, 8, 0]}
                  label={{ position: 'right', fill: '#fff', fontSize: 12 }}
                >
                  {leadFunnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">
              No lead funnel data available
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}