import React from "react";
import { TeacherDashboardHeader } from "@/components/teacher-dashboard-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { useAuth } from "@/lib/context/auth-context";
import { SidebarProvider, useAdminSidebar } from "@/lib/context/sidebar-context";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useMounted } from "@/hooks/use-mounted";

/**
 * Mobile menu button for opening sidebar on mobile
 * Uses safe hook that won't throw if context is unavailable
 */
const MobileMenuButton: React.FC = () => {
  try {
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
  } catch (error) {
    // Fallback: don't render anything if context is not available
    console.warn('MobileMenuButton: Sidebar context not available', error);
    return null;
  }
};

/**
 * Content wrapper that adjusts margin based on sidebar state
 * Uses safe context access with fallbacks
 */
const AdminContentWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  try {
    const { expanded, setExpanded, isMobile } = useAdminSidebar();
    
    return (
      <>
        {/* Mobile overlay */}
        {isMobile && expanded && (
          <div 
            className="fixed inset-0 bg-black/50 z-20"
            onClick={() => setExpanded(false)}
          />
        )}
        
        <div 
          className={`min-h-screen transition-all duration-300 ${
            isMobile 
              ? "ml-0" // No margin on mobile
              : expanded 
                ? "ml-[17.5rem]" // w-70 equivalent (17.5rem = 280px)
                : "ml-20" // w-20 equivalent (5rem = 80px)
          }`}
        >
          {children}
        </div>
      </>
    );
  } catch (error) {
    // Fallback: render without sidebar adjustments
    console.warn('AdminContentWrapper: Sidebar context not available, using fallback', error);
    return (
      <div className="min-h-screen">
        {children}
      </div>
    );
  }
};

/**
 * Wrapper for role-based layout: shows TeacherDashboardHeader for teachers, AdminSidebar for admins.
 * Content is always rendered in a flex row for admin, normal for teacher.
 */
export const RoleBasedHeaderSidebar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const mounted = useMounted();

  // Defer role-specific chrome until client mount — prevents Radix id hydration mismatches.
  if (!mounted) {
    return <div className="min-h-screen">{children}</div>;
  }

  if (user?.type === "admin") {
    return (
      <SidebarProvider>
        <AdminLayoutInternal>
          {children}
        </AdminLayoutInternal>
      </SidebarProvider>
    );
  }
  
  // Default: teacher
  return (
    <div className="min-h-screen">
      <TeacherDashboardHeader />
      {children}
    </div>
  );
};

/**
 * Internal admin layout that uses the sidebar context
 * This component is always rendered inside SidebarProvider
 */
const AdminLayoutInternal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  try {
    const { expanded, isMobile } = useAdminSidebar();
    
    return (
      <div className="min-h-screen">
        <MobileMenuButton />
        <div className={`fixed top-0 left-0 h-screen transition-transform duration-300 z-30 ${
          isMobile && !expanded ? "-translate-x-full" : "translate-x-0"
        }`}>
          <AdminSidebar />
        </div>
        <AdminContentWrapper>
          {children}
        </AdminContentWrapper>
      </div>
    );
  } catch (error) {
    // Fallback: render basic layout without sidebar functionality
    console.warn('AdminLayoutInternal: Sidebar context not available, using fallback layout', error);
    return (
      <div className="min-h-screen">
        <div className="fixed top-0 left-0 h-screen z-30 w-[17.5rem]">
          <AdminSidebar />
        </div>
        <div className="ml-[17.5rem] min-h-screen">
          {children}
        </div>
      </div>
    );
  }
};
