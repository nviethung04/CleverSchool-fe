"use client"

import type { ReactNode } from "react"
import { ProtectedRoute } from "@/lib/middleware/auth-middleware"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { SidebarProvider, useAdminSidebar } from "@/lib/context/sidebar-context"
import { Toaster } from "@/components/ui/toaster"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

// Mobile menu button for admin layout
function AdminMobileMenuButton() {
    const { setExpanded, isMobile, expanded } = useAdminSidebar();

    if (!isMobile || expanded) return null;

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(true)}
            className="fixed top-4 left-4 z-40 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white"
        >
            <Menu className="h-5 w-5" />
        </Button>
    );
}

// Responsive admin layout content
function AdminLayoutContent({ children }: { children: ReactNode }) {
    const { expanded, setExpanded, isMobile } = useAdminSidebar();

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Mobile overlay */}
            {isMobile && expanded && (
                <div
                    className="fixed inset-0 bg-black/50 z-20"
                    onClick={() => setExpanded(false)}
                />
            )}

            <AdminMobileMenuButton />

            {/* Sidebar */}
            <div className={`transition-transform duration-300 z-30 ${isMobile && !expanded ? "-translate-x-full fixed" : "relative"
                }`}>
                <AdminSidebar />
            </div>

            {/* Main content */}
            <main className={`flex-1 overflow-y-auto p-2 transition-all duration-300 ${isMobile ? "ml-0" : expanded ? "ml-0" : "ml-0"
                }`}>
                <div className="mx-auto max-w-9xl">{children}</div>
            </main>

            <Toaster />
        </div>
    );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <SidebarProvider>
                <AdminLayoutContent>
                    {children}
                </AdminLayoutContent>
            </SidebarProvider>
        </ProtectedRoute>
    )
}
