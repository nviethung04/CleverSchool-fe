import React from "react"
import { useTranslations } from "next-intl"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pin } from "lucide-react"
import FileMessage, { type FileAttachment } from "@/components/FileMessage"
import { MessageActions } from "@/components/ui/message-actions"

interface MessageItemProps {
    message: {
        id: string
        content: string
        timestamp: string
        user: {
            id: string
            name: string
            avatar?: string
            role?: string
        }
        files?: FileAttachment[]
        replyTo?: {
            id: string
            content: string
            user: {
                id: string
                name: string
            }
            files?: FileAttachment[]
        }
        isPinned?: boolean
    }
    currentUser: {
        id: string
        name: string
    }
    onlineUsers: Array<{
        id: string
        name: string
        avatar?: string
    }>
    onReply: (messageId: string) => void
    onCopy: (content: string) => void
    onPin: (messageId: string) => void
    onUnpin: (messageId: string) => void
    onDelete: (messageId: string) => void
}

const MessageItem = React.memo<MessageItemProps>(({
    message,
    currentUser,
    onlineUsers,
    onReply,
    onCopy,
    onPin,
    onUnpin,
    onDelete,
}) => {
    const t = useTranslations("chat")
    const isCurrentUser = message.user.id === currentUser.id

    // Helper function to format time with locale support
    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

        if (diffInHours < 24) {
            // Same day - show time only
            return date.toLocaleTimeString(t("locale"), {
                hour: "2-digit",
                minute: "2-digit",
            })
        } else if (diffInHours < 48) {
            // Yesterday
            return `${t("yesterday")} ${date.toLocaleTimeString(t("locale"), {
                hour: "2-digit",
                minute: "2-digit",
            })}`
        } else {
            // More than 2 days ago - show date and time
            return date.toLocaleDateString(t("locale"), {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            })
        }
    }

    return (
        <div
            className={`flex gap-3 group ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}
        >
            <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage src={message.user.avatar || "/placeholder.svg"} />
                <AvatarFallback>{message.user.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div
                className={`flex-1 min-w-0 ${isCurrentUser ? "max-w-[80%] flex flex-col items-end" : "max-w-fit"
                    }`}
            >
                <div
                    className={`flex items-center gap-2 mb-1 ${isCurrentUser ? "flex-row-reverse" : "flex-row"
                        }`}
                >
                    <span className="font-medium text-sm text-gray-900">
                        {isCurrentUser ? t("you") : message.user.name}
                    </span>
                    {message.user.role === "teacher" && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                            {t("teacher")}
                        </Badge>
                    )}
                    <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                    {message.isPinned && <Pin className="w-3 h-3 text-orange-500" />}
                </div>

                {/* Message content container with actions */}
                <div
                    className={`relative ${isCurrentUser ? "flex flex-col items-end" : "flex flex-col items-start"
                        }`}
                >
                    {/* Reply reference - Show if this message is replying to another */}
                    {message.replyTo && (
                        <div className={`mb-2 max-w-sm ${isCurrentUser ? "self-end" : "self-start"}`}>
                            <div
                                className={`text-xs p-2 rounded-md border-l-2 ${isCurrentUser
                                    ? "bg-blue-400 border-blue-200 text-blue-100"
                                    : "bg-gray-50 border-gray-300 text-gray-600"
                                    }`}
                            >
                                <div className="flex items-center gap-1 mb-1">
                                    <div className="w-2 h-2 rounded-full bg-current opacity-70"></div>
                                    <span className="font-medium">
                                        {t("replyTo")} {message.replyTo.user.id === currentUser.id ? t("you").toLowerCase() : message.replyTo.user.name}
                                    </span>
                                </div>
                                <div className="opacity-80 truncate">
                                    {message.replyTo.content || (message.replyTo.files && message.replyTo.files.length > 0 
                                        ? `📎 ${message.replyTo.files[0].name}${message.replyTo.files.length > 1 ? ` (+${message.replyTo.files.length - 1})` : ''}`
                                        : t("fileMessage"))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div
                        className={`rounded-lg text-sm ${isCurrentUser
                            ? "bg-blue-500 text-white rounded-br-sm shadow-md"
                            : "bg-gray-100 text-gray-900 rounded-bl-sm shadow-sm"
                            } ${message.files && message.files.length > 0 ? "overflow-hidden p-2" : "p-3"}`}
                    >
                        {/* Text-only message */}
                        {message.content && (!message.files || message.files.length === 0) && message.content}

                        {/* File message with optional text */}
                        {message.files && message.files.length > 0 && (
                            <FileMessage
                                files={message.files}
                                message={message.content || undefined}
                                isCurrentUser={isCurrentUser}
                                compact={true}
                            />
                        )}
                    </div>

                    {/* Message Actions - Show on hover */}
                    <div
                        className={`absolute top-0 z-10 ${isCurrentUser
                            ? "left-0 -translate-x-full"
                            : "right-0 translate-x-full"
                            } pr-2 pl-2 opacity-70 group-hover:opacity-100 transition-opacity duration-200`}
                    >

                        <MessageActions
                            messageId={message.id}
                            content={message.content}
                            isPinned={message.isPinned}
                            isCurrentUser={isCurrentUser}
                            onReply={onReply}
                            onCopy={onCopy}
                            onPin={onPin}
                            onUnpin={onUnpin}
                            onDelete={onDelete}
                        />
                    </div>
                </div>

            </div>
        </div>
    )
})

MessageItem.displayName = "MessageItem"

export { MessageItem }
