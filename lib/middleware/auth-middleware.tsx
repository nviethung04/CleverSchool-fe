"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/context/auth-context"
import { getDefaultRoute } from "@/lib/utils/route-utils"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ("student" | "teacher" | "admin")[]
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    // If roles are specified and user doesn't have any of them, redirect to default route
    if (allowedRoles && allowedRoles.length > 0 && user?.type && !allowedRoles.includes(user.type)) {
      const defaultRoute = getDefaultRoute(user)
      router.push(defaultRoute)
      return
    }
  }, [isAuthenticated, user, isLoading, router, allowedRoles])

  // Show loading state
  if (isLoading) {
    return <div>Loading...</div>
  }

  // If not authenticated or doesn't have required role, don't render children
  if (
    !isAuthenticated ||
    (allowedRoles && allowedRoles.length > 0 && user?.type && !allowedRoles.includes(user.type))
  ) {
    return null
  }

  return <>{children}</>
}
