"use client"

import { AuthProvider } from "./lib/context/auth-context"
import type { ReactNode } from "react"
import { useEffect } from "react"

export function Providers({ children }: { children: ReactNode }) {
    // Register Firebase Service Worker
    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            console.log("🔥 Registering Firebase Service Worker...");

            // Đăng ký SW ngay lập tức
            navigator.serviceWorker
                .register("/firebase-messaging-sw.js")
                .then((registration) => {
                    // console.log("✅✅✅ Firebase SW registered successfully:", registration);
                    // console.log("✅ SW scope:", registration.scope);
                    // console.log("✅ SW active:", registration.active);
                    // console.log("✅ SW installing:", registration.installing);
                    // console.log("✅ SW waiting:", registration.waiting);

                    // Listen for controllerchange - khi SW bắt đầu control page
                    navigator.serviceWorker.addEventListener('controllerchange', () => {
                        // console.log('🔄 SW Controller changed! Reloading page...');
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

    return <AuthProvider>{children}</AuthProvider>
}

// Export AppRouteSyncer if needed
export function AppRouteSyncer() {
    // Your route syncing logic here
    return null
}
