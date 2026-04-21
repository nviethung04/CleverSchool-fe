"use client"

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
    Users,
    Crown,
    GraduationCap,
    Wifi,
    WifiOff,
    ChevronDown,
    ChevronUp
} from "lucide-react"

interface OnlineUser {
    id: string
    name: string
    avatar?: string
    role?: "student" | "teacher"
    lastSeen?: string
}

interface OnlineUsersListProps {
    onlineUsers: OnlineUser[]
    currentUser: {
        id: string
        name: string
    }
    totalUsersInCourse?: number
    className?: string
    compact?: boolean
}

export function OnlineUsersList({
    onlineUsers,
    currentUser,
    totalUsersInCourse,
    className = "",
    compact = false
}: OnlineUsersListProps) {
    const t = useTranslations('chat')
    const [isExpanded, setIsExpanded] = useState(!compact)

    // Separate teachers and students
    const teachers = onlineUsers.filter(user => user.role === 'teacher')
    const students = onlineUsers.filter(user => user.role !== 'teacher')

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'teacher':
                return <GraduationCap className="w-3 h-3 text-blue-600" />
            default:
                return null
        }
    }

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'teacher':
                return (
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                        {t("teacher")}
                    </Badge>
                )
            default:
                return null
        }
    }

    const UserItem = ({ user }: { user: OnlineUser }) => {
        const isCurrentUser = user.id === currentUser.id

        return (
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="relative">
                    <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar || "/default-avatar.png"} />
                        <AvatarFallback className="text-xs">
                            {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    {/* Online indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">
                            {isCurrentUser ? t("you") : user.name}
                        </span>
                        {user.role === 'teacher' && getRoleIcon(user.role)}
                    </div>
                    {user.role === 'teacher' && (
                        <div className="mt-0.5">
                            {getRoleBadge(user.role)}
                        </div>
                    )}
                </div>

                {isCurrentUser && (
                    <Badge variant="outline" className="text-xs">
                        {t("you")}
                    </Badge>
                )}
            </div>
        )
    }

    if (compact) {
        return (
            <Card className={`w-full ${className}`}>
                <CardHeader className="pb-2">
                    <Button
                        variant="ghost"
                        className="w-full justify-between p-0 h-auto"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Wifi className="w-4 h-4 text-green-500" />
                            {t("online")} ({onlineUsers.length})
                            {totalUsersInCourse && (
                                <span className="text-xs text-gray-500">
                                    / {totalUsersInCourse}
                                </span>
                            )}
                        </CardTitle>
                        {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                        ) : (
                            <ChevronDown className="w-4 h-4" />
                        )}
                    </Button>
                </CardHeader>

                {isExpanded && (
                    <CardContent className="pt-0">
                        <ScrollArea className="max-h-64">
                            <div className="space-y-1">
                                {/* Teachers first */}
                                {teachers.map(teacher => (
                                    <UserItem key={teacher.id} user={teacher} />
                                ))}

                                {teachers.length > 0 && students.length > 0 && (
                                    <Separator className="my-2" />
                                )}

                                {/* Students */}
                                {students.map(student => (
                                    <UserItem key={student.id} user={student} />
                                ))}

                                {onlineUsers.length === 0 && (
                                    <div className="text-center py-4 text-gray-500">
                                        <WifiOff className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                        <p className="text-sm">{t("noOneOnline")}</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                )}
            </Card>
        )
    }

    return (
        <Card className={`w-full ${className}`}>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {t("onlineUsers")}
                    <Badge variant="secondary" className="ml-auto">
                        {onlineUsers.length}
                        {totalUsersInCourse && `/${totalUsersInCourse}`}
                    </Badge>
                </CardTitle>
            </CardHeader>

            <CardContent>
                <ScrollArea className="max-h-96">
                    <div className="space-y-3">
                        {/* Teachers Section */}
                        {teachers.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <GraduationCap className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-gray-700">
                                        {t("teachers")} ({teachers.length})
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {teachers.map(teacher => (
                                        <UserItem key={teacher.id} user={teacher} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {teachers.length > 0 && students.length > 0 && (
                            <Separator />
                        )}

                        {/* Students Section */}
                        {students.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Users className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-700">
                                        {t("students")} ({students.length})
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {students.map(student => (
                                        <UserItem key={student.id} user={student} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {onlineUsers.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <WifiOff className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                <h3 className="text-lg font-medium mb-2">{t("noOneOnline")}</h3>
                                <p className="text-sm">{t("waitForOthersToJoin")}</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}

export default OnlineUsersList