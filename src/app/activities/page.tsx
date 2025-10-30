"use client"

import * as React from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  UserPlus, 
  UserMinus, 
  Edit, 
  ArrowRightLeft, 
  FileText, 
  Trash2,
  Activity as ActivityIcon
} from "lucide-react"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

interface Activity {
  id: number
  action: string
  entityType: string
  entityId: number
  entityName?: string
  description: string
  metadata?: any
  userId: number
  userName?: string
  userEmail?: string
  createdAt: string
}

export default function ActivitiesPage() {
  const [activities, setActivities] = React.useState<Activity[]>([])
  const [loading, setLoading] = React.useState(true)
  const { data: session, isPending } = useSession()
  const router = useRouter()

  React.useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login")
    }
  }, [session, isPending, router])

  React.useEffect(() => {
    if (session?.user) {
      fetchActivities()
      // Poll for new activities every 5 seconds for real-time updates
      const interval = setInterval(fetchActivities, 5000)
      return () => clearInterval(interval)
    }
  }, [session])

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch("/api/activities", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setActivities(data)
      }
    } catch (error) {
      console.error("Error fetching activities:", error)
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    const icons: Record<string, any> = {
      created: UserPlus,
      deleted: UserMinus,
      updated: Edit,
      "stage-changed": ArrowRightLeft,
      "description-added": FileText,
      "description-updated": FileText,
      "description-deleted": Trash2,
    }
    const Icon = icons[action] || ActivityIcon
    return <Icon className="h-4 w-4" />
  }

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      created: "bg-green-500/10 text-green-500 border-green-500/20",
      deleted: "bg-red-500/10 text-red-500 border-red-500/20",
      updated: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      "stage-changed": "bg-purple-500/10 text-purple-500 border-purple-500/20",
      "description-added": "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      "description-updated": "bg-orange-500/10 text-orange-500 border-orange-500/20",
      "description-deleted": "bg-red-500/10 text-red-500 border-red-500/20",
    }
    return colors[action] || "bg-gray-500/10 text-gray-500 border-gray-500/20"
  }

  const formatTimeAgo = (date: string) => {
    const now = new Date()
    const activityDate = new Date(date)
    const seconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000)

    if (seconds < 60) return "Just now"
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`
    return activityDate.toLocaleDateString()
  }

  if (isPending) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground">
            Real-time tracking of all broker actions and changes
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>
                {loading ? "Loading..." : `${activities.length} activities tracked`}
              </CardDescription>
            </div>
            <Badge variant="outline" className="gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Live
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading activities...</div>
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ActivityIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No activities yet</p>
              <p className="text-sm text-muted-foreground">
                Broker actions will appear here in real-time
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className="flex gap-4 p-4 rounded-lg border border-border/50 hover:border-border transition-colors"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${getActionColor(activity.action)}`}>
                    {getActionIcon(activity.action)}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">
                        {activity.description}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {activity.entityType}
                      </Badge>
                    </div>
                    
                    {activity.metadata && (
                      <div className="text-xs text-muted-foreground">
                        {activity.metadata.from && activity.metadata.to && (
                          <span>
                            Changed from <span className="font-medium">{activity.metadata.from}</span> to{" "}
                            <span className="font-medium">{activity.metadata.to}</span>
                          </span>
                        )}
                        {activity.metadata.field && (
                          <span>
                            Field: <span className="font-medium">{activity.metadata.field}</span>
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Avatar className="h-4 w-4">
                        <AvatarFallback className="text-[8px]">
                          {activity.userName?.charAt(0).toUpperCase() || "B"}
                        </AvatarFallback>
                      </Avatar>
                      <span>{activity.userName || activity.userEmail || "Broker"}</span>
                      <span>•</span>
                      <span>{formatTimeAgo(activity.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground shrink-0">
                    {new Date(activity.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}