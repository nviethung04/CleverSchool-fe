"use client"

import type { ReactNode } from "react"
import { ProtectedRoute } from "@/lib/middleware/auth-middleware"

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <ProtectedRoute allowedRoles={["teacher"]}>
                    {children}
        </ProtectedRoute>
    )
}
