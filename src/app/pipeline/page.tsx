"use client"

import * as React from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Mail, Phone, Users, Target, Eye } from "lucide-react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  DragOverEvent,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { toast } from "sonner"
import { useSession } from "@/lib/auth-client"

interface Lead {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  status: string
  stage: string
  budget?: string
  score: number
}

const stages = [
  { key: "new", label: "New", color: "bg-blue-500", lightColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
  { key: "attempted 1", label: "Attempted 1", color: "bg-purple-500", lightColor: "bg-purple-500/10", borderColor: "border-purple-500/20" },
  { key: "attempted 2", label: "Attempted 2", color: "bg-green-500", lightColor: "bg-green-500/10", borderColor: "border-green-500/20" },
  { key: "unqualified", label: "Unqualified", color: "bg-yellow-500", lightColor: "bg-yellow-500/10", borderColor: "border-yellow-500/20" },
  { key: "site visited", label: "Site Visited", color: "bg-orange-500", lightColor: "bg-orange-500/10", borderColor: "border-orange-500/20" },
  { key: "closed won", label: "Closed Won", color: "bg-emerald-500", lightColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20" },
]

function LeadCard({ lead, isDragging }: { lead: Lead; isDragging?: boolean }) {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  return (
    <Card
      className={`group transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 border-border/50 ${
        isDragging ? "opacity-50 shadow-xl" : ""
      }`}
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

function SortableLeadCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
      <LeadCard lead={lead} isDragging={isDragging} />
    </div>
  )
}

function DroppableStageColumn({ 
  stage, 
  stageLeads, 
  totalValue,
  isOver 
}: { 
  stage: typeof stages[0]
  stageLeads: Lead[]
  totalValue: number
  isOver: boolean
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
          <div className="text-xs font-medium text-muted-foreground">
            <span>₹{(totalValue / 1000).toFixed(1)}k</span>
          </div>
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
            <SortableLeadCard key={lead.id} lead={lead} />
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

export default function PipelinePage() {
  const { data: session, isPending } = useSession()
  const [leads, setLeads] = React.useState<Lead[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activeId, setActiveId] = React.useState<number | null>(null)
  const [overId, setOverId] = React.useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Check user role
  const userRole = session?.user?.role || 'admin'
  const isBroker = userRole === 'broker'

  React.useEffect(() => {
    if (session?.user) {
      fetchLeads()
    }
  }, [session])

  const fetchLeads = async () => {
    if (!session?.user?.id) return
    
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append("limit", "100")
      
      // Add currentUserId for role-based filtering
      params.append("currentUserId", session.user.id)
      
      const token = localStorage.getItem("bearer_token")
      const response = await fetch(`/api/leads?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setLeads(data.filter((l: Lead) => l.status !== "lost"))
      }
    } catch (error) {
      console.error("Error fetching leads:", error)
      toast.error("Failed to load pipeline data")
    } finally {
      setLoading(false)
    }
  }

  const getLeadsByStage = (stageKey: string) => {
    return leads.filter((lead) => lead.stage === stageKey)
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

    const lead = leads.find((l) => l.id === activeLeadId)
    if (lead && lead.stage !== targetStage) {
      // Optimistically update UI
      setLeads((prevLeads) =>
        prevLeads.map((l) => (l.id === activeLeadId ? { ...l, stage: targetStage } : l))
      )

      // Update backend
      try {
        const response = await fetch(`/api/leads?id=${activeLeadId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage: targetStage }),
        })

        if (!response.ok) {
          throw new Error("Failed to update lead")
        }

        toast.success(`Lead moved to ${stages.find((s) => s.key === targetStage)?.label}`)
      } catch (error) {
        console.error("Error updating lead:", error)
        toast.error("Failed to update lead stage")
        // Revert on error
        fetchLeads()
      }
    }
  }

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null

  const totalPipelineValue = leads.reduce((sum, lead) => {
    if (lead.budget) {
      const amount = parseInt(lead.budget.split("-")[0].replace(/[^0-9]/g, ""))
      return sum + (amount || 0)
    }
    return sum
  }, 0)

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
        {/* Header with Stats */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isBroker ? "My Pipeline" : "Sales Pipeline"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isBroker 
                ? "Manage your assigned leads through the pipeline stages" 
                : "Drag and drop leads between stages to manage your pipeline"}
            </p>
          </div>
        </div>

        {/* Pipeline Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Site Visits</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leads.length}</div>
              <p className="text-xs text-muted-foreground">
                {isBroker ? "Your leads in pipeline" : "Total leads in pipeline"}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leads.length}</div>
              <p className="text-xs text-muted-foreground">In pipeline</p>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Loading pipeline...</p>
            </div>
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground mb-1">
              {isBroker ? "No leads assigned to you" : "No leads in pipeline"}
            </p>
            <p className="text-sm text-muted-foreground">
              {isBroker ? "Contact your admin to get leads assigned" : "Add leads to start managing your pipeline"}
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
            <div className="grid gap-4 md:grid-cols-6">
              {stages.map((stage) => {
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
                    items={stageLeads.map((l) => l.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <DroppableStageColumn
                      stage={stage}
                      stageLeads={stageLeads}
                      totalValue={totalValue}
                      isOver={overId === stage.key}
                    />
                  </SortableContext>
                )
              })}
            </div>

            <DragOverlay>
              {activeLead ? (
                <div className="rotate-3 scale-105">
                  <LeadCard lead={activeLead} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </DashboardLayout>
  )
}