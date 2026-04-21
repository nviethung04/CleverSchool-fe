"use client"

import { useState, useEffect, useRef, use, useMemo, useCallback } from "react"
import { useTranslations } from "next-intl"
import { useDebounce } from "@/hooks/use-debounce"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { EmojiPicker } from "@/components/ui/emoji-picker"
import { GetUserLogin } from "@/lib/api/users"
import {
    getCourseMessages,
    convertApiMessageToUIMessage,
    sendChatMessage,
    sendReplyMessage,
    deleteChatMessage,
    togglePinMessage,
    getPinnedMessages,
    sendChatMessageWithFiles,
    sendReplyMessageWithFiles,
    getAuthToken,
} from "@/lib/api/chat"
import { useWebSocketChat } from "@/hooks/use-websocket-chat"
import FileUploadDialog from "@/components/FileUploadDialog"
import { type FileAttachment } from "@/components/FileMessage"
import { MessageItem } from "@/components/MessageItem"
import {
    Send,
    Paperclip,
    Smile,
    Pin,
    MessageCircle,
    X,
} from "lucide-react"

// Helper function to format time
const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
        // Same day - show time only
        return date.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        })
    } else if (diffInHours < 48) {
        // Yesterday
        return `Hôm qua ${date.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        })}`
    } else {
        // More than 2 days ago - show date and time
        return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        })
    }
}

interface Message {
    id: string
    content: string
    user: {
        id: string
        name: string
        avatar?: string
        role: "student" | "teacher"
    }
    timestamp: string
    isPinned?: boolean
    files?: FileAttachment[]
    replyTo?: Message
}

