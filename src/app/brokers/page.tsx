"use client"

import * as React from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Users, Target, TrendingUp, Pencil } from "lucide-react"
import { BrokerFormDialog } from "@/components/BrokerFormDialog"
import { toast } from "sonner"

interface BrokerStats {
  id: number
  name: string
  email: string
  phone: string
  isActive: boolean
  attempted1: number
  attempted2: number
  unqualified: number
  deadLead: number
  siteVisited: number
  followUp: number
  totalLeads: number
}

export default function BrokersPage() {
  const [brokers, setBrokers] = React.useState<BrokerStats[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [addDialogOpen, setAddDialogOpen] = React.useState(false)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [selectedBroker, setSelectedBroker] = React.useState<BrokerStats | null>(null)

  React.useEffect(() => {
    fetchBrokerStats()
  }, [searchTerm])

  const fetchBrokerStats = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      
      const response = await fetch(`/api/brokers/stats?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setBrokers(data)
      } else {
        toast.error("Failed to fetch broker statistics")
      }
    } catch (error) {
      console.error("Error fetching broker statistics:", error)
      toast.error("Error loading broker statistics")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (broker: BrokerStats) => {
    setSelectedBroker(broker)
    setEditDialogOpen(true)
  }

  const handleAddSuccess = () => {
    fetchBrokerStats()
    setAddDialogOpen(false)
  }

  const handleEditSuccess = () => {
    fetchBrokerStats()
    setEditDialogOpen(false)
    setSelectedBroker(null)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const totalLeadsAllBrokers = brokers.reduce((sum, b) => sum + b.totalLeads, 0)
  const totalSiteVisits = brokers.reduce((sum, b) => sum + b.siteVisited, 0)
  const totalFollowUps = brokers.reduce((sum, b) => sum + b.followUp, 0)

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brokers</h1>
          <p className="text-muted-foreground">
            Manage your broker network and track lead performance
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Broker
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Brokers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brokers.length}</div>
            <p className="text-xs text-muted-foreground">
              {brokers.filter(b => b.isActive).length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeadsAllBrokers}</div>
            <p className="text-xs text-muted-foreground">Assigned to brokers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Site Visits</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSiteVisits}</div>
            <p className="text-xs text-muted-foreground">{totalFollowUps} follow-ups pending</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Broker Performance</CardTitle>
              <CardDescription>
                {loading ? "Loading..." : `${brokers.length} brokers with lead statistics`}
              </CardDescription>
            </div>
            <div className="relative w-[300px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search brokers..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Loading broker statistics...</p>
              </div>
            </div>
          ) : brokers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground">No brokers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Broker</TableHead>
                    <TableHead className="text-center">Attempted</TableHead>
                    <TableHead className="text-center">Attempted 2</TableHead>
                    <TableHead className="text-center">Unqualified</TableHead>
                    <TableHead className="text-center">Dead Lead</TableHead>
                    <TableHead className="text-center">Site Visit</TableHead>
                    <TableHead className="text-center">Follow Up</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brokers.map((broker) => (
                    <TableRow key={broker.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{getInitials(broker.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium">{broker.name}</span>
                            <div className="text-xs text-muted-foreground">{broker.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                          {broker.attempted1}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                          {broker.attempted2}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                          {broker.unqualified}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                          {broker.deadLead}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                          {broker.siteVisited}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                          {broker.followUp}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-semibold">
                          {broker.totalLeads}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={broker.isActive ? "default" : "secondary"}>
                          {broker.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEdit(broker)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Broker Dialog */}
      <BrokerFormDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={handleAddSuccess}
      />

      {/* Edit Broker Dialog */}
      <BrokerFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        broker={selectedBroker || undefined}
        onSuccess={handleEditSuccess}
      />
    </DashboardLayout>
  )
}