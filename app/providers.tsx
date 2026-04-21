"use client";

import type React from "react";

import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/context/auth-context";
import { EyeTrackingProvider } from "@/lib/context/eye-tracking-context";
import { ReduxProvider } from "@/components/providers/redux-provider";
import { ReactQueryProvider } from "@/components/providers/react-query-provider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { RoleBasedRouteGuard } from "@/components/providers/role-based-route-guard";
import { useAuth } from "@/lib/context/auth-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HolidayPopup } from "@/components/holiday-popup";

export function AppRouteSyncer() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Khi user bị logout hoặc token hết hạn, xóa last_visited_path
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.removeItem("last_visited_path");
    }
  }, [isAuthenticated]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Register Firebase Service Worker - DISABLED (not effective for browser push)
  useEffect(() => {
    if (false && typeof window !== "undefined" && "serviceWorker" in navigator) {
      console.log("🔥 Registering Firebase Service Worker...");

      // Đăng ký SW ngay lập tức
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((registration) => {
          console.log("✅✅✅ Firebase SW registered successfully:", registration);
          console.log("✅ SW scope:", registration.scope);
          console.log("✅ SW active:", registration.active);
          console.log("✅ SW installing:", registration.installing);
          console.log("✅ SW waiting:", registration.waiting);

          // Listen for controllerchange - khi SW bắt đầu control page
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('🔄 SW Controller changed! Reloading page...');
            // Chỉ reload 1 lần
            if (!sessionStorage.getItem('sw_reloaded')) {
              sessionStorage.setItem('sw_reloaded', 'true');
              window.location.reload();
            }
          });

          // Force update để apply code mới nhất
          registration.update().then(() => {
            console.log("✅ SW updated");
          });
        })
        .catch((error) => {
          console.error("❌❌❌ Firebase SW registration FAILED:", error);
          console.error("❌ Error details:", error.message, error.stack);
        });
    } else {
      console.warn("⚠️ Service Worker not supported in this browser");
    }
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <AppRouteSyncer />
        <ReduxProvider>
          <ReactQueryProvider>
            <EyeTrackingProvider>
              <RoleBasedRouteGuard />
              <TooltipProvider delayDuration={0}>
                {children}
                <HolidayPopup />
              </TooltipProvider>
            </EyeTrackingProvider>
          </ReactQueryProvider>
        </ReduxProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
