"use client"

import { useState, useEffect, useCallback, useRef } from "react"

// ===== SHARED PROTOCOL WITH BACKEND =====
// Event types - must match BE websocket/protocol.go
const EventType = {
    // Client -> Server
    MESSAGE: "message",
    REPLY: "reply",
    TYPING: "typing",
    READ: "read",

    // Server -> Client
    JOIN: "join",
    LEAVE: "leave",
    PIN: "pin",
    DELETE: "delete",
    PRIVATE: "private_message",
    CONNECTED: "connected",
    HEARTBEAT: "heartbeat",
    ERROR: "error",
    NOTIFICATION: "notification",
} as const

// WebSocket Envelope - SHARED protocol
interface WSEnvelope {
    type: string
    payload: any
}

// ===== CLIENT TYPES =====

interface ChatMessage {
    id: string
    content: string | null  // Allow null for file-only messages
    user: {
        id: string
        name: string
        avatar?: string
        role: "student" | "teacher"
    }
    timestamp: string
    isPinned?: boolean
    files?: Array<{
        id: string
        name: string
        type: "image" | "document" | "audio" | "video" | "archive" | "other"
        size: number
        url: string
        thumbnailUrl?: string
        mimeType?: string
    }>
    replyTo?: ChatMessage
}

interface WebSocketChatOptions {
    courseId: string
    currentUser: {
        id: string
        name: string
        avatar?: string
        role: "student" | "teacher"
    }
    jwtToken: string
    baseUrl?: string
}

// Helper function to convert mime type to file type
function getFileTypeFromMimeType(mimeType: string): "image" | "document" | "audio" | "video" | "archive" | "other" {
    if (mimeType.startsWith('image/')) return "image"
    if (mimeType.startsWith('audio/')) return "audio"
    if (mimeType.startsWith('video/')) return "video"
    if (mimeType.includes('pdf') || mimeType.includes('doc') || mimeType.includes('text/')) return "document"
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return "archive"
    return "other"
}

// Convert API message format to UI ChatMessage format (reuse from chat.ts)
function convertApiMessageToUIMessage(apiMessage: any, allMessages?: any[]): ChatMessage {
    // Convert medias to files with CDN URLs
    const files = apiMessage.medias?.map((media: any) => ({
        id: media.id?.toString() || `file-${Date.now()}`,
        name: media.file_name || "Unknown File",
        type: getFileTypeFromMimeType(media.file_type || ""),
        size: media.file_size || 0,
        url: media.static_url?.startsWith('http')
            ? media.static_url
            : `https://cdn-dev.xlms.vn/${media.static_url}`,
        thumbnailUrl: media.file_type?.startsWith('image/')
            ? (media.static_url?.startsWith('http')
                ? media.static_url
                : `https://cdn-dev.xlms.vn/${media.static_url}`)
            : undefined,
        mimeType: media.file_type || "application/octet-stream",
    })) || []

    // Handle reply reference
    let replyTo: ChatMessage | undefined
    if (apiMessage.reply_to_message_id && apiMessage.reply_to_message) {
        replyTo = convertApiMessageToUIMessage(apiMessage.reply_to_message)
    } else if (apiMessage.reply_to_message_id && allMessages) {
        const parentMsg = allMessages.find(m => m.id === apiMessage.reply_to_message_id)
        if (parentMsg) {
            replyTo = convertApiMessageToUIMessage(parentMsg)
        }
    }

    return {
        id: apiMessage.id?.toString() || `msg-${Date.now()}`,
        content: apiMessage.content ?? null,  // Preserve null if backend sends null
        user: {
            id: apiMessage.user?.id?.toString() || apiMessage.user_id?.toString() || "",
            name: apiMessage.user?.full_name || apiMessage.user?.name || "Unknown User",
            avatar: apiMessage.user?.avatar || "/avatar-kid.png",
            role: (apiMessage.user?.role || "student") as "student" | "teacher",
        },
        timestamp: apiMessage.created_at || new Date().toISOString(),
        isPinned: apiMessage.is_pinned || false,
        files,
        replyTo,
    }
}

