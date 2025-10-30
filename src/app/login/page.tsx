"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { authClient, useSession } from "@/lib/auth-client"

export default function LoginPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
  })

  // Redirect if already logged in
  useEffect(() => {
    if (!isPending && session?.user) {
      const redirectPath = session.user.role === 'broker' ? '/broker/leads' : '/'
      window.location.href = redirectPath
    }
  }, [session, isPending])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await authClient.signIn.email({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      })

      if (error?.code) {
        toast.error("Invalid email or password. Please make sure you have already registered an account and try again.")
        setIsLoading(false)
        return
      }

      if (!data?.user) {
        toast.error("Login failed. Please try again.")
        setIsLoading(false)
        return
      }

      toast.success("Login successful! Redirecting...")
      
      // Determine redirect path based on role
      const redirectPath = data.user.role === 'broker' ? '/broker/leads' : '/'
      
      // Use setTimeout to ensure toast is visible, then full page reload
      setTimeout(() => {
        window.location.href = redirectPath
      }, 1000)
      
    } catch (error) {
      console.error("Login error:", error)
      toast.error("An error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  // Show loading while checking session
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Don't show login form if already logged in
  if (session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary mb-4">
            <Building2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to GrowthstermediaCRM
          </p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@growthstermedia.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={isLoading}
                    autoComplete="off"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                  disabled={isLoading}
                  className="h-4 w-4 rounded border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <Label 
                  htmlFor="rememberMe"
                  className="text-sm font-normal cursor-pointer"
                >
                  Remember me
                </Label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 space-y-3">
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-2">Admin Login:</p>
                <div className="space-y-1 text-sm">
                  <p className="font-mono text-xs">
                    <span className="text-muted-foreground">Email:</span>{" "}
                    <span className="text-foreground">admin@growthstermedia.com</span>
                  </p>
                  <p className="font-mono text-xs">
                    <span className="text-muted-foreground">Password:</span>{" "}
                    <span className="text-foreground">Admin@2025</span>
                  </p>
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-xs font-medium text-primary mb-2">Broker Login:</p>
                <div className="space-y-1 text-sm">
                  <p className="font-mono text-xs">
                    <span className="text-muted-foreground">Email:</span>{" "}
                    <span className="text-foreground">broker@test.com</span>
                  </p>
                  <p className="font-mono text-xs">
                    <span className="text-muted-foreground">Password:</span>{" "}
                    <span className="text-foreground">broker123</span>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          © 2025 GrowthstermediaCRM. All rights reserved.
        </p>
      </div>
    </div>
  )
}