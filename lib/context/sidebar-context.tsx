"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Context for managing the admin sidebar state (expanded/collapsed, mobile detection)
 * This is separate from the UI sidebar components to avoid naming conflicts
 */
interface AdminSidebarContextType {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  isMobile: boolean;
}

const AdminSidebarContext = createContext<AdminSidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check if we're on mobile
  useEffect(() => {
    if (!isClient) return;

    const checkIfMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setExpanded(false);
      }
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, [isClient]);

  return (
    <AdminSidebarContext.Provider value={{ expanded, setExpanded, isMobile }}>
      {children}
    </AdminSidebarContext.Provider>
  );
}

export function useAdminSidebar() {
  const context = useContext(AdminSidebarContext);
  if (context === undefined) {
    // More helpful error message with debugging info
    const componentStack = new Error().stack;
    console.error('useAdminSidebar called outside SidebarProvider. Component stack:', componentStack);
    throw new Error('useAdminSidebar must be used within a SidebarProvider. Make sure you are calling this hook inside an admin layout. Check the console for component stack trace.');
  }
  return context;
}

// Optional: Safe hook that returns null if not in provider
export function useAdminSidebarSafe() {
  const context = useContext(AdminSidebarContext);
  return context || null;
}