export function useWebSocketChat(options: WebSocketChatOptions | null) {
    const [isConnected, setIsConnected] = useState(false)
    const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "error">("connecting")
    const [error, setError] = useState<string | null>(null)
    const [onlineUsers, setOnlineUsers] = useState<string[]>([])

    const wsRef = useRef<WebSocket | null>(null)
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const reconnectAttemptsRef = useRef(0)
    const maxReconnectAttempts = 5
    const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const abortedRef = useRef(false)

    // Exponential backoff with jitter
    const nextDelay = useCallback((attempt: number): number => {
        const base = Math.min(30000, 1000 * Math.pow(2, attempt))  // 1s, 2s, 4s, 8s, 16s, max 30s
        const jitter = Math.random() * 0.3 * base  // +0-30% random jitter
        return base + jitter
    }, [])

    // Event handlers - using Map to prevent memory leaks
    const messageHandlersRef = useRef(new Map<string, (message: ChatMessage) => void>())
    const deleteHandlersRef = useRef(new Map<string, (messageId: string) => void>())
    const pinHandlersRef = useRef(new Map<string, (data: any) => void>())
    const typingHandlersRef = useRef(new Map<string, (data: any) => void>())
    const userJoinHandlersRef = useRef(new Map<string, (user: any) => void>())
    const userLeaveHandlersRef = useRef(new Map<string, (userId: string) => void>())

    // Handle incoming WebSocket messages
    const handleWSMessage = useCallback((event: MessageEvent) => {
        try {
            const envelope: WSEnvelope = JSON.parse(event.data)

            switch (envelope.type) {
                case EventType.CONNECTED: {
                    setIsConnected(true)
                    setConnectionStatus("connected")
                    setError(null)
                    reconnectAttemptsRef.current = 0

                    // Update online users if provided
                    if (envelope.payload?.online_users) {
                        setOnlineUsers(envelope.payload.online_users.map(String))
                    }
                    break
                }

                case EventType.MESSAGE: {
                    const message = convertApiMessageToUIMessage(envelope.payload)
                    messageHandlersRef.current.forEach(handler => handler(message))
                    break
                }

                case "client.pong": {
                    // Server response to client heartbeat
                    break
                }

                case EventType.REPLY: {
                    // Reply payload contains: { reply: ChatMessageResponse, parent_message_id: number }
                    const replyData = envelope.payload
                    if (replyData?.reply) {
                        const message = convertApiMessageToUIMessage(replyData.reply)

                        // Add parent reference - check if reply_to_message is provided with full data
                        if (replyData.reply?.reply_to_message) {
                            // Backend provides full parent message data
                            const parentMsg = replyData.reply.reply_to_message
                            message.replyTo = {
                                id: String(parentMsg.id || replyData.parent_message_id),
                                content: parentMsg.content ?? null,  // Preserve null
                                user: {
                                    id: String(parentMsg.user?.id || ""),
                                    name: parentMsg.user?.full_name || parentMsg.user?.name || "Unknown User",
                                    avatar: parentMsg.user?.avatar || "/avatar-kid.png",
                                    role: (parentMsg.user?.role || "student") as "student" | "teacher"
                                },
                                timestamp: parentMsg.created_at || "",
                                files: parentMsg.medias?.map((media: any) => ({
                                    id: String(media.id),
                                    name: media.file_name,
                                    type: getFileTypeFromMimeType(media.file_type || ""),
                                    size: media.file_size || 0,
                                    url: media.static_url?.startsWith('http')
                                        ? media.static_url
                                        : `https://cdn-dev.xlms.vn/${media.static_url}`,
                                    mimeType: media.file_type,
                                })) || []
                            }
                        } else if (replyData.parent_message_id) {
                            // Only parent_message_id provided - create placeholder
                            // The chat page should fill in details from its message list
                            message.replyTo = {
                                id: String(replyData.parent_message_id),
                                content: null,  // Will be filled by chat page if possible
                                user: { id: "", name: "", role: "student" },
                                timestamp: ""
                            }
                        }
                        messageHandlersRef.current.forEach(handler => handler(message))
                    }
                    break
                }

                case EventType.PIN: {
                    const pinData = envelope.payload
                    pinHandlersRef.current.forEach(handler => handler({
                        messageId: String(pinData.message_id),
                        isPinned: pinData.is_pinned,
                        userId: String(pinData.user_id || ""),
                    }))
                    break
                }

                case EventType.DELETE: {
                    const deleteData = envelope.payload
                    deleteHandlersRef.current.forEach(handler =>
                        handler(String(deleteData.message_id))
                    )
                    break
                }

                case EventType.TYPING: {
                    typingHandlersRef.current.forEach(handler => handler(envelope.payload))
                    break
                }

                case EventType.JOIN: {
                    const userId = String(envelope.payload?.user_id || "")
                    if (userId) {
                        setOnlineUsers(prev =>
                            prev.includes(userId) ? prev : [...prev, userId]
                        )
                        userJoinHandlersRef.current.forEach(handler => handler(envelope.payload))
                    }
                    break
                }

                case EventType.LEAVE: {
                    const userId = String(envelope.payload?.user_id || "")
                    if (userId) {
                        setOnlineUsers(prev => prev.filter(id => id !== userId))
                        userLeaveHandlersRef.current.forEach(handler => handler(userId))
                    }
                    break
                }

                case "client.pong": {
                    // Server response to client heartbeat
                    break
                }

                case EventType.HEARTBEAT: {
                    // Heartbeat received, connection is alive
                    break
                }

                case EventType.ERROR: {
                    setError(envelope.payload?.message || "Server error")
                    break
                }

                default:
                    break
            }
        } catch (err) {
            // Failed to parse WebSocket message
        }
    }, [])

    // Connect to WebSocket
    const connect = useCallback(() => {
        if (!options) {
            return
        }

        const { courseId, jwtToken, baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080" } = options

        if (!courseId || !jwtToken) {
            setConnectionStatus("error")
            setError("Missing required parameters")
            return
        }

        // Close existing connection if any
        if (wsRef.current) {
            wsRef.current.close()
            wsRef.current = null
        }

        // Build WebSocket URL from NEXT_PUBLIC_CHAT_API_BASE_URL
        // baseUrl format: "https://lmsx-pre-api-chat.xlms.vn/api/"
        const chatBaseUrl = process.env.NEXT_PUBLIC_CHAT_API_BASE_URL || baseUrl

        // Extract domain without protocol and /api/ path
        const urlWithoutProtocol = chatBaseUrl.replace(/^https?:\/\//, '').replace(/\/api\/?$/, '')

        // Determine protocol: wss for https, ws for http
        const wsProtocol = chatBaseUrl.startsWith('https') ? 'wss' : 'ws'

        // Build WebSocket URL: wss://domain/ws/chat
        const wsUrl = `${wsProtocol}://${urlWithoutProtocol}/ws/chat?course_id=${courseId}&token=${encodeURIComponent(jwtToken)}`

        setConnectionStatus("connecting")

        try {
            const ws = new WebSocket(wsUrl)
            wsRef.current = ws

            ws.onopen = () => {
                // Connection opened, waiting for 'connected' event from server
                // Start client heartbeat (app-level, not protocol-level)
                if (heartbeatIntervalRef.current) {
                    clearInterval(heartbeatIntervalRef.current)
                }
                heartbeatIntervalRef.current = setInterval(() => {
                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                        try {
                            wsRef.current.send(JSON.stringify({
                                type: "client.ping",
                                payload: { timestamp: Date.now() }
                            }))
                        } catch (err) {
                            // Connection might be closing, ignore
                        }
                    }
                }, 25000)  // Send heartbeat every 25s (before NAT timeout ~30-60s)
            }

            ws.onmessage = handleWSMessage

            ws.onerror = (error) => {
                // Browser doesn't expose detailed TLS errors, but we can infer from close code
                setError("Connection error (TLS/Network issue possible)")
            }

            ws.onclose = (event) => {
                setIsConnected(false)
                wsRef.current = null

                // Clear heartbeat
                if (heartbeatIntervalRef.current) {
                    clearInterval(heartbeatIntervalRef.current)
                    heartbeatIntervalRef.current = null
                }

                // Handle different close codes
                let errorMessage: string | null = null
                if (event.code === 1006) {
                    // Abnormal closure - often TLS/network issue
                    errorMessage = "Kết nối thất bại (TLS/Network). Vui lòng kiểm tra chứng chỉ/đường truyền."
                } else if (event.code === 1002) {
                    errorMessage = "Protocol error"
                } else if (event.code === 1003) {
                    errorMessage = "Unsupported data type"
                } else if (event.code === 1008) {
                    errorMessage = "Policy violation"
                } else if (event.code === 1011) {
                    errorMessage = "Server error"
                }

                if (errorMessage) {
                    setError(errorMessage)
                }

                // Attempt reconnect if not a normal close and not aborted
                if (event.code !== 1000 && !abortedRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
                    setConnectionStatus("connecting")
                    reconnectAttemptsRef.current++

                    const delay = nextDelay(reconnectAttemptsRef.current - 1)
                    reconnectTimeoutRef.current = setTimeout(() => {
                        if (!abortedRef.current) {
                            connect()
                        }
                    }, delay)
                } else {
                    setConnectionStatus("error")
                    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
                        setError(errorMessage || "Max reconnection attempts reached")
                    }
                }
            }
        } catch (err) {
            setConnectionStatus("error")
            setError("Failed to connect")
        }
    }, [options, handleWSMessage])

    // Track current course to avoid unnecessary reconnections
    const currentCourseRef = useRef<string | null>(null)
    const connectionAttemptedRef = useRef(false)

    // Initialize connection when options become available
    useEffect(() => {
        if (!options) {
            return
        }

        if (!options.courseId || !options.jwtToken) {
            return
        }

        // Set abort flag to false at start
        abortedRef.current = false

        // Avoid duplicate connections for same course
        const isAlreadyConnected = wsRef.current &&
            (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)

        if (currentCourseRef.current === options.courseId && isAlreadyConnected) {
            return
        }

        currentCourseRef.current = options.courseId
        connectionAttemptedRef.current = true

        // Call connect with a small delay to ensure state is updated
        const connectTimer = setTimeout(() => {
            if (!abortedRef.current) {
                connect()
            }
        }, 100)

        return () => {
            // Mark as aborted to prevent any pending operations
            abortedRef.current = true

            // Clear all timers
            if (connectTimer) {
                clearTimeout(connectTimer)
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
                reconnectTimeoutRef.current = null
            }
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current)
                heartbeatIntervalRef.current = null
            }

            // Close WebSocket
            if (wsRef.current) {
                wsRef.current.close(1000, "Component unmounted")
                wsRef.current = null
            }

            // Reset state
            currentCourseRef.current = null
            connectionAttemptedRef.current = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options?.courseId, options?.jwtToken])

    // ===== SEND FUNCTIONS =====

    // Send a message via WebSocket
    const sendMessage = useCallback((content: string, replyToMessageId?: string, mediaIds?: number[]) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return false
        }

        const envelope: WSEnvelope = {
            type: EventType.MESSAGE,
            payload: {
                content,
                reply_to_message_id: replyToMessageId ? parseInt(replyToMessageId) : null,
                media_ids: mediaIds || [],
            }
        }

        wsRef.current.send(JSON.stringify(envelope))
        return true
    }, [])

    // Send typing indicator
    const sendTyping = useCallback((isTyping: boolean) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return false
        }

        const envelope: WSEnvelope = {
            type: EventType.TYPING,
            payload: { is_typing: isTyping }
        }

        wsRef.current.send(JSON.stringify(envelope))
        return true
    }, [])

    // Send read receipt
    const sendReadReceipt = useCallback((messageIds: string[]) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return false
        }

        const envelope: WSEnvelope = {
            type: EventType.READ,
            payload: { message_ids: messageIds.map(id => parseInt(id)) }
        }

        wsRef.current.send(JSON.stringify(envelope))
        return true
    }, [])

    // ===== EVENT SUBSCRIPTIONS =====

    const onMessage = useCallback((handler: (message: ChatMessage) => void) => {
        const id = crypto.randomUUID()
        messageHandlersRef.current.set(id, handler)
        return () => {
            messageHandlersRef.current.delete(id)
        }
    }, [])

    const onDeleteMessage = useCallback((handler: (messageId: string) => void) => {
        const id = crypto.randomUUID()
        deleteHandlersRef.current.set(id, handler)
        return () => {
            deleteHandlersRef.current.delete(id)
        }
    }, [])

    const onPinMessage = useCallback((handler: (data: any) => void) => {
        const id = crypto.randomUUID()
        pinHandlersRef.current.set(id, handler)
        return () => {
            pinHandlersRef.current.delete(id)
        }
    }, [])

    const onTyping = useCallback((handler: (data: any) => void) => {
        const id = crypto.randomUUID()
        typingHandlersRef.current.set(id, handler)
        return () => {
            typingHandlersRef.current.delete(id)
        }
    }, [])

    const onUserJoin = useCallback((handler: (user: any) => void) => {
        const id = crypto.randomUUID()
        userJoinHandlersRef.current.set(id, handler)
        return () => {
            userJoinHandlersRef.current.delete(id)
        }
    }, [])

    const onUserLeave = useCallback((handler: (userId: string) => void) => {
        const id = crypto.randomUUID()
        userLeaveHandlersRef.current.set(id, handler)
        return () => {
            userLeaveHandlersRef.current.delete(id)
        }
    }, [])

    // ===== CONNECTION CONTROL =====

    const disconnect = useCallback(() => {
        abortedRef.current = true

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
        }
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current)
            heartbeatIntervalRef.current = null
        }
        if (wsRef.current) {
            wsRef.current.close(1000, "User disconnected")
            wsRef.current = null
        }
        setIsConnected(false)
        setConnectionStatus("connecting")
    }, [])

    const reconnect = useCallback(() => {
        reconnectAttemptsRef.current = 0
        disconnect()
        setTimeout(connect, 500)
    }, [disconnect, connect])

    return {
        // Connection state
        isConnected,
        connectionStatus,
        onlineUsers,
        error,

        // Event subscriptions
        onMessage,
        onDeleteMessage,
        onPinMessage,
        onTyping,
        onUserJoin,
        onUserLeave,

        // Send functions (can use WebSocket or fallback to REST)
        sendMessage,
        sendTyping,
        sendReadReceipt,

        // Connection control
        disconnect,
        reconnect,

        // For backward compatibility with SSE hook
        sendMessageWithId: sendMessage,
        sendFileMessage: () => false, // Use REST API for file upload
        sendDeleteMessage: () => false, // Use REST API for delete
    }
}

