"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface AddLeadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
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

export function AddLeadDialog({ open, onOpenChange, onSuccess }: AddLeadDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const [projects, setProjects] = React.useState<Project[]>([])
  const [users, setUsers] = React.useState<User[]>([])
  const [brokers, setBrokers] = React.useState<Broker[]>([])
  const [formData, setFormData] = React.useState({
    name: "",
    mobile: "",
    projectId: "none",
    source: "select-source",
    subSource: "none",
    nextCallDate: "",
    status: "new lead",
    stage: "new",
    assignedTo: "none",
    brokerId: "none",
    description: "",
  })

  React.useEffect(() => {
    if (open) {
      fetchProjects()
      fetchUsers()
      fetchBrokers()
    }
  }, [open])

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const fetchBrokers = async () => {
    try {
      const response = await fetch("/api/brokers")
      if (response.ok) {
        const data = await response.json()
        setBrokers(data)
      }
    } catch (error) {
      console.error("Error fetching brokers:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.mobile || !formData.source || formData.source === "select-source") {
      toast.error("Please fill in all required fields")
      return
    }

    // Split name into firstName and lastName
    const nameParts = formData.name.trim().split(" ")
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || nameParts[0] || ""

    setLoading(true)

    try {
      const payload: any = {
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@temp.com`, // Temporary email since it's required
        phone: formData.mobile,
        source: formData.source,
        status: formData.status,
        stage: formData.stage,
      }

      if (formData.projectId && formData.projectId !== "none") payload.projectId = parseInt(formData.projectId)
      if (formData.subSource && formData.subSource !== "none") payload.subSource = formData.subSource
      if (formData.nextCallDate) payload.nextCallDate = new Date(formData.nextCallDate).toISOString()
      if (formData.assignedTo && formData.assignedTo !== "none") payload.assignedTo = parseInt(formData.assignedTo)
      if (formData.brokerId && formData.brokerId !== "none") payload.brokerId = parseInt(formData.brokerId)

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const newLead = await response.json()
        
        // If description is provided, create a description for the lead
        if (formData.description.trim()) {
          try {
            await fetch('/api/lead-comments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                leadId: newLead.id,
                description: formData.description.trim(),
              }),
            })
          } catch (error) {
            console.error("Error adding description:", error)
          }
        }
        
        toast.success("Lead added successfully!")
        setFormData({
          name: "",
          mobile: "",
          projectId: "none",
          source: "select-source",
          subSource: "none",
          nextCallDate: "",
          status: "new lead",
          stage: "new",
          assignedTo: "none",
          brokerId: "none",
          description: "",
        })
        onOpenChange(false)
        onSuccess()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to add lead")
      }
    } catch (error) {
      console.error("Error adding lead:", error)
      toast.error("Failed to add lead")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
          <DialogDescription>
            Fill in the lead information below. Required fields are marked with *
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Enter full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Mobile */}
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile *</Label>
              <Input
                id="mobile"
                placeholder="Enter mobile number"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                required
              />
            </div>

            {/* Projects */}
            <div className="space-y-2">
              <Label htmlFor="project">Projects</Label>
              <Select
                value={formData.projectId}
                onValueChange={(value) => setFormData({ ...formData, projectId: value })}
              >
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Source */}
            <div className="space-y-2">
              <Label htmlFor="source">Source *</Label>
              <Select
                value={formData.source}
                onValueChange={(value) => setFormData({ ...formData, source: value })}
                required
              >
                <SelectTrigger id="source">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="select-source" disabled>Select source</SelectItem>
                  <SelectItem value="organic">Organic</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="walk-in">Walk-in</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* SubSource */}
            <div className="space-y-2">
              <Label htmlFor="subSource">SubSource</Label>
              <Select
                value={formData.subSource}
                onValueChange={(value) => setFormData({ ...formData, subSource: value })}
              >
                <SelectTrigger id="subSource">
                  <SelectValue placeholder="Select subsource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="google-ads">Google Ads</SelectItem>
                  <SelectItem value="email-campaign">Email Campaign</SelectItem>
                  <SelectItem value="phone-inquiry">Phone Inquiry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Next Call Date */}
            <div className="space-y-2">
              <Label htmlFor="nextCallDate">Next Call Date</Label>
              <Input
                id="nextCallDate"
                type="datetime-local"
                value={formData.nextCallDate}
                onChange={(e) => setFormData({ ...formData, nextCallDate: e.target.value })}
              />
            </div>

            {/* Lead Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Lead Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
                required
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hot lead">Hot Lead</SelectItem>
                  <SelectItem value="new lead">New Lead</SelectItem>
                  <SelectItem value="booked lead">Booked Lead</SelectItem>
                  <SelectItem value="dead lead">Dead Lead</SelectItem>
                  <SelectItem value="duplicate lead">Duplicate Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pipeline Stage */}
            <div className="space-y-2">
              <Label htmlFor="stage">Pipeline Stage *</Label>
              <Select
                value={formData.stage}
                onValueChange={(value) => setFormData({ ...formData, stage: value })}
                required
              >
                <SelectTrigger id="stage">
                  <SelectValue placeholder="Select stage" />
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

            {/* Assign To */}
            <div className="space-y-2">
              <Label htmlFor="assignTo">Assign To</Label>
              <Select
                value={formData.assignedTo}
                onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
              >
                <SelectTrigger id="assignTo">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assign Broker */}
            <div className="space-y-2">
              <Label htmlFor="broker">Assign Broker</Label>
              <Select
                value={formData.brokerId}
                onValueChange={(value) => setFormData({ ...formData, brokerId: value })}
              >
                <SelectTrigger id="broker">
                  <SelectValue placeholder="Select broker" />
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
            </div>

            {/* Description - Full Width */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add a description about this lead..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}