"use client";

import { useEffect, useState } from "react";
import { initializeFCM } from "@/lib/firebase/messaging";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";

export default function NotificationPermissionButton() {
    const { toast } = useToast();
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>("default");
    const [isRegistered, setIsRegistered] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Check current permission status AND localStorage
        if (typeof window !== "undefined" && "Notification" in window) {
            setPermissionStatus(Notification.permission);

            // Check if token is registered in localStorage
            const registered = localStorage.getItem("fcm_token_registered") === "true";
            setIsRegistered(registered);
        }
    }, []);

    const handleEnableNotifications = async () => {
        setIsLoading(true);
        try {
            const token = await initializeFCM();

            if (token) {
                setPermissionStatus("granted");
                setIsRegistered(true);
                toast({
                    title: "Thành công",
                    description: "Đã bật thông báo push",
                });
            } else {
                toast({
                    title: "Thất bại",
                    description: "Không thể bật thông báo. Vui lòng kiểm tra cài đặt trình duyệt.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error enabling notifications:", error);
            toast({
                title: "Lỗi",
                description: "Có lỗi xảy ra khi bật thông báo",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Don't render if browser doesn't support notifications
    if (typeof window === "undefined" || !("Notification" in window)) {
        return null;
    }

    // Show "enabled" if permission granted AND token registered
    if (permissionStatus === "granted" && isRegistered) {
        return (
            <div className="flex items-center gap-2 text-sm text-green-600">
                <Bell className="w-4 h-4" />
                <span>Thông báo đã bật</span>
            </div>
        );
    }

    // Don't show if permanently denied
    if (permissionStatus === "denied") {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <BellOff className="w-4 h-4" />
                <span>Thông báo đã bị chặn</span>
            </div>
        );
    }

    return (
        <button
            onClick={handleEnableNotifications}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md disabled:opacity-50 disabled:pointer-events-none"
        >
            <Bell className="w-4 h-4" />
            {isLoading ? "Đang xử lý..." : "Bật thông báo push"}
        </button>
    );
}
