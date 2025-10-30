"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { BrokerLayout } from "@/components/BrokerLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { Search, Loader2, Calendar, Mail, Phone, Target } from "lucide-react"
import { toast } from "sonner"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

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

const stages = [
  { key: "new", label: "New", color: "bg-purple-500", lightColor: "bg-purple-500/10", borderColor: "border-purple-500/20" },
  { key: "attempted 1", label: "Attempted 1", color: "bg-blue-500", lightColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
  { key: "attempted 2", label: "Attempted 2", color: "bg-cyan-500", lightColor: "bg-cyan-500/10", borderColor: "border-cyan-500/20" },
  { key: "site visited", label: "Site Visited", color: "bg-yellow-500", lightColor: "bg-yellow-500/10", borderColor: "border-yellow-500/20" },
  { key: "closed won", label: "Closed Won", color: "bg-green-500", lightColor: "bg-green-500/10", borderColor: "border-green-500/20" },
  { key: "unqualified", label: "Unqualified", color: "bg-red-500", lightColor: "bg-red-500/10", borderColor: "border-red-500/20" },
]

function LeadCard({ lead, isDragging, onView }: { lead: Lead; isDragging?: boolean; onView: (lead: Lead) => void }) {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
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

  return (
    <Card
      className={`group transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 border-border/50 cursor-pointer ${
        isDragging ? "opacity-50 shadow-xl" : ""
      }`}
      onClick={() => onView(lead)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-primary/20">
            <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
              {getInitials(lead.firstName, lead.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <p className="text-sm font-semibold truncate">
                {lead.firstName} {lead.lastName}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{lead.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3 shrink-0" />
              <span>{lead.phone}</span>
            </div>

            <Badge variant="outline" className={getStatusColor(lead.status)}>
              {lead.status}
            </Badge>

            {lead.budget && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-500/10 border border-green-500/20 w-fit">
                <span className="text-xs font-semibold text-green-500">₹{lead.budget}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SortableLeadCard({ lead, onView }: { lead: Lead; onView: (lead: Lead) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
      <LeadCard lead={lead} isDragging={isDragging} onView={onView} />
    </div>
  )
}

function DroppableStageColumn({ 
  stage, 
  stageLeads, 
  totalValue,
  isOver,
  onViewLead
}: { 
  stage: typeof stages[0]
  stageLeads: Lead[]
  totalValue: number
  isOver: boolean
  onViewLead: (lead: Lead) => void
}) {
  const { setNodeRef } = useDroppable({
    id: stage.key,
  })

  return (
    <div className="flex flex-col min-h-[600px]">
      {/* Stage Header */}
      <Card className={`mb-3 border-2 ${stage.borderColor} ${stage.lightColor}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 mb-2">
            <div className={`h-2 w-2 rounded-full ${stage.color}`} />
            <CardTitle className="text-sm font-semibold">{stage.label}</CardTitle>
            <Badge variant="secondary" className="ml-auto">
              {stageLeads.length}
            </Badge>
          </div>
          {totalValue > 0 && (
            <div className="text-xs font-medium text-muted-foreground">
              <span>₹{(totalValue / 1000).toFixed(1)}k</span>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Droppable Area */}
      <ScrollArea className="flex-1 pr-2">
        <div
          ref={setNodeRef}
          className={`space-y-3 min-h-[400px] rounded-lg border-2 border-dashed p-2 transition-colors ${
            isOver 
              ? "border-primary/50 bg-primary/5" 
              : "border-border/50"
          }`}
        >
          {stageLeads.map((lead) => (
            <SortableLeadCard key={lead.id} lead={lead} onView={onViewLead} />
          ))}
          {stageLeads.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Target className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground/50">No leads</p>
              <p className="text-xs text-muted-foreground/30 mt-1">
                Drag leads here
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

export default function BrokerPipelinePage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [leads, setLeads] = React.useState<Lead[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeId, setActiveId] = React.useState<number | null>(null)
  const [overId, setOverId] = React.useState<string | null>(null)
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [comments, setComments] = React.useState<Comment[]>([])
  const [newComment, setNewComment] = React.useState("")
  const [editedStage, setEditedStage] = React.useState("")
  const [editedStatus, setEditedStatus] = React.useState("")
  const [editedFollowUp, setEditedFollowUp] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    
    if (over) {
      // Check if we're over a stage column
      const stageKey = stages.find(s => s.key === over.id)?.key
      if (stageKey) {
        setOverId(stageKey)
      } else {
        // We're over a lead card, find which stage it belongs to
        const leadId = over.id as number
        const lead = leads.find(l => l.id === leadId)
        if (lead) {
          setOverId(lead.stage)
        }
      }
    } else {
      setOverId(null)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setOverId(null)

    if (!over) return

    const activeLeadId = active.id as number
    let targetStage: string | null = null

    // Check if we dropped directly on a stage column
    const stageKey = stages.find(s => s.key === over.id)?.key
    if (stageKey) {
      targetStage = stageKey
    } else {
      // We dropped on a lead card, find which stage it belongs to
      const leadId = over.id as number
      const targetLead = leads.find(l => l.id === leadId)
      if (targetLead) {
        targetStage = targetLead.stage
      }
    }

    if (!targetStage) return

    const lead = leads.find(l => l.id === activeLeadId)
    if (!lead || lead.stage === targetStage) return

    // Optimistically update UI
    setLeads((prevLeads) =>
      prevLeads.map((l) => (l.id === activeLeadId ? { ...l, stage: targetStage } : l))
    )

    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch(`/api/leads?id=${activeLeadId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stage: targetStage })
      })

      if (response.ok) {
        toast.success(`Lead moved to ${stages.find((s) => s.key === targetStage)?.label}`)
      } else {
        throw new Error("Failed to update lead")
      }
    } catch (error) {
      console.error("Error updating lead:", error)
      toast.error("Failed to update lead stage")
      // Revert on error
      fetchLeads()
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
      lead.email.toLowerCase().includes(query)
    )
  })

  const getLeadsByStage = (stageKey: string) => {
    return filteredLeads.filter(lead => lead.stage === stageKey)
  }

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

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null

  return (
    <BrokerLayout>
      <div className="space-y-6 pb-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Pipeline
          </h1>
          <p className="text-muted-foreground mt-2">
            Drag and drop leads to update their stage
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

        {/* Pipeline Board */}
        {filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground mb-1">
              No leads assigned to you
            </p>
            <p className="text-sm text-muted-foreground">
              Contact your admin to get leads assigned
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max">
                {stages.map(stage => {
                  const stageLeads = getLeadsByStage(stage.key)
                  const totalValue = stageLeads.reduce((sum, lead) => {
                    if (lead.budget) {
                      const amount = parseInt(lead.budget.split("-")[0].replace(/[^0-9]/g, ""))
                      return sum + (amount || 0)
                    }
                    return sum
                  }, 0)

                  return (
                    <SortableContext
                      key={stage.key}
                      id={stage.key}
                      items={stageLeads.map(l => l.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="w-[280px] flex-shrink-0">
                        <DroppableStageColumn
                          stage={stage}
                          stageLeads={stageLeads}
                          totalValue={totalValue}
                          isOver={overId === stage.key}
                          onViewLead={handleViewLead}
                        />
                      </div>
                    </SortableContext>
                  )
                })}
              </div>
            </div>

            <DragOverlay>
              {activeLead ? (
                <div className="rotate-3 scale-105">
                  <LeadCard lead={activeLead} onView={() => {}} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
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

              <div className="space-y-4 border-t pt-4">
                <div>
                  <Label htmlFor="stage">Stage</Label>
                  <Select value={editedStage} onValueChange={setEditedStage}>
                    <SelectTrigger id="stage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="attempted 1">Attempted 1</SelectItem>
                      <SelectItem value="attempted 2">Attempted 2</SelectItem>
                      <SelectItem value="unqualified">Unqualified</SelectItem>
                      <SelectItem value="site visited">Site Visited</SelectItem>
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