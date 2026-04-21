"use client"

import { useState, useEffect, useRef, use, useMemo, useCallback } from "react"
import { useTranslations } from "next-intl"
import { useDebounce } from "@/hooks/use-debounce"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EmojiPicker } from "@/components/ui/emoji-picker"
import { MessageActions } from "@/components/ui/message-actions"
import OnlineUsersList from "@/components/online-users-list"
import { GetUserLogin } from "@/lib/api/users"
import {
  getCourseMessages,
  convertApiMessageToUIMessage,
  sendChatMessage,
  sendReplyMessage,
  sendChatMessageWithFiles,
  sendReplyMessageWithFiles,
  deleteChatMessage,
  togglePinMessage,
  getPinnedMessages,
  getAuthToken,
} from "@/lib/api/chat"
import { useWebSocketChat } from "@/hooks/use-websocket-chat"
import FileUploadDialog from "@/components/FileUploadDialog"
import FileMessage, { type FileAttachment } from "@/components/FileMessage"
import { MessageItem } from "@/components/MessageItem"
import {
  Send,
  Paperclip,
  Smile,
  Search,
  Pin,
  MoreVertical,
  Users,
  MessageCircle,
  ArrowLeft,
  Wifi,
  WifiOff,
  X,
} from "lucide-react"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"

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

