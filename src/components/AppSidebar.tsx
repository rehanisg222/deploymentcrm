"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  TrendingUp,
  FileText,
  Settings,
  Search,
  Bell,
  User,
  LogOut,
  ChevronDown,
  ListFilter,
  BarChart3,
  Briefcase,
  UserCheck,
  Activity,
  Database } from
"lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient, useSession } from "@/lib/auth-client";
import { toast } from "sonner";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter } from
"@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// Admin menu items
const adminMenuItems = [
{
  title: "Main",
  items: [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard
  },
  {
    title: "Leads",
    url: "/leads",
    icon: Users
  },
  {
    title: "Pipeline",
    url: "/pipeline",
    icon: TrendingUp
  },
  {
    title: "Projects",
    url: "/projects",
    icon: Building2
  },
  {
    title: "Activities",
    url: "/activities",
    icon: Activity
  }]

},
{
  title: "Analytics",
  items: [
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3
  },
  {
    title: "Trends",
    url: "/reports/trends",
    icon: TrendingUp
  },
  {
    title: "Campaigns",
    url: "/campaigns",
    icon: Briefcase
  }]

},
{
  title: "Management",
  items: [
  {
    title: "Brokers",
    url: "/brokers",
    icon: UserCheck
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings
  },
  {
    title: "Audit Logs",
    url: "/audit",
    icon: FileText
  }]

}];

// Broker menu items (restricted)
const brokerMenuItems = [
{
  title: "Main",
  items: [
  {
    title: "Leads",
    url: "/broker/leads",
    icon: Users
  },
  {
    title: "Pipeline",
    url: "/broker/pipeline",
    icon: TrendingUp
  }]
},
{
  title: "Analytics",
  items: [
  {
    title: "Reports",
    url: "/broker/reports",
    icon: BarChart3
  }]
}];


export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending, refetch } = useSession();

  const handleSignOut = async () => {
    try {
      const { error } = await authClient.signOut();
      if (error?.code) {
        toast.error("Failed to sign out. Please try again.");
      } else {
        localStorage.removeItem("bearer_token");
        refetch();
        toast.success("Signed out successfully");
        router.push("/login");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    }
  };

  // Determine which menu items to show based on user role - NO DEFAULT
  const userRole = session?.user?.role;
  const menuItems = userRole === 'broker' ? brokerMenuItems : adminMenuItems;

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold !whitespace-pre-line">GrowthstermediaCRM</span>
            <span className="text-xs text-muted-foreground">Property Management</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {menuItems.map((group) =>
        <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) =>
              <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
              )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t border-border p-4">
        {isPending ? (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-muted rounded animate-pulse" />
              <div className="h-2 bg-muted rounded w-3/4 animate-pulse" />
            </div>
          </div>
        ) : session?.user ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.email}`} />
                <AvatarFallback>{session.user.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col items-start text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{session.user.name || "User"}</span>
                  {userRole === 'broker' && (
                    <Badge variant="secondary" className="text-xs">Broker</Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{session.user.email}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm">
                <p className="font-medium">{session.user.name}</p>
                <p className="text-xs text-muted-foreground">{session.user.email}</p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">Role: {userRole || 'Unknown'}</p>
              </div>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </SidebarFooter>
    </Sidebar>);

}