export default function MobileChatPage({
    params,
}: {
    params: Promise<{ id: string; locale: string }>
}) {
    const { id: courseId, locale } = use(params)
    const t = useTranslations("chat")
    const [messages, setMessages] = useState<Message[]>([])
    const [pinnedMessages, setPinnedMessages] = useState<Message[]>([])
    const [pinnedMessagesLoading, setPinnedMessagesLoading] = useState(false)
    const [showPinnedSection, setShowPinnedSection] = useState(false)
    const [messageInput, setMessageInput] = useState("") // Combined input state
    const debouncedMessageInput = useDebounce(messageInput, 100) // Debounced for character count
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [sendingMessage, setSendingMessage] = useState(false)
    const [hasMoreMessages, setHasMoreMessages] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    // Use ref to track sent message IDs for immediate access
    const sentMessageIdsRef = useRef<Set<string>>(new Set())
    const [sentMessageIds, setSentMessageIds] = useState<Set<string>>(new Set())
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const messagesContainerRef = useRef<HTMLDivElement>(null)
    const pinnedDropdownRef = useRef<HTMLDivElement>(null)
    const [user, setUser] = useState<any>(null)
    const [userLoading, setUserLoading] = useState(true)
    const [onlineUsers, setOnlineUsers] = useState<any[]>([])

    // Platform detection (web, ios, android) - Read immediately from URL/cookie
    const getPlatformFromURLOrCookie = () => {
        if (typeof window === "undefined") return "web"

        // Try URL first
        const urlParams = new URLSearchParams(window.location.search)
        const platformFromUrl = urlParams.get("platform")
        console.log("🔍 Platform from URL:", platformFromUrl)
        if (platformFromUrl) {
            const cleaned = platformFromUrl.replace(/^['"]|['"]$/g, '').trim()
            console.log("✅ Using platform from URL:", cleaned)
            return cleaned
        }

        // Try cookie
        const cookies = document.cookie.split("; ")
        const platformFromCookie = cookies
            .find((row) => row.startsWith("platform="))
            ?.split("=")[1]
        console.log("🔍 Platform from cookie:", platformFromCookie)
        if (platformFromCookie) {
            const cleaned = platformFromCookie.replace(/^['"]|['"]$/g, '').trim()
            console.log("✅ Using platform from cookie:", cleaned)
            return cleaned
        }

        console.log("⚪ No platform detected, using default: web")
        return "web"
    }

    const [platform, setPlatform] = useState<string>(getPlatformFromURLOrCookie())
    const isMobileApp = platform === "ios" || platform === "android"

    console.log("📱 Current platform:", platform, "| isMobileApp:", isMobileApp)

    // Emoji picker states
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const smileButtonRef = useRef<HTMLButtonElement>(null)

    // File upload dialog state
    const [showFileUploadDialog, setShowFileUploadDialog] = useState(false)

    // Reply state
    const [replyingTo, setReplyingTo] = useState<Message | null>(null)

    // Helper function to track sent messages and prevent duplicates
    const trackSentMessage = useCallback((messageId: string) => {
        console.log("📍 Tracking sent message to prevent WebSocket duplicate:", messageId)
        sentMessageIdsRef.current.add(messageId)
        setSentMessageIds((prev) => new Set([...prev, messageId]))

        // Clear from tracking after 10 seconds to prevent memory leaks
        setTimeout(() => {
            console.log("🧹 Clearing tracked message ID:", messageId)
            sentMessageIdsRef.current.delete(messageId)
            setSentMessageIds((prev) => {
                const newSet = new Set(prev)
                newSet.delete(messageId)
                return newSet
            })
        }, 10000)
    }, [])

    // Helper function to deduplicate messages by ID (keep the latest version)
    const deduplicateMessages = useCallback((messages: Message[]) => {
        const seen = new Map<string, Message>()

        // Process messages in reverse order to keep the latest version
        messages.slice().reverse().forEach(message => {
            if (!seen.has(message.id)) {
                seen.set(message.id, message)
            }
        })

        // Return in original order
        return Array.from(seen.values()).reverse()
    }, [])

    // Helper function to add message with deduplication
    const addMessageWithDedup = useCallback((newMessage: Message) => {
        setMessages((prev) => {
            const updated = [...prev, newMessage]
            const deduplicated = deduplicateMessages(updated)
            console.log(`📝 Added message. Before: ${prev.length}, After: ${deduplicated.length}`)
            return deduplicated
        })
    }, [deduplicateMessages])

    // Handle token and platform from cookie or URL query (for Flutter WebView)
    useEffect(() => {
        if (typeof window === "undefined") return

        // Check if we already have token in localStorage
        const existingToken = localStorage.getItem("token")

        // Read from URL query params
        const urlParams = new URLSearchParams(window.location.search)
        const platformFromUrl = urlParams.get("platform")
        const tokenFromUrl = urlParams.get("token")

        // Read from cookies
        const cookies = document.cookie.split("; ")
        const tokenFromCookie = cookies
            .find((row) => row.startsWith("token="))
            ?.split("=")[1]
        const platformFromCookie = cookies
            .find((row) => row.startsWith("platform="))
            ?.split("=")[1]

        // Handle platform (priority: URL query > cookie)
        const platformSource = platformFromUrl || platformFromCookie
        if (platformSource) {
            // Remove quotes if present (e.g., 'ios' -> ios)
            const cleanPlatform = platformSource.replace(/^['"]|['"]$/g, '').trim()
            console.log("📱 Platform detected:", cleanPlatform, "from", platformFromUrl ? "URL" : "cookie")
            setPlatform(cleanPlatform)

            // Remove platform from URL if present
            if (platformFromUrl) {
                urlParams.delete("platform")
                const newUrl = urlParams.toString()
                    ? `${window.location.pathname}?${urlParams.toString()}`
                    : window.location.pathname
                window.history.replaceState({}, "", newUrl)
            }

            // Remove platform cookie after reading
            if (platformFromCookie) {
                document.cookie = "platform=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
            }
        }

        // Handle token (priority: URL query > cookie)
        const tokenSource = tokenFromUrl || tokenFromCookie
        if (!existingToken && tokenSource && tokenSource.trim()) {
            console.log("🔑 Token received from", tokenFromUrl ? "URL" : "cookie", ", saving to localStorage...")
            localStorage.setItem("token", tokenSource)

            // Remove token from URL for security
            if (tokenFromUrl) {
                urlParams.delete("token")
                const newUrl = urlParams.toString()
                    ? `${window.location.pathname}?${urlParams.toString()}`
                    : window.location.pathname
                window.history.replaceState({}, "", newUrl)
            }

            // Remove token cookie for security
            if (tokenFromCookie) {
                document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
            }

            console.log("♻️ Reloading page to apply token...")
            window.location.reload()
        } else if (existingToken) {
            console.log("✅ Token already exists in localStorage")
        }
    }, [])

    // Load user data
    useEffect(() => {
        console.log("👤 Starting user fetch useEffect...")
        const fetchUser = async () => {
            try {
                setUserLoading(true)
                console.log("📡 Calling GetUserLogin...")
                const res = await GetUserLogin()
                console.log("📥 GetUserLogin response:", res)
                const apiUser = res?.data?.user || res?.user || res?.data

                if (apiUser) {
                    console.log("✅ User set:", apiUser)
                    setUser(apiUser)
                } else {
                    console.log("❌ No user data in response")
                    setUser(null)
                }
            } catch (err) {
                console.error("❌ Lỗi khi load user:", err)

                // Fallback: Extract user from JWT token
                console.log("🔄 Trying to extract user from JWT token...")
                try {
                    const token = getAuthToken()
                    if (token) {
                        const parts = token.split('.')
                        if (parts.length === 3) {
                            const payload = JSON.parse(atob(parts[1]))
                            console.log("📋 JWT payload:", payload)

                            const fallbackUser = {
                                id: payload.user_id?.toString() || "958",
                                name: `User ${payload.user_id || "958"}`,
                                avatar: "/avatar-kid.png",
                                role: payload.role || "student",
                                user_info: {
                                    role: {
                                        name: payload.role || "student"
                                    }
                                }
                            }

                            console.log("✅ Fallback user from JWT:", fallbackUser)
                            setUser(fallbackUser)
                        }
                    }
                } catch (tokenErr) {
                    console.error("❌ JWT fallback failed:", tokenErr)
                    setUser(null)
                }
            } finally {
                setUserLoading(false)
                console.log("🏁 User loading finished")
            }
        }
        fetchUser()
    }, [])

    // Create stable currentUser object
    const currentUser = useMemo(() => {
        if (!user) return null

        return {
            id: user.id?.toString() || "",
            name: user.name || "Unknown User",
            avatar: user.avatar || "/avatar-kid.png",
            role: (user.user_info?.role?.name || user.role || "student") as "student" | "teacher",
        }
    }, [user])

    // Store currentUser in ref for operations
    const currentUserRef = useRef(currentUser)
    useEffect(() => {
        currentUserRef.current = currentUser
    }, [currentUser])

    // Get JWT token for WebSocket connection
    const [jwtToken, setJwtToken] = useState<string | null>(null)
    useEffect(() => {
        try {
            const token = getAuthToken() // No await - this is synchronous
            console.log("🔑 JWT Token fetched:", token ? token.substring(0, 30) + "..." : "null")
            setJwtToken(token)
        } catch (error) {
            console.error("Failed to get JWT token:", error)
        }
    }, [])

    // Setup WebSocket connection for real-time updates
    const wsOptions = useMemo(() => {
        // Only log on client side to avoid SSR log spam
        if (typeof window !== 'undefined') {
            console.log("🔧 wsOptions dependencies:", {
                currentUser: !!currentUser,
                jwtToken: !!jwtToken,
                courseId: courseId,
                userDetails: currentUser ? { id: currentUser.id, name: currentUser.name } : null,
                tokenPreview: jwtToken ? jwtToken.substring(0, 30) + "..." : null
            })
        }

        if (!currentUser || !jwtToken || !courseId) {
            if (typeof window !== 'undefined') {
                console.log("❌ wsOptions is null - missing dependencies")
            }
            return null
        }

        const options = {
            courseId,
            currentUser,
            jwtToken,
            baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"
        }

        console.log("✅ wsOptions created:", {
            ...options,
            jwtToken: jwtToken.substring(0, 30) + "..."
        })

        return options
    }, [currentUser, jwtToken, courseId])

    const {
        isConnected,
        connectionStatus,
        error: wsError,
        onMessage,
        onDeleteMessage,
        onPinMessage,
        onUserJoin,
        onUserLeave,
        sendMessage: sendWSMessage,
    } = useWebSocketChat(wsOptions)

    // Real-time message updates via WebSocket
    useEffect(() => {
        if (!currentUser) return

        const unsubscribe = onMessage((message) => {
            console.log("🔔 WebSocket message received:", {
                id: message.id,
                content: message.content?.substring(0, 50) + "...",
                userId: message.user.id,
                currentUserId: currentUser.id,
                isOwnMessage: message.user.id === currentUser.id,
                isTracked: sentMessageIdsRef.current.has(message.id),
                trackedIds: Array.from(sentMessageIdsRef.current)
            })

            // Smarter duplicate detection
            const suppressionWindowMs = 5000

            setMessages((prev) => {
                // Skip messages that were just sent by this user (optimistic updates)
                if (sentMessageIdsRef.current.has(message.id)) {
                    console.log("⏩ Skipping WebSocket message - already added optimistically:", message.id)
                    return prev
                }

                const already = prev.find((m) => m.id === message.id)
                if (already) {
                    console.log("🔄 Message already exists, merging:", message.id)
                    // Merge (update pinned, files if WS has richer data)
                    const merged = prev.map((m) =>
                        m.id === message.id
                            ? {
                                ...m,
                                content: message.content || m.content,
                                isPinned: message.isPinned ?? m.isPinned,
                                files: message.files?.length ? message.files : m.files,
                            }
                            : m,
                    )
                    return merged
                }

                // Heuristic duplicate: same user + same content within small time window
                const now = new Date(message.timestamp || Date.now()).getTime()
                const probableDup = prev.some((m) => {
                    if (m.user.id !== message.user.id) return false
                    if ((m.content || "").trim() !== (message.content || "").trim()) return false
                    const t = new Date(m.timestamp).getTime()
                    return Math.abs(now - t) < suppressionWindowMs
                })
                if (probableDup) {
                    console.log("⏩ Skipping probable duplicate WebSocket message based on content/time")
                    return prev
                }

                // Fill replyTo content if only ID was provided (WebSocket only sends parent_message_id)
                let processedMessage = message
                if (message.replyTo && message.replyTo.id && !message.replyTo.content) {
                    const parentMessage = prev.find((m) => m.id === message.replyTo!.id)
                    if (parentMessage) {
                        processedMessage = {
                            ...message,
                            replyTo: {
                                id: parentMessage.id,
                                content: parentMessage.content,
                                user: parentMessage.user,
                                timestamp: parentMessage.timestamp,
                                files: parentMessage.files,
                            }
                        }
                    }
                }

                console.log("✅ Adding new WebSocket message to UI:", message.id)
                // WebSocket hook already converts to ChatMessage format
                const newMessages = [...prev, processedMessage]
                return deduplicateMessages(newMessages)
            })
        })

        return unsubscribe
    }, [onMessage, currentUser, deduplicateMessages])

    // User join/leave events are still useful for online status
    useEffect(() => {
        if (!currentUser) return

        const unsubscribeJoin = onUserJoin((user) => {
            setOnlineUsers((prev) => [...prev, user])
        })

        const unsubscribeLeave = onUserLeave((userId) => {
            setOnlineUsers((prev) => prev.filter((user) => user.id !== userId))
        })

        return () => {
            unsubscribeJoin()
            unsubscribeLeave()
        }
    }, [onUserJoin, onUserLeave, currentUser])

    useEffect(() => {
        if (!currentUser) return

        const unsubscribe = onDeleteMessage((messageId) => {
            console.log("🗑️ Received delete message event from WebSocket:", messageId)

            setMessages((prev) => {
                const messageExists = prev.some((msg) => msg.id === messageId)
                console.log(`🔍 Message ${messageId} exists in current messages:`, messageExists)

                if (!messageExists) {
                    console.warn(`⚠️ Message ${messageId} not found in current messages, skipping delete`)
                    return prev
                }

                const filteredMessages = prev.filter((msg) => msg.id !== messageId)
                console.log(`🔄 Message ${messageId} deleted`)
                return filteredMessages
            })
        })

        return unsubscribe
    }, [onDeleteMessage, currentUser])

    useEffect(() => {
        if (!currentUser) return

        const unsubscribe = onPinMessage((pinEvent) => {
            console.log("📌 Received pin event from WebSocket:", pinEvent)

            // Handle WebSocket payload format
            const messageId = String(pinEvent.messageId || pinEvent.message_id)
            const isPinned = pinEvent.isPinned ?? pinEvent.is_pinned

            setMessages((prev) =>
                prev.map((msg) => (msg.id === messageId ? { ...msg, isPinned } : msg)),
            )

            // Reload pinned messages
            loadPinnedMessages()
        })

        return unsubscribe
    }, [onPinMessage, currentUser, loadPinnedMessages])

    // Load pinned messages from API
    const loadPinnedMessages = useCallback(async () => {
        if (!currentUser || !courseId) return

        try {
            setPinnedMessagesLoading(true)
            console.log("🔄 Loading pinned messages from API for course:", courseId)

            const response = await getPinnedMessages(courseId)

            if (response.code === 200 && response.data.pinned_messages) {
                // Convert API messages to UI format with reply support
                const uiPinnedMessages = response.data.pinned_messages.map((apiMessage) =>
                    convertApiMessageToUIMessage(apiMessage, response.data.pinned_messages),
                )

                // Sort pinned messages by timestamp (newest first for pinned section)
                uiPinnedMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

                console.log("✅ Loaded", uiPinnedMessages.length, "pinned messages from API")
                setPinnedMessages(uiPinnedMessages)
            } else {
                console.warn("⚠️ Unexpected API response for pinned messages:", response)
                setPinnedMessages([])
            }
        } catch (error) {
            console.error("❌ Error loading pinned messages from API:", error)
            setPinnedMessages([])
        } finally {
            setPinnedMessagesLoading(false)
        }
    }, [currentUser, courseId])

    // Load pinned messages when component mounts
    useEffect(() => {
        if (!userLoading && currentUser && courseId) {
            loadPinnedMessages()
        }
    }, [userLoading, currentUser, courseId, loadPinnedMessages])

    // Load messages from API
    useEffect(() => {
        const loadMessages = async () => {
            if (!userLoading && currentUser && courseId) {
                try {
                    setLoading(true)
                    console.log("🔄 Loading messages from API for course:", courseId)

                    const response = await getCourseMessages(courseId, {
                        page: 1,
                        limit: 50, // Load latest 50 messages
                    })

                    if (response.code === 200 && response.data.messages) {
                        // Convert API messages to UI format with reply support
                        const uiMessages = response.data.messages.map((apiMessage) =>
                            convertApiMessageToUIMessage(apiMessage, response.data.messages),
                        )

                        // Sort messages by timestamp (oldest first)
                        uiMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

                        console.log("✅ Loaded", uiMessages.length, "messages from API")

                        const deduplicatedMessages = deduplicateMessages(uiMessages)
                        console.log(`📝 Initial load: ${uiMessages.length} → ${deduplicatedMessages.length} after dedup`)
                        setMessages(deduplicatedMessages)

                        // Update pagination state
                        setHasMoreMessages(response.data.pagination.has_more)
                        setCurrentPage(response.data.pagination.page)
                    } else {
                        console.warn("⚠️ Unexpected API response:", response)
                        // Fallback to empty messages if API response is unexpected
                        setMessages([])
                        setHasMoreMessages(false)
                    }
                } catch (error) {
                    console.error("❌ Error loading messages from API:", error)

                    // Fallback to mock data when API fails
                    console.log("🔄 Falling back to mock data")
                    const mockMessages: Message[] = [
                        {
                            id: "1",
                            content: "Chào mọi người! Chúng ta bắt đầu thảo luận về bài học hôm nay nhé.",
                            user: {
                                id: "teacher1",
                                name: "Cô Lan",
                                avatar: "/teacher-avatar.png",
                                role: "teacher",
                            },
                            timestamp: "2025-01-24T09:00:00Z",
                            isPinned: true,
                        },
                        {
                            id: "2",
                            content: "Em có thắc mắc về bài tập số 3 ạ. Cô có thể giải thích thêm không?",
                            user: {
                                id: "student1",
                                name: "Minh",
                                avatar: "/student1.png",
                                role: "student",
                            },
                            timestamp: "2025-01-24T09:05:00Z",
                        },
                    ]

                    setMessages(deduplicateMessages(mockMessages))
                    setHasMoreMessages(false)
                } finally {
                    setLoading(false)
                }
            }
        }

        loadMessages()
    }, [userLoading, currentUser, courseId])

    // Load more messages (for pagination)
    const loadMoreMessages = useCallback(async () => {
        if (loadingMore || !hasMoreMessages || !currentUser || !courseId) return

        try {
            setLoadingMore(true)
            console.log("🔄 Loading more messages, page:", currentPage + 1)

            const response = await getCourseMessages(courseId, {
                page: currentPage + 1,
                limit: 20,
            })

            if (response.code === 200 && response.data.messages) {
                const uiMessages = response.data.messages.map((apiMessage) =>
                    convertApiMessageToUIMessage(apiMessage, response.data.messages),
                )

                // Sort messages by timestamp (oldest first)
                uiMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

                // Prepend older messages to the beginning
                setMessages((prev) => {
                    const combined = [...uiMessages, ...prev]
                    const deduplicated = deduplicateMessages(combined)
                    console.log(`📝 Load more: ${combined.length} → ${deduplicated.length} after dedup`)
                    return deduplicated
                })

                // Update pagination state
                setHasMoreMessages(response.data.pagination.has_more)
                setCurrentPage(response.data.pagination.page)

                console.log("✅ Loaded", uiMessages.length, "more messages")
            }
        } catch (error) {
            console.error("❌ Error loading more messages:", error)
        } finally {
            setLoadingMore(false)
        }
    }, [loadingMore, hasMoreMessages, currentUser, courseId, currentPage, deduplicateMessages])

    // Handle click outside for pinned dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pinnedDropdownRef.current && !pinnedDropdownRef.current.contains(event.target as Node)) {
                setShowPinnedSection(false)
            }
        }

        if (showPinnedSection) {
            document.addEventListener("mousedown", handleClickOutside)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [showPinnedSection])

    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            const container = messagesContainerRef.current
            container.scrollTo({
                top: container.scrollHeight,
                behavior: "smooth",
            })
        }
    }

    useEffect(() => {
        // Only scroll if messages are added, not just updated
        const timer = setTimeout(scrollToBottom, 100)
        return () => clearTimeout(timer)
    }, [messages.length]) // Changed from messages to messages.length

    const handleSendMessage = useCallback(async () => {
        if (!messageInput.trim() || !currentUser || !courseId || sendingMessage) return

        const messageContent = messageInput.trim()
        const replyToId = replyingTo?.id

        setSendingMessage(true)
        setMessageInput("") // Clear input
        setReplyingTo(null)

        try {
            console.log("🔄 Sending message via REST API...")

            let uiMessage: Message

            if (replyToId) {
                const replyResponse = await sendReplyMessage(courseId, replyToId, {
                    content: messageContent,
                })

                if ((replyResponse.code === 201 || replyResponse.code === 200) && replyResponse.data) {
                    uiMessage = {
                        id: replyResponse.data.id.toString(),
                        content: replyResponse.data.content,
                        user: {
                            id: replyResponse.data.user.id.toString(),
                            name: replyResponse.data.user.full_name,
                            avatar: replyResponse.data.user.avatar || "/default-avatar.png",
                            role: "student" as const,
                        },
                        timestamp: replyResponse.data.created_at,
                        replyTo: replyingTo, // This should preserve the reply reference
                        files: [],
                    }

                    // Add the message immediately to UI instead of waiting for WebSocket
                    setMessages((prev) => [...prev, uiMessage])

                    // Track this message ID to prevent duplicate from WebSocket
                    trackSentMessage(uiMessage.id)

                } else if (replyResponse.message === "success" && replyResponse.data) {

                    uiMessage = {
                        id: replyResponse.data.id.toString(),
                        content: replyResponse.data.content,
                        user: {
                            id: replyResponse.data.user.id.toString(),
                            name: replyResponse.data.user.full_name,
                            avatar: replyResponse.data.user.avatar || "/default-avatar.png",
                            role: "student" as const,
                        },
                        timestamp: replyResponse.data.created_at,
                        replyTo: replyingTo, // This should preserve the reply reference
                        files: [],
                    }

                    // Add the message immediately to UI instead of waiting for WebSocket
                    setMessages((prev) => [...prev, uiMessage])

                    // Track this message ID to prevent duplicate from WebSocket
                    trackSentMessage(uiMessage.id)

                } else {
                    throw new Error(`Unexpected reply API response: code=${replyResponse.code}, message=${replyResponse.message}`)
                }
            } else {
                const response = await sendChatMessage(courseId, {
                    content: messageContent,
                    replyTo: replyToId,
                })

                if (response.code === 200 && response.data) {
                    uiMessage = convertApiMessageToUIMessage(response.data)
                } else {
                    throw new Error(`Unexpected API response: ${response.message}`)
                }
            }

            // For replies, we've already added to UI above. For regular messages, handle normally.
            if (!replyToId) {
                // Track this message ID to identify our own messages from WebSocket
                trackSentMessage(uiMessage.id)

                // Don't add to UI directly - let WebSocket handle it to ensure single source of truth
            }

            // Scroll to bottom to show new message
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
            }, 100)

        } catch (error) {
            console.error("❌ Error sending message via API:", error)

            // Restore message to input if API fails
            setMessageInput(messageContent)
            if (replyToId) {
                setReplyingTo(messages.find((msg) => msg.id === replyToId) || null)
            }
        } finally {
            setSendingMessage(false)
        }
    }, [messageInput, currentUser, courseId, sendingMessage, replyingTo, messages])

    const handleSendFiles = useCallback(
        async (fileItems: any[], message?: string) => {
            if (!currentUser || !courseId) return

            try {
                // Extract File objects from fileItems
                const files = fileItems.map((item) => item.file) as File[]
                const messageContent = message || " "
                const replyToId = replyingTo?.id

                let uiMessage
                let response

                if (replyToId) {
                    // Send reply with files using multipart form (direct upload)
                    response = await sendReplyMessageWithFiles(courseId, replyToId, {
                        content: messageContent,
                        files: files,
                    })

                    if ((response.code === 201 || response.code === 200) && response.data) {
                        uiMessage = {
                            id: response.data.id.toString(),
                            content: response.data.content,
                            user: {
                                id: response.data.user.id.toString(),
                                name: response.data.user.full_name,
                                avatar: response.data.user.avatar || "/default-avatar.png",
                                role: "student" as const,
                            },
                            timestamp: response.data.created_at,
                            replyTo: replyingTo,
                            files: [], // Files will be handled by WebSocket with correct URLs
                        }
                    } else {
                        throw new Error(`Unexpected reply API response: ${response.message}`)
                    }
                } else {
                    // Send regular message with files using multipart form (direct upload)
                    response = await sendChatMessageWithFiles(courseId, {
                        content: messageContent,
                        files: files,
                    })

                    if (response.code === 200 && response.data) {
                        // Track actual ID immediately after getting response
                        const actualId = response.data.id.toString()
                        sentMessageIdsRef.current.add(actualId)
                        setSentMessageIds(new Set(sentMessageIdsRef.current))

                        // Convert API message to UI format - this will handle files correctly from medias
                        uiMessage = convertApiMessageToUIMessage(response.data)
                    } else {
                        throw new Error(`Unexpected API response: ${response.message}`)
                    }
                }

                // Set up cleanup timer for the tracked message ID
                const messageId = uiMessage.id
                setTimeout(() => {
                    sentMessageIdsRef.current.delete(messageId)
                    setSentMessageIds(new Set(sentMessageIdsRef.current))
                }, 30000)

                // Close the upload dialog
                setShowFileUploadDialog(false)
                setReplyingTo(null)
            } catch (error) {
                console.error("Error sending files:", error)
            }
        },
        [currentUser, courseId, replyingTo, messages],
    )

    // Handle emoji selection for message input
    const handleEmojiSelect = (emoji: string) => {
        setMessageInput(prev => prev + emoji)
    }

    // Handle clearing last emoji from message
    const handleClearLastEmoji = () => {
        setMessageInput(prev => {
            // Remove last emoji (assuming emoji are 1-2 characters)
            const text = prev.trim()
            if (text.length === 0) return prev

            // Simple approach: remove last character or last 2 characters if it's an emoji
            const lastChar = text.charAt(text.length - 1)
            // Check if it's likely an emoji (high unicode value)
            if (lastChar.charCodeAt(0) > 127) {
                // Remove last 1-2 characters for emoji
                return text.slice(0, -1)
            }
            return text.slice(0, -1)
        })
    }

    // Message action handlers
    const handleReplyToMessage = useCallback(
        (messageId: string) => {
            const message = messages.find((msg) => msg.id === messageId)
            if (message) {
                setReplyingTo(message)
            }
        },
        [messages], // Keep the dependency but make sure the function is stable
    )

    const handleCopyMessage = useCallback((content: string) => {
        navigator.clipboard.writeText(content)
        // Could show a toast notification here
    }, [])

    const handlePinMessage = useCallback(
        async (messageId: string) => {
            try {
                console.log("📌 Pinning message:", messageId)

                // Call API to toggle pin message
                const response = await togglePinMessage(courseId, messageId)

                if (response.code === 200 && response.data.success) {
                    // Update local state based on API response
                    const newPinState = response.data.is_pinned

                    setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, isPinned: newPinState } : msg)))

                    console.log(`✅ Message ${newPinState ? "pinned" : "unpinned"} successfully:`, response.data.message)

                    // Reload pinned messages to update the pinned section
                    loadPinnedMessages()

                    // Could show a toast notification here
                    // toast.success(`Tin nhắn đã được ${newPinState ? 'ghim' : 'bỏ ghim'}`);
                } else {
                    throw new Error(response.message || "Failed to toggle pin message")
                }
            } catch (error: any) {
                console.error("❌ Error pinning message:", error)
                const errorMessage = error.message || "Không thể ghim tin nhắn. Vui lòng thử lại!"
                // TODO: Implement toast notification
                // toast.error(errorMessage)
            }
        },
        [courseId, loadPinnedMessages],
    )

    const handleUnpinMessage = useCallback(
        async (messageId: string) => {
            try {
                console.log("📌 Unpinning message:", messageId)

                // Call API to toggle pin message (same API, it toggles)
                const response = await togglePinMessage(courseId, messageId)

                if (response.code === 200 && response.data.success) {
                    // Update local state based on API response
                    const newPinState = response.data.is_pinned

                    setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, isPinned: newPinState } : msg)))

                    console.log(`✅ Message ${newPinState ? "pinned" : "unpinned"} successfully:`, response.data.message)

                    // Reload pinned messages to update the pinned section
                    loadPinnedMessages()

                    // Could show a toast notification here
                    // toast.success(`Tin nhắn đã được ${newPinState ? 'ghim' : 'bỏ ghim'}`);
                } else {
                    throw new Error(response.message || "Failed to toggle pin message")
                }
            } catch (error: any) {
                console.error("❌ Error unpinning message:", error)
                const errorMessage = error.message || "Không thể bỏ ghim tin nhắn. Vui lòng thử lại!"
                // TODO: Implement toast notification
                // toast.error(errorMessage)
            }
        },
        [courseId, loadPinnedMessages],
    )

    const handleDeleteMessage = useCallback(
        async (messageId: string) => {
            try {
                const isConfirmed = window.confirm("Bạn có chắc chắn muốn xóa tin nhắn này không?")
                if (!isConfirmed) {
                    return
                }

                console.log("🗑️ Deleting message:", messageId)

                const response = await deleteChatMessage(courseId, messageId)

                if (response.code === 200 && response.data.success) {
                    setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
                    console.log("✅ Message deleted successfully:", response.data.message)

                    console.log("📡 Delete message event will be broadcasted via WebSocket automatically")
                } else {
                    throw new Error(response.message || "Failed to delete message")
                }
            } catch (error: any) {
                console.error("❌ Error deleting message:", error)
                const errorMessage = error.message || "Không thể xóa tin nhắn. Vui lòng thử lại!"
            }
        },
        [courseId],
    )

    const handleCancelReply = useCallback(() => {
        setReplyingTo(null)
    }, [])

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp)
        return date.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    // Get unique online users (remove duplicates)
    const uniqueOnlineUsers = onlineUsers.filter(
        (user, index, array) => index === array.findIndex((u) => u.id === user.id),
    )

    // Loading state - MOBILE: Simple fullscreen loading
    if (loading || userLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>{userLoading ? t("loadingUser") : t("loading")}</p>
                </div>
            </div>
        )
    }

    // No user error - MOBILE: Simple fullscreen error
    if (!currentUser) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center px-4">
                    <h2 className="text-xl font-bold mb-4">{t("userLoadError")}</h2>
                    <p className="text-gray-600 mb-4">{t("loginAgain")}</p>
                    <Button onClick={() => window.location.reload()}>{t("retry")}</Button>
                </div>
            </div>
        )
    }

    // MOBILE: Full screen chat layout, no header/breadcrumb
    return (
        <div className="h-screen flex flex-col">
            <div className="flex-1 flex flex-col">
                <Card className="h-full flex flex-col overflow-hidden">
                    <CardHeader className="border-b bg-white flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <MessageCircle className="w-6 h-6 text-blue-600" />
                                <CardTitle className="text-xl">{t("conversation")}</CardTitle>
                            </div>
                        </div>
                    </CardHeader>

                    {/* Pinned Messages Section */}
                    {pinnedMessages.length > 0 && (
                        <div className="border-b bg-yellow-50 border-yellow-200 flex-shrink-0">
                            <div className="px-3 py-2">
                                {pinnedMessagesLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600"></div>
                                        <span className="text-xs text-yellow-600">{t("loadingPinned")}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between gap-2">
                                        {/* Latest pinned message preview */}
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <Pin className="w-3 h-3 text-yellow-600 flex-shrink-0" />
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <img
                                                    src={pinnedMessages[0]?.user?.avatar || "/avatar-kid.png"}
                                                    alt={pinnedMessages[0]?.user?.name}
                                                    className="w-5 h-5 rounded-full flex-shrink-0"
                                                />
                                                <span className="text-xs font-medium text-yellow-800 flex-shrink-0">
                                                    {pinnedMessages[0]?.user?.name}:
                                                </span>
                                                <span className="text-xs text-yellow-700 truncate">
                                                    {pinnedMessages[0]?.content || "File đính kèm"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            {pinnedMessages.length > 1 && (
                                                <div className="relative">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setShowPinnedSection(!showPinnedSection)}
                                                        className="h-6 px-2 text-xs text-yellow-700 hover:text-yellow-800 hover:bg-yellow-100"
                                                    >
                                                        +{pinnedMessages.length - 1}
                                                    </Button>

                                                    {/* Dropdown for all pinned messages */}
                                                    {showPinnedSection && (
                                                        <div
                                                            ref={pinnedDropdownRef}
                                                            className="absolute top-full right-0 mt-1 w-80 bg-white border border-yellow-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
                                                        >
                                                            <div className="p-2 border-b border-yellow-100">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-sm font-medium text-yellow-800">
                                                                        {t("allPinnedMessages")}
                                                                    </span>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => setShowPinnedSection(false)}
                                                                        className="h-5 w-5 p-0 text-yellow-600 hover:text-yellow-800"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            <div className="p-1">
                                                                {pinnedMessages.map((message, index) => (
                                                                    <div key={message.id} className="p-2 rounded hover:bg-yellow-50 group">
                                                                        <div className="flex items-start justify-between gap-2">
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <img
                                                                                        src={message.user?.avatar || "/avatar-kid.png"}
                                                                                        alt={message.user?.name}
                                                                                        className="w-4 h-4 rounded-full"
                                                                                    />
                                                                                    <span className="text-xs font-medium text-gray-900">
                                                                                        {message.user?.name}
                                                                                    </span>
                                                                                    {message.user?.role === "teacher" && (
                                                                                        <Badge
                                                                                            variant="secondary"
                                                                                            className="text-xs bg-blue-100 text-blue-800 px-1 py-0"
                                                                                        >
                                                                                            GV
                                                                                        </Badge>
                                                                                    )}
                                                                                    <span className="text-xs text-gray-500">
                                                                                        {formatTime(message.timestamp)}
                                                                                    </span>
                                                                                </div>
                                                                                <p className="text-xs text-gray-700 break-words line-clamp-2">
                                                                                    {message.content}
                                                                                </p>
                                                                                {message.files && message.files.length > 0 && (
                                                                                    <div className="mt-1">
                                                                                        <span className="text-xs text-blue-600">
                                                                                            📎 {message.files.length} file
                                                                                        </span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => handleUnpinMessage(message.id)}
                                                                                className="h-5 w-5 p-0 text-yellow-600 hover:text-yellow-800 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                title="Bỏ ghim"
                                                                            >
                                                                                <X className="w-3 h-3" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleUnpinMessage(pinnedMessages[0]?.id)}
                                                className="h-6 w-6 p-0 text-yellow-600 hover:text-yellow-800"
                                                title={t("unpinThis")}
                                            >
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {/* Messages Area */}
                    <CardContent
                        ref={messagesContainerRef}
                        className="flex-1 overflow-y-auto p-0 scroll-smooth"
                        style={{
                            scrollBehavior: "smooth",
                            // Dynamic height calculation considering reply preview
                            maxHeight: (() => {
                                let baseHeight = pinnedMessages.length > 0 ? 400 : 350
                                // Add extra space when reply preview is active
                                if (replyingTo) baseHeight += 80
                                return `calc(100vh - ${baseHeight}px)`
                            })(),
                        }}
                    >
                        <div className="p-4 space-y-4">
                            {/* Load More Button */}
                            {hasMoreMessages && (
                                <div className="flex justify-center mb-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={loadMoreMessages}
                                        disabled={loadingMore}
                                        className="text-gray-600 hover:text-blue-600 bg-transparent"
                                    >
                                        {loadingMore ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                                {t("loadingOlder")}
                                            </>
                                        ) : (
                                            t("loadOlder")
                                        )}
                                    </Button>
                                </div>
                            )}

                            {/* Empty state */}
                            {messages.length === 0 && !loading && (
                                <div className="flex items-center justify-center h-32 text-gray-500">
                                    <div className="text-center">
                                        <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                        <p>{t("noMessages")}</p>
                                    </div>
                                </div>
                            )}

                            {/* Deduplicate messages by ID before rendering */}
                            {(() => {
                                const deduped = messages.filter((message, index, arr) => arr.findIndex(m => m.id === message.id) === index)
                                if (deduped.length !== messages.length) {
                                    const duplicateIds = messages.map(m => m.id).filter((id, i, arr) => arr.indexOf(id) !== i)
                                    console.warn("🚨 Found duplicate messages in render!", {
                                        original: messages.length,
                                        deduped: deduped.length,
                                        duplicateIds: duplicateIds,
                                        duplicateDetails: duplicateIds.map(id => messages.filter(m => m.id === id))
                                    })
                                }
                                return deduped
                            })().map((message, index) => (
                                <MessageItem
                                    key={`${message.id}-${index}`} // Add index to ensure uniqueness
                                    message={message}
                                    currentUser={currentUser}
                                    onlineUsers={onlineUsers}
                                    onReply={handleReplyToMessage}
                                    onCopy={handleCopyMessage}
                                    onPin={handlePinMessage}
                                    onUnpin={handleUnpinMessage}
                                    onDelete={handleDeleteMessage}
                                />
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    </CardContent>

                    {/* Message Input - Fixed at bottom */}
                    <div className="border-t bg-white relative flex-shrink-0">
                        {/* Reply Preview - Positioned above input */}
                        {replyingTo && (
                            <div className="px-4 pt-3 pb-0">
                                <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500 relative">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-blue-700">
                                            <span className="inline-block mr-1">↩️</span>
                                            {t("replyingTo")} {replyingTo.user.name}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                                            onClick={handleCancelReply}
                                            title={t("cancelReply")}
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>
                                    <p className="text-sm text-blue-600 truncate">{replyingTo.content || t("fileMessage")}</p>
                                </div>
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-4">
                            <div className="flex items-center gap-2">
                                {/* File upload button */}
                                {!replyingTo && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowFileUploadDialog(true)}
                                        title={t("sendFiles")}
                                        className="hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                    >
                                        <Paperclip className="w-4 h-4" />
                                    </Button>
                                )}
                                <div className="flex-1 relative">
                                    <Input
                                        placeholder={`${t("typeMessage")}${!isConnected ? ` (${t("offline").toLowerCase()})` : ""}...`}
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        className="pr-12"
                                        onKeyPress={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault()
                                                handleSendMessage()
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            // Quick emoji shortcuts
                                            if (e.ctrlKey || e.metaKey) {
                                                if (e.key === "e") {
                                                    e.preventDefault()
                                                    setShowEmojiPicker(!showEmojiPicker)
                                                }
                                            }

                                            // ESC to close emoji picker
                                            if (e.key === "Escape" && showEmojiPicker) {
                                                setShowEmojiPicker(false)
                                            }
                                        }}
                                        disabled={!currentUser || sendingMessage}
                                    />
                                    {/* Character count - use debounced value for performance */}
                                    {debouncedMessageInput.length > 0 && (
                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                                            {debouncedMessageInput.length}
                                        </div>
                                    )}
                                </div>
                                <div className="relative">
                                    <Button
                                        ref={smileButtonRef}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setShowEmojiPicker(!showEmojiPicker)
                                        }}
                                        className={`hover:bg-yellow-50 hover:border-yellow-300 transition-colors ${showEmojiPicker ? "bg-yellow-50 border-yellow-300" : ""
                                            }`}
                                        title={t("addEmoji")}
                                        disabled={sendingMessage}
                                    >
                                        <Smile className="w-4 h-4 text-yellow-500" />
                                    </Button>

                                    {/* Emoji Picker for Message Input */}
                                    <EmojiPicker
                                        isOpen={showEmojiPicker}
                                        onEmojiSelect={handleEmojiSelect}
                                        onClose={() => setShowEmojiPicker(false)}
                                        triggerRef={smileButtonRef}
                                        autoClose={false} // Don't auto-close when selecting emoji for message input
                                        onClearLast={handleClearLastEmoji}
                                    />
                                </div>
                                <Button
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                                    onClick={handleSendMessage}
                                    disabled={!messageInput.trim() || !currentUser || sendingMessage}
                                >
                                    {sendingMessage ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* File Upload Dialog */}
            <FileUploadDialog
                isOpen={showFileUploadDialog}
                onClose={() => setShowFileUploadDialog(false)}
                onSendFiles={handleSendFiles}
                maxFiles={10}
                maxFileSize={50}
            />
        </div>
    )
}
