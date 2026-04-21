"use client";

import { useEffect } from "react";
import { onMessageListener } from "@/lib/firebase/messaging";
import { useToast } from "@/hooks/use-toast";

/**
 * Global FCM Message Listener
 * Component này sẽ lắng nghe tất cả foreground messages
 */
export default function FCMListener() {
    const { toast } = useToast();

    useEffect(() => {
        if (typeof window === "undefined") return;

        console.log("🔔 FCM Listener initialized");
        console.log("🔔 Permission status:", Notification.permission);

        // Lắng nghe foreground messages với callback
        const unsubscribe = onMessageListener((payload: any) => {
            console.log("===== FOREGROUND MESSAGE RECEIVED =====");
            console.log("📬 Full payload:", JSON.stringify(payload, null, 2));

            const title = payload.notification?.title || "Thông báo mới";
            const body = payload.notification?.body || "";

            console.log("📬 Title:", title);
            console.log("📬 Body:", body);
            console.log("📬 Data:", payload.data);

            // Show toast notification
            console.log("📬 Showing toast notification...");
            toast({
                title: title,
                description: body,
                duration: 5000,
            });

            // Show browser notification popup
            if (Notification.permission === "granted") {
                console.log("📬 Document visibility:", document.visibilityState);
                console.log("📬 Document focused:", document.hasFocus());

                // Chrome chặn notification khi tab visible + focused
                // Workaround: Luôn dùng SW showNotification
                if ('serviceWorker' in navigator) {
                    console.log("📬 Using Service Worker to show notification...");

                    navigator.serviceWorker.ready.then(registration => {
                        console.log("📬 SW Ready, showing notification...");
                        const uniqueTag = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                        return registration.showNotification(title, {
                            body: body,
                            icon: payload.notification?.icon || "/logo-urp.png",
                            badge: "/logo-urp.png",
                            tag: uniqueTag,
                            requireInteraction: true,
                            data: payload.data,
                        } as any);
                    }).then(() => {
                        console.log("📬 🎉🎉🎉 SW Notification SHOWN successfully!");
                    }).catch((error: any) => {
                        console.error("📬 ❌ SW notification error:", error);
                        console.error("📬 Error name:", error?.name);
                        console.error("📬 Error message:", error?.message);
                    });
                } else {
                    console.warn("📬 ⚠️ Service Worker not available");
                }
            } else {
                console.warn("📬 ⚠️ Notification permission:", Notification.permission);
            }

            console.log("📬 ✅ Foreground notification handled");
        });

        console.log("🔔 Listener setup complete");

        // Cleanup khi unmount
        return () => {
            console.log("🔕 FCM Listener cleaned up");
            if (typeof unsubscribe === "function") {
                unsubscribe();
            }
        };
    }, [toast]);

    return null; // Không render gì cả, chỉ lắng nghe
}
