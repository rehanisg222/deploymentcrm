"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

interface BrokerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  broker?: {
    id: number
    name: string
    company: string
    email: string
    phone: string
    commission?: string
    totalDeals: number
    totalRevenue: string
    isActive: boolean
  }
  onSuccess?: () => void
}

export function BrokerFormDialog({ open, onOpenChange, broker, onSuccess }: BrokerFormDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    commission: "",
    totalDeals: 0,
    totalRevenue: "0",
    isActive: true
  })

  React.useEffect(() => {
    if (broker) {
      setFormData({
        name: broker.name,
        company: broker.company,
        email: broker.email,
        phone: broker.phone,
        commission: broker.commission || "",
        totalDeals: broker.totalDeals,
        totalRevenue: broker.totalRevenue,
        isActive: broker.isActive
      })
    } else {
      setFormData({
        name: "",
        company: "",
        email: "",
        phone: "",
        commission: "",
        totalDeals: 0,
        totalRevenue: "0",
        isActive: true
      })
    }
  }, [broker, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = broker 
        ? `/api/brokers?id=${broker.id}`
        : "/api/brokers"
      
      const method = broker ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...formData,
          joinedAt: broker?.id ? undefined : new Date().toISOString()
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(broker ? "Broker updated successfully" : "Broker added successfully")
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error(data.error || "An error occurred")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Failed to save broker")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{broker ? "Edit Broker" : "Add New Broker"}</DialogTitle>
          <DialogDescription>
            {broker ? "Update broker information" : "Add a new broker to your network"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company *</Label>
                <Input
                  id="company"
                  placeholder="ABC Realty"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  placeholder="+1 234 567 8900"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commission">Commission Rate</Label>
                <Input
                  id="commission"
                  placeholder="5%"
                  value={formData.commission}
                  onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalDeals">Total Deals</Label>
                <Input
                  id="totalDeals"
                  type="number"
                  min="0"
                  value={formData.totalDeals}
                  onChange={(e) => setFormData({ ...formData, totalDeals: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalRevenue">Total Revenue ($)</Label>
              <Input
                id="totalRevenue"
                type="number"
                min="0"
                step="0.01"
                value={formData.totalRevenue}
                onChange={(e) => setFormData({ ...formData, totalRevenue: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isActive" className="text-base cursor-pointer">
                  Active Status
                </Label>
                <p className="text-sm text-muted-foreground">
                  {formData.isActive 
                    ? "Broker is active and can be assigned to leads" 
                    : "Broker is inactive and won't appear in assignment lists"}
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : broker ? "Update Broker" : "Add Broker"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}