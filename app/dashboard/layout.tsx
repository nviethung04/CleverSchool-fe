import type React from "react"
import { ProtectedRoute } from "@/lib/middleware/auth-middleware"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedRoute allowedRoles={["student"]}>{children}</ProtectedRoute>
}
