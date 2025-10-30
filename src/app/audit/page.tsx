"use client"

import * as React from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, FileText, User, Settings, Database, AlertCircle } from "lucide-react"

const auditLogs = [
  {
    id: 1,
    action: "Lead Created",
    user: "John Smith",
    details: "Created new lead: Michael Anderson",
    timestamp: "2024-06-15T10:30:00",
    type: "create",
    module: "leads",
  },
  {
    id: 2,
    action: "Lead Status Updated",
    user: "Sarah Johnson",
    details: "Changed status from 'new' to 'contacted' for Dorothy Nelson",
    timestamp: "2024-06-15T09:15:00",
    type: "update",
    module: "leads",
  },
  {
    id: 3,
    action: "Project Added",
    user: "John Smith",
    details: "Added new project: Phoenix Towers",
    timestamp: "2024-06-15T08:45:00",
    type: "create",
    module: "projects",
  },
  {
    id: 4,
    action: "User Login",
    user: "Michael Chen",
    details: "Successful login from IP: 192.168.1.100",
    timestamp: "2024-06-15T08:00:00",
    type: "auth",
    module: "auth",
  },
  {
    id: 5,
    action: "Settings Updated",
    user: "John Smith",
    details: "Updated email integration settings",
    timestamp: "2024-06-14T16:30:00",
    type: "update",
    module: "settings",
  },
  {
    id: 6,
    action: "Broker Added",
    user: "Sarah Johnson",
    details: "Added new broker: Karen Walker",
    timestamp: "2024-06-14T14:20:00",
    type: "create",
    module: "brokers",
  },
  {
    id: 7,
    action: "Lead Deleted",
    user: "Emily Rodriguez",
    details: "Deleted lead: Test Lead",
    timestamp: "2024-06-14T11:15:00",
    type: "delete",
    module: "leads",
  },
  {
    id: 8,
    action: "Campaign Launched",
    user: "John Smith",
    details: "Launched campaign: Luxury Apartments Promo",
    timestamp: "2024-06-14T09:00:00",
    type: "update",
    module: "campaigns",
  },
]

export default function AuditPage() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [moduleFilter, setModuleFilter] = React.useState("all")
  const [typeFilter, setTypeFilter] = React.useState("all")

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesModule = moduleFilter === "all" || log.module === moduleFilter
    const matchesType = typeFilter === "all" || log.type === typeFilter
    return matchesSearch && matchesModule && matchesType
  })

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      create: Database,
      update: Settings,
      delete: AlertCircle,
      auth: User,
    }
    return icons[type] || FileText
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      create: "bg-green-500/10 text-green-500",
      update: "bg-blue-500/10 text-blue-500",
      delete: "bg-red-500/10 text-red-500",
      auth: "bg-purple-500/10 text-purple-500",
    }
    return colors[type] || "bg-gray-500/10 text-gray-500"
  }

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">
          Track all system activities and user actions
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Activity Log</CardTitle>
              <CardDescription>{filteredLogs.length} activities recorded</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  className="pl-8 w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  <SelectItem value="leads">Leads</SelectItem>
                  <SelectItem value="projects">Projects</SelectItem>
                  <SelectItem value="brokers">Brokers</SelectItem>
                  <SelectItem value="campaigns">Campaigns</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="auth">Auth</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => {
                const TypeIcon = getTypeIcon(log.type)
                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${getTypeColor(log.type)}`}>
                        <TypeIcon className="h-4 w-4" />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell>{log.user}</TableCell>
                    <TableCell className="max-w-md">
                      <p className="line-clamp-1 text-sm text-muted-foreground">{log.details}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {log.module}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
