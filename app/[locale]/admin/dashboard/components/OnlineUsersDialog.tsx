"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, User, Clock, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { getActiveUsersList } from "@/lib/api/dashboard";

interface OnlineUser {
    id: number;
    name: string;
    email: string;
    username: string;
    online_duration: string;
    last_activity_time: string;
}

interface OnlineUsersDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function OnlineUsersDialog({
    isOpen,
    onClose,
}: OnlineUsersDialogProps) {
    const t = useTranslations("admin.dashboard");
    const [users, setUsers] = useState<OnlineUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        hasNextPage: false,
    });

    const loadUsers = async (page = 1, loadMore = false) => {
        try {
            setLoading(true);
            const response = await getActiveUsersList({
                minutes: 15,
                page,
                limit: 20,
            });

            if (response.code === 200 && response.data) {
                const newUsers = response.data.users || [];

                if (loadMore && page > 1) {
                    setUsers(prev => [...prev, ...newUsers]);
                } else {
                    setUsers(newUsers);
                }

                setPagination({
                    currentPage: response.data.page || 1,
                    totalPages: response.data.total_pages || 1,
                    totalItems: response.data.total_active_users || 0,
                    hasNextPage: (response.data.page || 1) < (response.data.total_pages || 1),
                });
            }
        } catch (error) {
            console.error("Failed to load online users:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        if (pagination.hasNextPage && !loading) {
            loadUsers(pagination.currentPage + 1, true);
        }
    };

    const refresh = () => {
        loadUsers(1, false);
    };

    useEffect(() => {
        if (isOpen) {
            loadUsers(1, false);
        }
    }, [isOpen]);

    const formatTime = (timeString: string) => {
        try {
            const date = new Date(timeString);
            return date.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return timeString;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                        <Activity className="h-5 w-5 text-cyan-500" />
                        {t("onlineUsers.title")}
                    </DialogTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={refresh}
                        disabled={loading}
                        className="ml-auto"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            {t("onlineUsers.totalFound", { count: pagination.totalItems })}
                        </p>
                        <Badge variant="secondary" className="bg-cyan-100 text-cyan-800">
                            {t("onlineUsers.last15Minutes")}
                        </Badge>
                    </div>

                    <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-3">
                            {users.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                                            <User className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <div className="font-medium">{user.name || user.username}</div>
                                            <div className="text-sm text-muted-foreground">
                                                @{user.username}
                                            </div>
                                        </div>
                                    </div>
                                    {/* <div className="text-right">
                                        <div className="text-sm font-medium text-cyan-600">
                                            {user.online_duration}
                                        </div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatTime(user.last_activity_time)}
                                        </div>
                                    </div> */}
                                </div>
                            ))}

                            {loading && users.length === 0 && (
                                <div className="flex items-center justify-center py-8">
                                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                                    <span className="ml-2 text-muted-foreground">
                                        {t("common.loading")}
                                    </span>
                                </div>
                            )}

                            {!loading && users.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    {t("onlineUsers.noUsers")}
                                </div>
                            )}
                        </div>

                        {pagination.hasNextPage && (
                            <div className="flex justify-center pt-4">
                                <Button
                                    variant="outline"
                                    onClick={loadMore}
                                    disabled={loading}
                                    className="w-full"
                                >
                                    {loading ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                            {t("common.loading")}
                                        </>
                                    ) : (
                                        t("common.loadMore")
                                    )}
                                </Button>
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}