export default function CourseChatPage({
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

  // Handle token from cookie or localStorage (for Flutter WebView)
  useEffect(() => {
    if (typeof window === "undefined") return

    // Check if we already have token in localStorage
    const existingToken = localStorage.getItem("token")
    if (existingToken) {
      return
    }

    // Check if token exists in cookie (injected by Flutter WebView)
    const tokenFromCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1]

    if (tokenFromCookie && tokenFromCookie.trim()) {
      localStorage.setItem("token", tokenFromCookie)

      // Remove cookie for security
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"

      window.location.reload()
    }
  }, [])

  // Emoji picker states
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const smileButtonRef = useRef<HTMLButtonElement>(null)

  // File upload dialog state
  const [showFileUploadDialog, setShowFileUploadDialog] = useState(false)

  // Reply state
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)

  // Helper function to track sent messages and prevent duplicates
  const trackSentMessage = useCallback((messageId: string) => {
    sentMessageIdsRef.current.add(messageId)
    setSentMessageIds((prev) => new Set([...prev, messageId]))

    // Clear from tracking after 10 seconds to prevent memory leaks
    setTimeout(() => {
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
      return deduplicated
    })
  }, [deduplicateMessages])

  // Load user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setUserLoading(true)
        const res = await GetUserLogin()
        const apiUser = res?.data?.user || res?.user || res?.data

        if (apiUser) {
          setUser(apiUser)
        } else {
          setUser(null)
        }
      } catch (err) {
        // Fallback: Extract user from JWT token
        try {
          const token = getAuthToken()
          if (token) {
            const parts = token.split('.')
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]))

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

              setUser(fallbackUser)
            }
          }
        } catch (tokenErr) {
          setUser(null)
        }
      } finally {
        setUserLoading(false)
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
      const token = getAuthToken()
      setJwtToken(token)
    } catch (error) {
      // Failed to get JWT token
    }
  }, [])

  // Setup WebSocket connection for real-time updates
  const wsOptions = useMemo(() => {
    if (!currentUser || !jwtToken || !courseId) {
      return null
    }

    return {
      courseId,
      currentUser,
      jwtToken,
      baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"
    }
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
    onTyping,
    sendTyping,
  } = useWebSocketChat(wsOptions)

  // Real-time message updates via WebSocket
  useEffect(() => {
    if (!currentUser) return

    const unsubscribe = onMessage((message) => {
      // Smarter duplicate detection instead of blanket skip by id
      const suppressionWindowMs = 5000

      setMessages((prev) => {
        // Skip messages that were just sent by this user (optimistic updates)
        if (sentMessageIdsRef.current.has(message.id)) {
          return prev
        }

        const already = prev.find((m) => m.id === message.id)
        if (already) {
          // Merge (update pinned, files if WebSocket has richer data)
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
      const messageExists = messages.some((msg) => msg.id === messageId)

      if (!messageExists) {
        return
      }

      setMessages((prev) => {
        return prev.filter((msg) => msg.id !== messageId)
      })
    })

    return unsubscribe
  }, [onDeleteMessage, messages, currentUser])

  useEffect(() => {
    if (!currentUser) return

    const unsubscribe = onPinMessage((pinEvent) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === pinEvent.messageId ? { ...msg, isPinned: pinEvent.isPinned } : msg)),
      )

      // Reload pinned messages
      loadPinnedMessages()
    })

    return unsubscribe
  }, [onPinMessage, currentUser])

  // Load pinned messages from API
  const loadPinnedMessages = useCallback(async () => {
    if (!currentUser || !courseId) return

    try {
      setPinnedMessagesLoading(true)

      const response = await getPinnedMessages(courseId)

      if (response.code === 200 && response.data.pinned_messages) {
        // Convert API messages to UI format with reply support
        const uiPinnedMessages = response.data.pinned_messages.map((apiMessage) =>
          convertApiMessageToUIMessage(apiMessage, response.data.pinned_messages),
        )

        // Sort pinned messages by timestamp (newest first for pinned section)
        uiPinnedMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        setPinnedMessages(uiPinnedMessages)
      } else {
        setPinnedMessages([])
      }
    } catch (error) {
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

            const deduplicatedMessages = deduplicateMessages(uiMessages)
            setMessages(deduplicatedMessages)

            // Update pagination state
            setHasMoreMessages(response.data.pagination.has_more)
            setCurrentPage(response.data.pagination.page)
          } else {
            // Fallback to empty messages if API response is unexpected
            setMessages([])
            setHasMoreMessages(false)
          }
        } catch (error) {
          // Fallback to mock data when API fails
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
          return deduplicated
        })

        // Update pagination state
        setHasMoreMessages(response.data.pagination.has_more)
        setCurrentPage(response.data.pagination.page)
      }
    } catch (error) {
      // Error loading more messages
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

          // Add the message immediately to UI instead of waiting for WebSocket
          setMessages((prev) => [...prev, uiMessage])

          // Track this message ID to prevent duplicate from WebSocket
          trackSentMessage(uiMessage.id)
        } else {
          throw new Error(`Unexpected API response: ${response.message}`)
        }
      }

      // Scroll to bottom to show new message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)

    } catch (error) {
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

            // Add the message immediately to UI instead of waiting for WebSocket
            setMessages((prev) => [...prev, uiMessage])

            // Track this message ID to prevent duplicate from WebSocket
            trackSentMessage(uiMessage.id)
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
            // Convert API message to UI format - this will handle files correctly from medias
            uiMessage = convertApiMessageToUIMessage(response.data)

            // Add the message immediately to UI instead of waiting for WebSocket
            setMessages((prev) => [...prev, uiMessage])

            // Track actual ID to prevent duplicate from WebSocket
            trackSentMessage(uiMessage.id)
          } else {
            throw new Error(`Unexpected API response: ${response.message}`)
          }
        }

        // Close the upload dialog
        setShowFileUploadDialog(false)
        setReplyingTo(null)

        // Scroll to bottom to show new message
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
        }, 100)
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
        // Call API to toggle pin message
        const response = await togglePinMessage(courseId, messageId)

        if (response.code === 200 && response.data.success) {
          // Update local state based on API response
          const newPinState = response.data.is_pinned

          setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, isPinned: newPinState } : msg)))

          // Reload pinned messages to update the pinned section
          loadPinnedMessages()
        } else {
          throw new Error(response.message || "Failed to toggle pin message")
        }
      } catch (error: any) {
        // Error pinning message
      }
    },
    [courseId, loadPinnedMessages],
  )

  const handleUnpinMessage = useCallback(
    async (messageId: string) => {
      try {
        // Call API to toggle pin message (same API, it toggles)
        const response = await togglePinMessage(courseId, messageId)

        if (response.code === 200 && response.data.success) {
          // Update local state based on API response
          const newPinState = response.data.is_pinned

          setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, isPinned: newPinState } : msg)))

          // Reload pinned messages to update the pinned section
          loadPinnedMessages()
        } else {
          throw new Error(response.message || "Failed to toggle pin message")
        }
      } catch (error: any) {
        // Error unpinning message
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

        const response = await deleteChatMessage(courseId, messageId)

        if (response.code === 200 && response.data.success) {
          setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
        } else {
          throw new Error(response.message || "Failed to delete message")
        }
      } catch (error: any) {
        // Error deleting message
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

  // Loading state
  if (loading || userLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>{userLoading ? t("loadingUser") : t("loading")}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // No user error
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">{t("userLoadError")}</h2>
            <p className="text-gray-600 mb-4">{t("loginAgain")}</p>
            <Button onClick={() => window.location.reload()}>{t("retry")}</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-6 pb-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${locale}/courses/${courseId}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("backToCourse")}
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{t("discussionTitle")}</h1>
              <p className="text-sm text-gray-500">{t("discussionSubtitle")}</p>
              <p className="text-xs text-blue-600">
                {t("chatAs")}: {currentUser.name} ({currentUser.role})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm cursor-pointer ${isConnected
                  ? "bg-green-100 text-green-800"
                  : connectionStatus === "connecting"
                    ? "bg-yellow-100 text-yellow-800 animate-pulse"
                    : "bg-red-100 text-red-800"
                  }`}
                title={`Status: ${connectionStatus}, Token: ${jwtToken ? "✓" : "✗"}, Course: ${courseId}`}
              >
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4" />
                    <span>{t("online")}</span>
                  </>
                ) : connectionStatus === "connecting" ? (
                  <>
                    <Wifi className="w-4 h-4 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4" />
                    <span>{t("offline")}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {wsError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <WifiOff className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">{t("connectionError")}</p>
                  <p className="text-xs text-yellow-600">{wsError}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-12 gap-6 overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
          {/* Chat Main Area - Full Width */}
          <div className="col-span-12">
            <Card className="h-full flex flex-col overflow-hidden">
              <CardHeader className="border-b bg-white flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-6 h-6 text-blue-600" />
                    <div>
                      <CardTitle className="text-xl">{t("conversation")}</CardTitle>
                    </div>
                  </div>
                  {/* <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Search className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div> */}
                </div>
              </CardHeader>

              {/* Pinned Messages Section - Compact */}
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

                  {/* Status messages */}
                  <div className="mt-2 space-y-1">
                    {!isConnected && (
                      <p className="text-xs text-yellow-600">⚠️ {t("offlineMode")}</p>
                    )}
                    {sendingMessage && <p className="text-xs text-blue-600">📤 {t("sending")}</p>}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar - Online Users - Hidden */}
          {/* <div className="col-span-12 lg:col-span-3">
            <OnlineUsersList
              onlineUsers={onlineUsers}
              currentUser={currentUser}
            />
          </div> */}
        </div>
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

