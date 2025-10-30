"use client"

import * as React from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { useSession } from "@/lib/auth-client"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Lead {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  source: string
  subSource?: string
  status: string
  stage: string
  budget?: string
  interestedIn?: string
  notes?: string
  followUp?: string | null
  assignedTo?: number | null
  lastContactedAt?: string | null
}

interface Broker {
  id: number
  name: string
  company: string
  email: string
  isActive: boolean
}

const SOURCES = ['organic', 'paid', 'referral', 'walk-in']
const SUB_SOURCES = ['Google Ads', 'Facebook', 'Instagram', 'LinkedIn', 'Twitter', 'YouTube', 'TikTok', 'Email Campaign', 'Direct Mail', 'Event', 'Other']
const STATUSES = ['hot lead', 'new lead', 'booked lead', 'dead lead', 'duplicate lead']
const STAGES = ['new', 'attempted 1', 'attempted 2', 'unqualified', 'site visited', 'closed won']
const FOLLOW_UP_OPTIONS = ['Call back', 'Send proposal', 'Schedule site visit', 'Send brochure', 'Follow up next week', 'Awaiting decision', 'Price negotiation', 'Other']

export default function EditLeadPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [brokers, setBrokers] = React.useState<Broker[]>([])
  const [brokersLoading, setBrokersLoading] = React.useState(true)
  const [formData, setFormData] = React.useState<Lead>({
    id: 0,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    source: "organic",
    subSource: "",
    status: "new lead",
    stage: "new",
    budget: "",
    interestedIn: "",
    notes: "",
    followUp: null,
    assignedTo: null,
    lastContactedAt: null,
  })
  const [description, setDescription] = React.useState("")
  const descriptionSaveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Check user role
  const userRole = session?.user?.role || 'admin'
  const isBroker = userRole === 'broker'

  React.useEffect(() => {
    if (params.id) {
      fetchLead()
    }
    fetchBrokers()
  }, [params.id])

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (descriptionSaveTimeoutRef.current) {
        clearTimeout(descriptionSaveTimeoutRef.current)
      }
    }
  }, [])

  const fetchBrokers = async () => {
    try {
      setBrokersLoading(true)
      const response = await fetch('/api/brokers?limit=100')
      if (response.ok) {
        const data = await response.json()
        setBrokers(data)
      } else {
        toast.error("Failed to load brokers")
      }
    } catch (error) {
      console.error("Error fetching brokers:", error)
      toast.error("Failed to load brokers")
    } finally {
      setBrokersLoading(false)
    }
  }

  const fetchLead = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/leads?id=${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setFormData({
          id: data.id,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          phone: data.phone || "",
          source: data.source || "organic",
          subSource: data.subSource || "",
          status: data.status || "new lead",
          stage: data.stage || "new",
          budget: data.budget || "",
          interestedIn: data.interestedIn || "",
          notes: data.notes || "",
          followUp: data.followUp || null,
          assignedTo: data.assignedTo || null,
          lastContactedAt: data.lastContactedAt || null,
        })
      } else {
        toast.error("Failed to load lead")
        router.push("/leads")
      }
    } catch (error) {
      console.error("Error fetching lead:", error)
      toast.error("Failed to load lead")
      router.push("/leads")
    } finally {
      setLoading(false)
    }
  }

  const handleDescriptionChange = (value: string) => {
    setDescription(value)
    
    // Clear existing timeout
    if (descriptionSaveTimeoutRef.current) {
      clearTimeout(descriptionSaveTimeoutRef.current)
    }
    
    // Set new timeout for auto-save (2 seconds after user stops typing)
    if (value.trim()) {
      descriptionSaveTimeoutRef.current = setTimeout(() => {
        saveDescriptionRealTime(value)
      }, 2000)
    }
  }

  const saveDescriptionRealTime = async (descriptionText: string) => {
    if (!descriptionText.trim()) return

    try {
      const response = await fetch('/api/lead-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: parseInt(params.id as string),
          description: descriptionText.trim(),
        }),
      })

      if (response.ok) {
        toast.success("Description saved", { duration: 1500 })
        setDescription("") // Clear the textarea after successful save
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to save description")
      }
    } catch (error) {
      console.error("Error saving description:", error)
      toast.error("Failed to save description")
    }
  }

  // Determine current lead attempt status
  const getLeadAttemptStatus = (): string => {
    if (formData.stage === 'closed won') {
      return 'closed'
    } else if (formData.lastContactedAt) {
      return 'attempted'
    } else if (formData.assignedTo) {
      return 'assigned'
    }
    return 'assigned'
  }

  const handleAttemptStatusChange = (value: string) => {
    const now = new Date().toISOString()
    
    switch (value) {
      case 'assigned':
        // Just assigned, no contact yet
        setFormData(prev => ({ 
          ...prev, 
          lastContactedAt: null,
          stage: prev.stage === 'closed won' ? 'new' : prev.stage
        }))
        break
      case 'attempted':
        // Broker made contact
        setFormData(prev => ({ 
          ...prev, 
          lastContactedAt: now,
          stage: prev.stage === 'new' ? 'attempted 1' : prev.stage
        }))
        break
      case 'closed':
        // Deal closed
        setFormData(prev => ({ 
          ...prev, 
          stage: 'closed won',
          lastContactedAt: prev.lastContactedAt || now
        }))
        break
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isBroker) {
      // Admin validation
      if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.phone.trim()) {
        toast.error("Please fill in all required fields")
        return
      }
    }

    try {
      setSaving(true)
      
      // Build update payload based on user role
      const updatePayload = isBroker ? {
        // Brokers can only update these fields
        status: formData.status,
        stage: formData.stage,
        followUp: formData.followUp || null,
        lastContactedAt: formData.lastContactedAt,
      } : {
        // Admins can update all fields
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        source: formData.source,
        subSource: formData.subSource?.trim() || null,
        status: formData.status,
        stage: formData.stage,
        budget: formData.budget?.trim() || null,
        interestedIn: formData.interestedIn?.trim() || null,
        followUp: formData.followUp || null,
        assignedTo: formData.assignedTo || null,
        lastContactedAt: formData.lastContactedAt,
      }
      
      const response = await fetch(`/api/leads?id=${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      })

      if (response.ok) {
        toast.success("Lead updated successfully")
        router.push(`/leads/${params.id}`)
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update lead")
      }
    } catch (error) {
      console.error("Error updating lead:", error)
      toast.error("Failed to update lead")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof Lead, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (isPending || !session?.user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading lead...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/leads/${params.id}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isBroker ? "Update Lead" : "Edit Lead"}
          </h1>
          <p className="text-muted-foreground">
            {isBroker ? "Update lead status and add notes" : "Update lead information"}
          </p>
        </div>
      </div>

      {isBroker && (
        <Alert className="mb-6 border-blue-500/50 bg-blue-500/10">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-500">
            As a broker, you can update the lead stage, status, follow-up, and add comments. Contact details and other fields are read-only.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lead Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  required={!isBroker}
                  disabled={isBroker}
                  className={isBroker ? "bg-muted cursor-not-allowed" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  required={!isBroker}
                  disabled={isBroker}
                  className={isBroker ? "bg-muted cursor-not-allowed" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required={!isBroker}
                  disabled={isBroker}
                  className={isBroker ? "bg-muted cursor-not-allowed" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  required={!isBroker}
                  disabled={isBroker}
                  className={isBroker ? "bg-muted cursor-not-allowed" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">
                  Source <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) => handleChange("source", value)}
                  disabled={isBroker}
                >
                  <SelectTrigger id="source" className={isBroker ? "bg-muted cursor-not-allowed" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCES.map((source) => (
                      <SelectItem key={source} value={source} className="capitalize">
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subSource">Sub-Source</Label>
                <Select
                  value={formData.subSource}
                  onValueChange={(value) => handleChange("subSource", value)}
                  disabled={isBroker}
                >
                  <SelectTrigger id="subSource" className={isBroker ? "bg-muted cursor-not-allowed" : ""}>
                    <SelectValue placeholder="Select sub-source" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUB_SOURCES.map((subSource) => (
                      <SelectItem key={subSource} value={subSource}>
                        {subSource}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">
                  Lead Status <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange("status", value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((status) => (
                      <SelectItem key={status} value={status} className="capitalize">
                        {status === 'hot lead' ? 'Hot Lead' : 
                         status === 'new lead' ? 'New Lead' :
                         status === 'booked lead' ? 'Booked Lead' :
                         status === 'dead lead' ? 'Dead Lead' :
                         status === 'duplicate lead' ? 'Duplicate Lead' :
                         status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage">
                  Pipeline Stage <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.stage}
                  onValueChange={(value) => handleChange("stage", value)}
                >
                  <SelectTrigger id="stage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((stage) => (
                      <SelectItem key={stage} value={stage} className="capitalize">
                        {stage === 'closed won' ? 'Closed Won' : 
                         stage === 'attempted 1' ? 'Attempted 1' :
                         stage === 'attempted 2' ? 'Attempted 2' :
                         stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="followUp">Follow Up</Label>
                <Select
                  value={formData.followUp || "none"}
                  onValueChange={(value) => handleChange("followUp", value === "none" ? null : value)}
                >
                  <SelectTrigger id="followUp">
                    <SelectValue placeholder="Select follow-up action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No follow-up needed</SelectItem>
                    {FOLLOW_UP_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select an action item for following up with this lead
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="attemptStatus">Lead Attempt Status</Label>
                <Select
                  value={getLeadAttemptStatus()}
                  onValueChange={handleAttemptStatusChange}
                >
                  <SelectTrigger id="attemptStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assigned">Assigned Lead</SelectItem>
                    <SelectItem value="attempted">Attempted Lead</SelectItem>
                    <SelectItem value="closed">Closed Lead</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {getLeadAttemptStatus() === 'assigned' && 'Lead is assigned but not yet contacted'}
                  {getLeadAttemptStatus() === 'attempted' && 'Broker has attempted contact with this lead'}
                  {getLeadAttemptStatus() === 'closed' && 'Lead has been successfully closed'}
                </p>
              </div>

              {!isBroker && (
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assigned To</Label>
                  <Select
                    value={formData.assignedTo?.toString() || "unassigned"}
                    onValueChange={(value) => handleChange("assignedTo", value === "unassigned" ? null : parseInt(value))}
                    disabled={brokersLoading}
                  >
                    <SelectTrigger id="assignedTo">
                      <SelectValue placeholder={brokersLoading ? "Loading brokers..." : "Select broker"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {brokers
                        .filter((broker) => broker.isActive)
                        .map((broker) => (
                          <SelectItem key={broker.id} value={broker.id.toString()}>
                            {broker.name} - {broker.company}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="budget">Budget</Label>
                <Input
                  id="budget"
                  value={formData.budget}
                  onChange={(e) => handleChange("budget", e.target.value)}
                  placeholder="e.g., $100,000 - $200,000"
                  disabled={isBroker}
                  className={isBroker ? "bg-muted cursor-not-allowed" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interestedIn">Interested In</Label>
                <Input
                  id="interestedIn"
                  value={formData.interestedIn}
                  onChange={(e) => handleChange("interestedIn", e.target.value)}
                  placeholder="e.g., Apartment, Villa"
                  disabled={isBroker}
                  className={isBroker ? "bg-muted cursor-not-allowed" : ""}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Add Description (Auto-saves)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="Add a description about this lead... (will be saved to descriptions section)"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">Descriptions are automatically saved 2 seconds after you stop typing and will appear in the view page</p>
            </div>

            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/leads/${params.id}`)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}