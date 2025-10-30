"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Download, Upload, Search, Flame, Sparkles, XCircle, Trash2, MessageSquare, Edit, CheckCircle2, FileX } from "lucide-react"
import { AddLeadDialog } from "@/components/AddLeadDialog"
import { toast } from "sonner"
import { useSession } from "@/lib/auth-client"

interface Lead {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  source: string
  status: string
  stage: string
  score: number
  budget?: string
  projectId?: number
  brokerId?: number
  createdAt: string
}

interface LeadComment {
  id: number
  leadId: number
  userId: number | null
  description: string
  createdAt: string
}

interface Project {
  id: number
  name: string
}

interface User {
  id: number
  name: string
}

interface Broker {
  id: number
  name: string
}

export default function LeadsPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [leads, setLeads] = React.useState<Lead[]>([])
  const [leadComments, setLeadComments] = React.useState<Record<number, LeadComment[]>>({})
  const [projects, setProjects] = React.useState<Project[]>([])
  const [brokers, setBrokers] = React.useState<Broker[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [stageFilter, setStageFilter] = React.useState("all")
  const [sourceFilter, setSourceFilter] = React.useState("all")
  const [showAddDialog, setShowAddDialog] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [leadToDelete, setLeadToDelete] = React.useState<Lead | null>(null)
  const [deleting, setDeleting] = React.useState(false)
  const [descriptionDialogOpen, setDescriptionDialogOpen] = React.useState(false)
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null)
  const [newDescription, setNewDescription] = React.useState("")
  const [addingDescription, setAddingDescription] = React.useState(false)

  // Check user role
  const userRole = session?.user?.role || 'admin'
  const isBroker = userRole === 'broker'

  React.useEffect(() => {
    if (session?.user) {
      fetchProjects()
      fetchBrokers()
    }
  }, [session])

  React.useEffect(() => {
    if (session?.user) {
      fetchLeads()
    }
  }, [stageFilter, sourceFilter, searchTerm, session])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
    }
  }

  const fetchBrokers = async () => {
    try {
      const response = await fetch('/api/brokers')
      if (response.ok) {
        const data = await response.json()
        setBrokers(data)
      }
    } catch (error) {
      console.error("Error fetching brokers:", error)
    }
  }

  const fetchLeads = async () => {
    if (!session?.user?.id) return
    
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      // Add currentUserId for role-based filtering
      params.append("currentUserId", session.user.id)
      
      if (stageFilter !== "all") params.append("stage", stageFilter)
      if (sourceFilter !== "all") params.append("source", sourceFilter)
      if (searchTerm) params.append("search", searchTerm)
      
      const token = localStorage.getItem("bearer_token")
      const response = await fetch(`/api/leads?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setLeads(data)
        fetchCommentsForLeads(data)
      }
    } catch (error) {
      console.error("Error fetching leads:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCommentsForLeads = async (leadsData: Lead[]) => {
    try {
      const commentsMap: Record<number, LeadComment[]> = {}
      
      await Promise.all(
        leadsData.map(async (lead) => {
          try {
            const response = await fetch(`/api/lead-comments?leadId=${lead.id}`)
            if (response.ok) {
              const comments = await response.json()
              commentsMap[lead.id] = comments
            }
          } catch (error) {
            console.error(`Error fetching comments for lead ${lead.id}:`, error)
          }
        })
      )
      
      setLeadComments(commentsMap)
    } catch (error) {
      console.error("Error fetching comments:", error)
    }
  }

  const handleBrokerChange = async (leadId: number, brokerId: string) => {
    try {
      const response = await fetch(`/api/leads?id=${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brokerId: brokerId && brokerId !== "none" ? parseInt(brokerId) : null,
        }),
      })

      if (response.ok) {
        setLeads(prevLeads =>
          prevLeads.map(lead =>
            lead.id === leadId
              ? { ...lead, brokerId: brokerId && brokerId !== "none" ? parseInt(brokerId) : undefined }
              : lead
          )
        )
        toast.success("Broker assigned successfully")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to assign broker")
      }
    } catch (error) {
      console.error("Error assigning broker:", error)
      toast.error("Failed to assign broker")
    }
  }

  const handleAddDescription = async () => {
    if (!selectedLead || !newDescription.trim()) return

    try {
      setAddingDescription(true)
      const response = await fetch('/api/lead-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.id,
          description: newDescription.trim(),
        }),
      })

      if (response.ok) {
        const comment = await response.json()
        setLeadComments(prev => ({
          ...prev,
          [selectedLead.id]: [comment, ...(prev[selectedLead.id] || [])]
        }))
        toast.success("Description added successfully")
        setNewDescription("")
        setDescriptionDialogOpen(false)
        setSelectedLead(null)
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to add description")
      }
    } catch (error) {
      console.error("Error adding description:", error)
      toast.error("Failed to add description")
    } finally {
      setAddingDescription(false)
    }
  }

  const handleDeleteClick = (lead: Lead) => {
    if (isBroker) {
      toast.error("Brokers cannot delete leads")
      return
    }
    setLeadToDelete(lead)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!leadToDelete) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/leads?id=${leadToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setLeads(prevLeads => prevLeads.filter(l => l.id !== leadToDelete.id))
        toast.success("Lead deleted successfully")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete lead")
      }
    } catch (error) {
      console.error("Error deleting lead:", error)
      toast.error("Failed to delete lead")
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setLeadToDelete(null)
    }
  }

  const handleDescriptionClick = (lead: Lead) => {
    setSelectedLead(lead)
    setDescriptionDialogOpen(true)
  }

  const handleViewLead = (leadId: number) => {
    router.push(`/leads/${leadId}`)
  }

  const handleEditLead = (leadId: number) => {
    router.push(`/leads/${leadId}/edit`)
  }

  const getProjectName = (projectId?: number) => {
    if (!projectId) return "-"
    const project = projects.find(p => p.id === projectId)
    return project?.name || "-"
  }

  const getBrokerName = (brokerId?: number) => {
    if (!brokerId) return "-"
    const broker = brokers.find(b => b.id === brokerId)
    return broker?.name || "-"
  }

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      "new": "bg-blue-500/10 text-blue-500",
      "attempted 1": "bg-purple-500/10 text-purple-500",
      "attempted 2": "bg-green-500/10 text-green-500",
      "unqualified": "bg-yellow-500/10 text-yellow-500",
      "site visited": "bg-orange-500/10 text-orange-500",
      "closed won": "bg-emerald-500/10 text-emerald-500",
    }
    return colors[stage] || "bg-gray-500/10 text-gray-500"
  }

  const getLatestDescription = (leadId: number) => {
    const comments = leadComments[leadId]
    if (!comments || comments.length === 0) return "-"
    return comments[0].description
  }

  const getDescriptionCount = (leadId: number) => {
    const comments = leadComments[leadId]
    return comments ? comments.length : 0
  }

  const hotLeads = leads.filter(lead => lead.status === "hot lead").length
  const newLeads = leads.filter(lead => lead.status === "new lead").length
  const bookedLeads = leads.filter(lead => lead.status === "booked lead").length
  const deadLeads = leads.filter(lead => lead.status === "dead lead").length
  const duplicateLeads = leads.filter(lead => lead.status === "duplicate lead").length

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
              {isBroker ? "My Leads" : "Leads Management"}
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              {isBroker ? "View and manage your assigned leads" : "Manage and track all your leads in one place"}
            </p>
          </div>
          {!isBroker && (
            <div className="flex gap-3">
              <Button variant="outline" className="hover:bg-accent hover:text-accent-foreground transition-colors">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
              <Button variant="outline" className="hover:bg-accent hover:text-accent-foreground transition-colors">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button onClick={() => setShowAddDialog(true)} className="bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/25">
                <Plus className="mr-2 h-4 w-4" />
                Add Lead
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-5">
          <Card className="hover:shadow-lg transition-all duration-300 border-border/50 backdrop-blur-sm overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold">Hot Lead</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                <Flame className="h-5 w-5 text-red-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">{hotLeads}</div>
              <p className="text-xs text-muted-foreground mt-1">High priority leads</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-border/50 backdrop-blur-sm overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold">New Lead</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <Sparkles className="h-5 w-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">{newLeads}</div>
              <p className="text-xs text-muted-foreground mt-1">Fresh leads</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-border/50 backdrop-blur-sm overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold">Booked Lead</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{bookedLeads}</div>
              <p className="text-xs text-muted-foreground mt-1">Confirmed bookings</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-border/50 backdrop-blur-sm overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold">Dead Lead</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-gray-500/10 flex items-center justify-center group-hover:bg-gray-500/20 transition-colors">
                <XCircle className="h-5 w-5 text-gray-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-500">{deadLeads}</div>
              <p className="text-xs text-muted-foreground mt-1">Inactive leads</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-border/50 backdrop-blur-sm overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold">Duplicate Lead</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                <FileX className="h-5 w-5 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-500">{duplicateLeads}</div>
              <p className="text-xs text-muted-foreground mt-1">Duplicate entries</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/50 backdrop-blur-sm shadow-xl">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">
                  {isBroker ? "My Assigned Leads" : "All Leads"}
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  {loading ? "Loading..." : `${leads.length} leads found`}
                </CardDescription>
              </div>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, phone..."
                    className="pl-10 w-[280px] bg-background/50 border-border/50 focus:border-primary transition-colors"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger className="w-[160px] bg-background/50 border-border/50">
                    <SelectValue placeholder="Stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="attempted 1">Attempted 1</SelectItem>
                    <SelectItem value="attempted 2">Attempted 2</SelectItem>
                    <SelectItem value="unqualified">Unqualified</SelectItem>
                    <SelectItem value="site visited">Site Visited</SelectItem>
                    <SelectItem value="closed won">Closed Won</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-[160px] bg-background/50 border-border/50">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="organic">Organic</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="walk-in">Walk-in</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
                <div className="text-muted-foreground text-lg">Loading leads...</div>
              </div>
            ) : leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium text-foreground mb-1">
                  {isBroker ? "No leads assigned to you" : "No leads found"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isBroker ? "Contact your admin to get leads assigned" : "Try adjusting your filters or add a new lead"}
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold">Contact</TableHead>
                      <TableHead className="font-semibold">Stage</TableHead>
                      <TableHead className="font-semibold">Project</TableHead>
                      {!isBroker && <TableHead className="font-semibold">Broker</TableHead>}
                      <TableHead className="font-semibold">Description</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow key={lead.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium text-foreground">
                          {lead.firstName} {lead.lastName}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div className="text-foreground">{lead.email}</div>
                            <div className="text-muted-foreground">{lead.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStageColor(lead.stage)} font-medium capitalize`}>
                            {lead.stage === "closed won" ? "Closed Won" : 
                             lead.stage === "attempted 1" ? "Attempted 1" :
                             lead.stage === "attempted 2" ? "Attempted 2" :
                             lead.stage === "site visited" ? "Site Visited" :
                             lead.stage}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{getProjectName(lead.projectId)}</TableCell>
                        {!isBroker && (
                          <TableCell>
                            <Select
                              value={lead.brokerId?.toString() || "none"}
                              onValueChange={(value) => handleBrokerChange(lead.id, value)}
                            >
                              <SelectTrigger className="w-[150px] h-8 text-sm">
                                <SelectValue placeholder="Select broker">
                                  {lead.brokerId ? getBrokerName(lead.brokerId) : "Select broker"}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {brokers.map((broker) => (
                                  <SelectItem key={broker.id} value={broker.id.toString()}>
                                    {broker.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                              {getLatestDescription(lead.id)}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDescriptionClick(lead)}
                              className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                            >
                              <MessageSquare className="h-4 w-4" />
                              {getDescriptionCount(lead.id) > 0 && (
                                <span className="ml-1 text-xs font-medium">{getDescriptionCount(lead.id)}</span>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewLead(lead.id)}
                              className="hover:bg-primary/10 hover:text-primary transition-colors"
                            >
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditLead(lead.id)}
                              className="hover:bg-blue-500/10 hover:text-blue-500 transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {!isBroker && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(lead)}
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {!isBroker && (
        <AddLeadDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSuccess={fetchLeads}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {leadToDelete?.firstName} {leadToDelete?.lastName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={descriptionDialogOpen} onOpenChange={setDescriptionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Descriptions for {selectedLead?.firstName} {selectedLead?.lastName}
            </DialogTitle>
            <DialogDescription>
              View all descriptions and add new ones
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Add New Description</label>
              <Textarea
                placeholder="Enter your description..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Previous Descriptions</label>
              <div className="max-h-[300px] overflow-y-auto space-y-2 rounded-md border p-4">
                {selectedLead && leadComments[selectedLead.id]?.length > 0 ? (
                  leadComments[selectedLead.id].map((comment) => (
                    <div key={comment.id} className="border-b pb-2 last:border-b-0">
                      <p className="text-sm">{comment.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No descriptions yet
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDescriptionDialogOpen(false)
                setSelectedLead(null)
                setNewDescription("")
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddDescription} disabled={addingDescription || !newDescription.trim()}>
              {addingDescription ? "Adding..." : "Add Description"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}