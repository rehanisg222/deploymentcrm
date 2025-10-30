"use client"

import * as React from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { 
  Mail, 
  Phone, 
  MapPin, 
  DollarSign, 
  Calendar,
  Edit,
  Trash2,
  Plus,
  FileText,
  CheckCircle2,
  Clock,
  MessageSquare,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"

interface Lead {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  source: string
  subSource?: string
  stage: string
  budget?: string
  interestedIn?: string
  score: number
  notes?: string
  createdAt: string
}

interface Activity {
  id: number
  type: string
  description: string
  status: string
  createdAt: string
}

interface LeadComment {
  id: number
  leadId: number
  userId: number | null
  description: string
  createdAt: string
}

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [lead, setLead] = React.useState<Lead | null>(null)
  const [activities, setActivities] = React.useState<Activity[]>([])
  const [comments, setComments] = React.useState<LeadComment[]>([])
  const [loading, setLoading] = React.useState(true)
  const [newDescription, setNewDescription] = React.useState("")
  const [addingDescription, setAddingDescription] = React.useState(false)
  const [deletingDescription, setDeletingDescription] = React.useState<number | null>(null)

  React.useEffect(() => {
    if (params.id) {
      fetchLeadDetails()
      fetchActivities()
      fetchComments()
    }
  }, [params.id])

  const fetchLeadDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/leads?id=${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setLead(data)
      }
    } catch (error) {
      console.error("Error fetching lead:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchActivities = async () => {
    try {
      const response = await fetch(`/api/activities?leadId=${params.id}&limit=50`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data)
      }
    } catch (error) {
      console.error("Error fetching activities:", error)
    }
  }

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/lead-comments?leadId=${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
    }
  }

  const handleAddDescription = async () => {
    if (!newDescription.trim() || !params.id) return

    try {
      setAddingDescription(true)
      const response = await fetch('/api/lead-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: parseInt(params.id as string),
          description: newDescription.trim(),
        }),
      })

      if (response.ok) {
        const comment = await response.json()
        setComments([comment, ...comments])
        toast.success("Description added successfully")
        setNewDescription("")
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

  const handleDeleteDescription = async (commentId: number) => {
    try {
      setDeletingDescription(commentId)
      const response = await fetch(`/api/lead-comments?id=${commentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setComments(comments.filter(c => c.id !== commentId))
        toast.success("Description deleted successfully")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete description")
      }
    } catch (error) {
      console.error("Error deleting description:", error)
      toast.error("Failed to delete description")
    } finally {
      setDeletingDescription(null)
    }
  }

  const handleEditLead = () => {
    router.push(`/leads/${params.id}/edit`)
  }

  const handleDeleteLead = async () => {
    if (!lead) return

    try {
      const response = await fetch(`/api/leads?id=${lead.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success("Lead deleted successfully")
        router.push('/leads')
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete lead")
      }
    } catch (error) {
      console.error("Error deleting lead:", error)
      toast.error("Failed to delete lead")
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading lead details...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!lead) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Lead not found</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      "new": "bg-blue-500",
      "attempted 1": "bg-purple-500",
      "attempted 2": "bg-green-500",
      "unqualified": "bg-yellow-500",
      "closed won": "bg-emerald-500",
    }
    return colors[stage] || "bg-gray-500"
  }

  const getStageLabel = (stage: string) => {
    if (stage === "closed won") return "Closed Won"
    if (stage === "attempted 1") return "Attempted 1"
    if (stage === "attempted 2") return "Attempted 2"
    return stage.charAt(0).toUpperCase() + stage.slice(1)
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {lead.firstName} {lead.lastName}
          </h1>
          <p className="text-muted-foreground">Lead Details & Activity Timeline</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEditLead}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" onClick={handleDeleteLead}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl">
                  {lead.firstName[0]}{lead.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>
                  {lead.firstName} {lead.lastName}
                </CardTitle>
                <Badge className={`${getStageColor(lead.stage)} mt-2`}>
                  {getStageLabel(lead.stage)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-medium mb-3">Contact Information</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{lead.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{lead.phone}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-3">Lead Details</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pipeline Stage</span>
                  <Badge variant="outline" className="capitalize">{getStageLabel(lead.stage)}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Source</span>
                  <Badge variant="outline" className="capitalize">{lead.source}</Badge>
                </div>
                {lead.subSource && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Sub-Source</span>
                    <Badge variant="outline" className="capitalize">{lead.subSource}</Badge>
                  </div>
                )}
                {lead.budget && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Budget</span>
                    <span className="font-semibold">{lead.budget}</span>
                  </div>
                )}
                {lead.interestedIn && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Interested In</span>
                    <span className="capitalize">{lead.interestedIn}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-2">Created</h4>
              <p className="text-sm text-muted-foreground">
                {new Date(lead.createdAt).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <Tabs defaultValue="descriptions" className="h-full">
            <CardHeader>
              <TabsList>
                <TabsTrigger value="descriptions">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Descriptions ({comments.length})
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <TabsContent value="descriptions" className="mt-0">
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Add New Description</label>
                    <Textarea
                      placeholder="Enter your description..."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      rows={3}
                    />
                    <Button 
                      onClick={handleAddDescription} 
                      disabled={addingDescription || !newDescription.trim()}
                      size="sm"
                    >
                      {addingDescription ? "Adding..." : "Add Description"}
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <label className="text-sm font-medium">All Descriptions</label>
                    <div className="max-h-[400px] overflow-y-auto space-y-3">
                      {comments.length > 0 ? (
                        comments.map((comment) => (
                          <div key={comment.id} className="rounded-lg border p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm flex-1">{comment.description}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDescription(comment.id)}
                                disabled={deletingDescription === comment.id}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No descriptions yet
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </DashboardLayout>
  )
}