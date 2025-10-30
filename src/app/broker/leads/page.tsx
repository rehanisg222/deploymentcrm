"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { BrokerLayout } from "@/components/BrokerLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Eye, Loader2, Calendar } from "lucide-react"
import { toast } from "sonner"

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
  followUp?: string
  brokerId?: number
  createdAt: string
}

interface Comment {
  id: number
  leadId: number
  userId: number | null
  description: string
  createdAt: string
}

export default function BrokerLeadsPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [leads, setLeads] = React.useState<Lead[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [comments, setComments] = React.useState<Comment[]>([])
  const [newComment, setNewComment] = React.useState("")
  const [editedStage, setEditedStage] = React.useState("")
  const [editedStatus, setEditedStatus] = React.useState("")
  const [editedFollowUp, setEditedFollowUp] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  // Check authentication and role
  React.useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login")
    } else if (!isPending && session?.user?.role !== "broker") {
      router.push("/")
      toast.error("Access denied. Broker role required.")
    }
  }, [session, isPending, router])

  React.useEffect(() => {
    if (session?.user?.role === "broker" && session?.user?.brokerId) {
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
        // Filter leads assigned to this broker
        const brokerLeads = data.filter((lead: Lead) => lead.brokerId === session?.user?.brokerId)
        setLeads(brokerLeads)
      }
    } catch (error) {
      console.error("Error fetching leads:", error)
      toast.error("Failed to load leads")
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async (leadId: number) => {
    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch(`/api/lead-comments?leadId=${leadId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
    }
  }

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead)
    setEditedStage(lead.stage)
    setEditedStatus(lead.status)
    setEditedFollowUp(lead.followUp || "")
    setNewComment("")
    fetchComments(lead.id)
    setDialogOpen(true)
  }

  const handleSaveChanges = async () => {
    if (!selectedLead) return

    try {
      setSaving(true)
      const token = localStorage.getItem("bearer_token")

      // Update lead
      const updateResponse = await fetch(`/api/leads?id=${selectedLead.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stage: editedStage,
          status: editedStatus,
          followUp: editedFollowUp || null,
        })
      })

      if (!updateResponse.ok) {
        throw new Error("Failed to update lead")
      }

      // Add comment if provided
      if (newComment.trim()) {
        const commentResponse = await fetch('/api/lead-comments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            leadId: selectedLead.id,
            description: newComment.trim(),
          })
        })

        if (!commentResponse.ok) {
          throw new Error("Failed to add comment")
        }
      }

      toast.success("Changes saved successfully")
      setDialogOpen(false)
      fetchLeads()
    } catch (error) {
      console.error("Error saving changes:", error)
      toast.error("Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  const filteredLeads = leads.filter(lead => {
    const query = searchQuery.toLowerCase()
    return (
      lead.firstName.toLowerCase().includes(query) ||
      lead.lastName.toLowerCase().includes(query) ||
      lead.email.toLowerCase().includes(query) ||
      lead.phone.includes(query)
    )
  })

  if (isPending || loading) {
    return (
      <BrokerLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </BrokerLayout>
    )
  }

  if (!session?.user || session?.user?.role !== "broker") {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "hot lead": return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      case "new lead": return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "booked lead": return "bg-green-500/10 text-green-500 border-green-500/20"
      case "dead lead": return "bg-red-500/10 text-red-500 border-red-500/20"
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "new": return "bg-purple-500/10 text-purple-400 border-purple-500/20"
      case "contacted": return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case "qualified": return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
      case "negotiation": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      case "closed won": return "bg-green-500/10 text-green-400 border-green-500/20"
      default: return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  return (
    <BrokerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            My Leads
          </h1>
          <p className="text-muted-foreground mt-2">
            View and manage leads assigned to you
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Leads</CardDescription>
              <CardTitle className="text-3xl">{leads.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Hot Leads</CardDescription>
              <CardTitle className="text-3xl">{leads.filter(l => l.status === "hot lead").length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Booked</CardDescription>
              <CardTitle className="text-3xl">{leads.filter(l => l.status === "booked lead").length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Qualified</CardDescription>
              <CardTitle className="text-3xl">{leads.filter(l => l.score >= 70).length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle>Assigned Leads</CardTitle>
            <CardDescription>
              Leads assigned to you ({filteredLeads.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredLeads.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery ? "No leads match your search" : "No leads assigned to you yet"}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">
                          {lead.firstName} {lead.lastName}
                        </TableCell>
                        <TableCell>{lead.email}</TableCell>
                        <TableCell>{lead.phone}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStageColor(lead.stage)}>
                            {lead.stage}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(lead.status)}>
                            {lead.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{lead.score}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewLead(lead)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
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
      </div>

      {/* Lead Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedLead?.firstName} {selectedLead?.lastName}
            </DialogTitle>
            <DialogDescription>
              View and update lead information
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-6">
              {/* Read-only Info */}
              <div className="grid gap-4">
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedLead.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedLead.phone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Source</Label>
                  <p className="font-medium capitalize">{selectedLead.source}</p>
                </div>
                {selectedLead.budget && (
                  <div>
                    <Label className="text-muted-foreground">Budget</Label>
                    <p className="font-medium">{selectedLead.budget}</p>
                  </div>
                )}
              </div>

              {/* Editable Fields */}
              <div className="space-y-4 border-t pt-4">
                <div>
                  <Label htmlFor="stage">Stage</Label>
                  <Select value={editedStage} onValueChange={setEditedStage}>
                    <SelectTrigger id="stage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                      <SelectItem value="closed won">Closed Won</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={editedStatus} onValueChange={setEditedStatus}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new lead">New Lead</SelectItem>
                      <SelectItem value="hot lead">Hot Lead</SelectItem>
                      <SelectItem value="booked lead">Booked Lead</SelectItem>
                      <SelectItem value="dead lead">Dead Lead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="followUp">Follow-up Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="followUp"
                      type="datetime-local"
                      value={editedFollowUp}
                      onChange={(e) => setEditedFollowUp(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="space-y-4 border-t pt-4">
                <Label>Comments</Label>
                {comments.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {comments.map((comment) => (
                      <div key={comment.id} className="text-sm bg-muted p-3 rounded-lg">
                        <p>{comment.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(comment.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveChanges} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </BrokerLayout>
  )
}
