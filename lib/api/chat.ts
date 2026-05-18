// lib/api/chat.ts
import axiosInstance from "./axios"

// Gửi tin nhắn với files (Multipart Form - upload trực tiếp)
export async function sendChatMessageWithFiles(
    courseId: string,
    data: {
        content: string
        files?: File[]
    },
): Promise<SendMessageResponse> {
    try {
        const formData = new FormData()
        formData.append("content", data.content || " ")

        // Append files to form data
        if (data.files && data.files.length > 0) {
            data.files.forEach((file) => {
                formData.append("files", file)
            })
        }

        console.log(`[sendChatMessageWithFiles] Sending ${data.files?.length || 0} files`)

        const response = await axiosInstance.post(
            `/manage/courses/${courseId}/chat/messages`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        )

        return response.data
    } catch (error: any) {
        console.error("Error sending message with files:", error)

        if (error.response) {
            console.error("Response data:", error.response.data)
            console.error("Response status:", error.response.status)
        }
        throw error
    }
}

// Gửi reply với files (Multipart Form - upload trực tiếp)
export async function sendReplyMessageWithFiles(
    courseId: string,
    messageId: string,
    data: {
        content: string
        files?: File[]
    },
): Promise<SendReplyResponse> {
    try {
        const formData = new FormData()
        formData.append("content", data.content || " ")

        // Append files to form data
        if (data.files && data.files.length > 0) {
            data.files.forEach((file) => {
                formData.append("files", file)
            })
        }

        console.log(`[sendReplyMessageWithFiles] Sending reply with ${data.files?.length || 0} files`)

        const response = await axiosInstance.post(
            `/manage/courses/${courseId}/chat/messages/${messageId}/replies`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        )

        return response.data
    } catch (error: any) {
        console.error("Error sending reply with files:", error)

        if (error.response) {
            console.error("Response data:", error.response.data)
            console.error("Response status:", error.response.status)
        }
        throw error
    }
}


// Local Message interface to avoid circular imports
interface MessageType {
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
    replyTo?: MessageType
}

export interface ChatMessage {
    id: number
    course_id: number
    user_id: number
    content: string | null  // Allow null for file-only messages
    message_type: string
    is_pinned: boolean
    is_edited: boolean
    edited_at: string | null
    reply_to_message_id: number | null
    reply_to_message?: {
        id: number
        course_id: number
        user_id: number
        content: string | null  // Allow null for file-only messages
        message_type: string
        is_pinned: boolean
        is_edited: boolean
        created_at: string
        updated_at: string
        user: {
            id: number
            username: string
            full_name: string
            avatar: string
        }
    }
    created_at: string
    updated_at: string
    user: {
        id: number
        username: string
        full_name: string
        avatar: string
    }
    medias?: Array<{
        id: number
        file_name: string
        file_path: string
        full_path: string
        file_type: string
        file_size: number
        file_extension: string
        disk_name: string
        static_url: string
        sort_order: number
    }>
}

export interface ChatMessagesResponse {
    code: number
    data: {
        messages: ChatMessage[]
        pagination: {
            page: number
            limit: number
            total: number
            total_page: number
            has_more: boolean
        }
    }
    message: string
}

export interface SendMessageResponse {
    code: number
    data: ChatMessage
    message: string
}

export interface SendReplyResponse {
    code: number
    data: ChatMessage  // Use the same ChatMessage interface to include reply_to_message
    message: string
}

export interface ChatUser {
    id: string
    name: string
    avatar?: string
    role: "student" | "teacher"
    isOnline: boolean
    lastSeen?: string
}

// Lấy tin nhắn của khóa học
export async function getCourseMessages(
    courseId: string,
    params?: {
        page?: number
        limit?: number
    },
): Promise<ChatMessagesResponse> {
    try {
        const response = await axiosInstance.get(`/manage/courses/${courseId}/chat/messages`, {
            headers: {
                "ngrok-skip-browser-warning": "true",
            },
            params,
        })

        return response.data
    } catch (error: any) {
        console.error("Error fetching chat messages:", error)

        if (error.response) {
            console.error("Response data:", error.response.data)
            console.error("Response status:", error.response.status)
            console.error("Response headers:", error.response.headers)
        } else if (error.request) {
            console.error("No response received:", error.request)
        } else {
            console.error("Error setting up request:", error.message)
        }
        throw error
    }
}

// Gửi tin nhắn
export async function sendChatMessage(
    courseId: string,
    data: {
        content: string
        replyTo?: string
        media_ids?: string[]
    },
): Promise<SendMessageResponse> {
    try {
        // Convert media_ids to numbers if they are numeric strings (backend expects integer array)
        const mediaIds = data.media_ids?.map(id => {
            const numId = parseInt(id, 10)
            return isNaN(numId) ? id : numId
        })

        let requestBody: object = {
            content: data.content,
            ...(data.replyTo && { reply_to_message_id: data.replyTo }),
            ...(mediaIds && mediaIds.length > 0 && { media_ids: mediaIds }),
        }

        console.log(`[sendChatMessage] Request body:`, JSON.stringify(requestBody, null, 2))

        const headers: Record<string, string> = {
            "Content-Type": "application/json"
        }

        const response = await axiosInstance.post(`/manage/courses/${courseId}/chat/messages`, requestBody, {
            headers,
        })

        return response.data
    } catch (error: any) {
        console.error("Error sending message:", error)

        if (error.response) {
            console.error("Response data:", error.response.data)
            console.error("Response status:", error.response.status)
            console.error("Response headers:", error.response.headers)
        } else if (error.request) {
            console.error("No response received:", error.request)
        } else {
            console.error("Error setting up request:", error.message)
        }
        throw error
    }
}

// Gửi reply cho tin nhắn cụ thể
export async function sendReplyMessage(
    courseId: string,
    messageId: string,
    data: { content: string; media_ids?: string[] }
): Promise<SendReplyResponse> {
    try {
        // Convert media_ids to numbers if they are numeric strings (backend expects integer array)
        const mediaIds = data.media_ids?.map(id => {
            const numId = parseInt(id, 10)
            return isNaN(numId) ? id : numId
        }) ?? []

        const body = {
            content: data.content ?? "",
            media_ids: mediaIds,
        };

        console.log(`[sendReplyMessage] Request body:`, JSON.stringify(body, null, 2))

        const response = await axiosInstance.post(
            `/manage/courses/${courseId}/chat/messages/${messageId}/replies`,
            body,
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        return response.data;
    } catch (error: any) {
        console.error("❌ API: Error sending reply:", error);
        if (error.response) {
            throw new Error(`Failed to send reply: ${error.response.data?.message || error.response.statusText}`);
        } else if (error.request) {
            throw new Error("Network error: Could not reach server");
        } else {
            throw new Error(`Error: ${error.message}`);
        }
    }
}

// Lấy danh sách users trong khóa học
export async function getCourseUsers(courseId: string) {
    try {
        const response = await axiosInstance.get(`/courses/${courseId}/chat/users`, {
            headers: {
                "ngrok-skip-browser-warning": "true",
            },
        })

        return response.data
    } catch (error: any) {
        console.error("Error fetching course users:", error)

        if (error.response) {
            console.error("Response data:", error.response.data)
            console.error("Response status:", error.response.status)
            console.error("Response headers:", error.response.headers)
        } else if (error.request) {
            console.error("No response received:", error.request)
        } else {
            console.error("Error setting up request:", error.message)
        }
        throw error
    }
}

// Pin/Unpin tin nhắn
export async function togglePinMessage(
    courseId: string,
    messageId: string,
): Promise<{
    code: number
    data: {
        success: boolean
        message: string
        is_pinned: boolean
    }
    message: string
}> {
    try {
        const response = await axiosInstance.post(`/manage/courses/${courseId}/chat/messages/${messageId}/pin`)

        return response.data
    } catch (error: any) {
        console.error("❌ API: Error toggling pin:", error)

        if (error.response) {
            console.error("Response data:", error.response.data)
            console.error("Response status:", error.response.status)
            throw new Error(`Failed to toggle pin: ${error.response.data?.message || error.response.statusText}`)
        } else if (error.request) {
            console.error("No response received:", error.request)
            throw new Error("Network error: Could not reach server")
        } else {
            console.error("Error setting up request:", error.message)
            throw new Error(`Error: ${error.message}`)
        }
    }
}

// Xóa tin nhắn
export async function deleteChatMessage(
    courseId: string,
    messageId: string,
): Promise<{
    code: number
    data: {
        success: boolean
        message: string
    }
    message: string
}> {
    try {
        const response = await axiosInstance.delete(`/manage/courses/${courseId}/chat/messages/${messageId}`)

        return response.data
    } catch (error: any) {
        console.error("❌ API: Error deleting message:", error)

        if (error.response) {
            console.error("Response data:", error.response.data)
            console.error("Response status:", error.response.status)
            throw new Error(`Failed to delete message: ${error.response.data?.message || error.response.statusText}`)
        } else if (error.request) {
            console.error("No response received:", error.request)
            throw new Error("Network error: Could not reach server")
        } else {
            console.error("Error setting up request:", error.message)
            throw new Error(`Error: ${error.message}`)
        }
    }
}

// Get pinned messages
export async function getPinnedMessages(courseId: string): Promise<{
    code: number
    data: {
        count: number
        pinned_messages: ChatMessage[]
    }
    message: string
}> {
    try {
        const response = await axiosInstance.get(`/manage/courses/${courseId}/chat/messages/pinned`)

        return response.data
    } catch (error: any) {
        console.error("❌ API: Error getting pinned messages:", error)

        if (error.response) {
            console.error("Response data:", error.response.data)
            console.error("Response status:", error.response.status)
            throw new Error(`Failed to get pinned messages: ${error.response.data?.message || error.response.statusText}`)
        } else if (error.request) {
            console.error("No response received:", error.request)
            throw new Error("Network error: Could not reach server")
        } else {
            console.error("Error setting up request:", error.message)
            throw new Error(`Error: ${error.message}`)
        }
    }
}

// Legacy: Upload multiple files - Deprecated, use sendChatMessageWithFiles instead
// export async function uploadMultipleFiles(files: File[], path = "chat"): Promise<string[]> {
//     // This function is deprecated - backend now supports direct multipart upload
//     throw new Error("uploadMultipleFiles is deprecated. Use sendChatMessageWithFiles instead.")
// }

export async function uploadChatFiles(files: FormData) {
    // Upload multiple files cho chat
}

export async function sendFileMessage(
    courseId: string,
    data: {
        content?: string
        files: Array<{
            id: string
            name: string
            url: string
            type: string
            size: number
            mimeType: string
        }>
    },
) {
    // Gửi tin nhắn kèm file
}

export async function downloadChatFile(fileId: string, fileName?: string) {
    try {
        const response = await axiosInstance.get(`/manage/files/${fileId}/download`, {
            responseType: 'blob', // Important for file downloads
            headers: {
                'ngrok-skip-browser-warning': 'true',
            },
        });

        // Create blob URL
        const blob = new Blob([response.data]);
        const blobUrl = window.URL.createObjectURL(blob);

        // Get filename from response headers or use provided name
        const contentDisposition = response.headers['content-disposition'];
        let filename = fileName || 'download';

        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }

        // Create and trigger download
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        window.URL.revokeObjectURL(blobUrl);

        return { success: true, filename };
    } catch (error: any) {
        console.error('Error downloading chat file:', error);

        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }

        throw new Error(`Failed to download file: ${error.message}`);
    }
}

export async function markMessagesAsRead(courseId: string, messageIds: string[]) {
    // Đánh dấu tin nhắn đã đọc
}

export async function searchMessages(
    courseId: string,
    query: string,
    filters?: {
        fromUser?: string
        hasFiles?: boolean
        dateRange?: { from: Date; to: Date }
    },
) {
    // Tìm kiếm tin nhắn
}

export async function editMessage(courseId: string, messageId: string, content: string) {
    // Chỉnh sửa tin nhắn
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

// Helper function to convert API message sang UI message format
export function convertApiMessageToUIMessage(
    apiMessage: ChatMessage,
    allMessages?: ChatMessage[],
    currentUser?: { id: string; role: "student" | "teacher" }
): MessageType {
    let replyTo

    // First check if reply_to_message object is provided directly from API
    if (apiMessage.reply_to_message) {
        replyTo = {
            id: apiMessage.reply_to_message.id.toString(),
            content: apiMessage.reply_to_message.content ?? null,  // Preserve null
            user: {
                id: apiMessage.reply_to_message.user.id.toString(),
                name: apiMessage.reply_to_message.user.full_name || apiMessage.reply_to_message.user.username,
                avatar: apiMessage.reply_to_message.user.avatar || "/avatar-kid.png",
                role: "student" as const,
            },
            timestamp: apiMessage.reply_to_message.created_at,
        }
    }
    // Fallback: look for replied message in allMessages using reply_to_message_id
    else if (apiMessage.reply_to_message_id && allMessages) {
        const repliedMessage = allMessages.find((msg) => msg.id === apiMessage.reply_to_message_id)
        if (repliedMessage) {
            replyTo = {
                id: repliedMessage.id.toString(),
                content: repliedMessage.content ?? null,  // Preserve null
                user: {
                    id: repliedMessage.user.id.toString(),
                    name: repliedMessage.user.full_name || repliedMessage.user.username,
                    avatar: repliedMessage.user.avatar || "/avatar-kid.png",
                    role: "student" as const,
                },
                timestamp: repliedMessage.created_at,
            }
        }
    }

    // Convert medias to files with proper CDN URLs
    const files = apiMessage.medias?.map((media) => {
        // Check if static_url already has CDN prefix
        const baseUrl = media.static_url.startsWith('https://')
            ? media.static_url
            : `https://cdn-dev.xClever School.vn/${media.static_url}`

        return {
            id: media.id.toString(),
            name: media.file_name,
            type: getFileTypeFromMimeType(media.file_type),
            size: media.file_size,
            url: baseUrl,
            thumbnailUrl: media.file_type.startsWith('image/') ? baseUrl : undefined,
            mimeType: media.file_type,
        }
    }) || []

    return {
        id: apiMessage.id.toString(),
        content: apiMessage.content ?? null,  // Preserve null if backend sends null
        user: {
            id: apiMessage.user.id.toString(),
            name: apiMessage.user.full_name || apiMessage.user.username,
            avatar: apiMessage.user.avatar || "/avatar-kid.png",
            role: (currentUser && apiMessage.user.id.toString() === currentUser.id)
                ? currentUser.role
                : "student", // Default to student for other users since API doesn't provide role info
        },
        timestamp: apiMessage.created_at,
        isPinned: apiMessage.is_pinned,
        replyTo,
        files,
    }
}

// Convert SSE Message to UI Message format
export function convertSSEMessageToUIMessage(sseMessage: any, allMessages: MessageType[]): MessageType {
    let replyTo: MessageType | undefined = undefined

    // Enhanced reply detection for SSE format
    // Check if this message already has replyTo field (from SSE reply event handler)
    if (sseMessage.replyTo) {
        replyTo = sseMessage.replyTo
    } else {
        // Check multiple possible reply field names for regular messages
        const replyToId = sseMessage.reply_to_message_id || sseMessage.replyToMessageId || sseMessage.reply_to_id || sseMessage.replyTo

        if (replyToId) {
            const repliedMessage = allMessages.find((msg) => msg.id === replyToId?.toString())
            if (repliedMessage) {
                replyTo = repliedMessage
            }
        }
    }    // Process files with proper URL handling to prevent double CDN prefixes
    let files: Array<{
        id: string
        name: string
        type: "image" | "document" | "audio" | "video" | "archive" | "other"
        size: number
        url: string
        thumbnailUrl?: string
        mimeType?: string
    }> = []

    if (sseMessage.files && Array.isArray(sseMessage.files)) {
        files = sseMessage.files.map((file: any) => {
            // Fix double CDN prefix issue in URLs
            const cleanUrl = file.url?.includes('https://cdn-dev.xClever School.vn/https://')
                ? file.url.replace('https://cdn-dev.xClever School.vn/https://', 'https://')
                : file.url

            const cleanThumbnailUrl = file.thumbnailUrl?.includes('https://cdn-dev.xClever School.vn/https://')
                ? file.thumbnailUrl.replace('https://cdn-dev.xClever School.vn/https://', 'https://')
                : file.thumbnailUrl

            return {
                ...file,
                url: cleanUrl,
                thumbnailUrl: cleanThumbnailUrl
            }
        })
    }

    return {
        id: sseMessage.id?.toString() || sseMessage.message_id?.toString(),
        content: sseMessage.content || sseMessage.data?.content,
        user: {
            id: sseMessage.user_id?.toString() || sseMessage.user?.id?.toString(),
            name: sseMessage.data?.user_name || sseMessage.user?.name,
            avatar: sseMessage.user?.avatar || "/avatar-kid.png",
            role: sseMessage.user?.role || "student",
        },
        timestamp: sseMessage.timestamp || sseMessage.data?.created_at || new Date().toISOString(),
        isPinned: false,
        replyTo,
        files,
    }
}

// SSEMessage interface for type safety
interface SSEMessage {
    id: string
    content: string
    user: {
        id: string
        name: string
        avatar?: string
        role: "student" | "teacher"
    }
    timestamp: string
    courseId: string
    reply_to_message_id?: string
    files?: Array<{
        id: string
        name: string
        type: "image" | "document" | "audio" | "video" | "archive" | "other"
        size: number
        url: string
        thumbnailUrl?: string
        mimeType?: string
    }>
}

// JWT token helper function for WebSocket authentication
export function getAuthToken(): string | null {
    if (typeof window !== "undefined") {
        // Try different storage locations
        const sources = [
            { name: 'localStorage.token', value: localStorage.getItem("token") },
            { name: 'localStorage.auth_token', value: localStorage.getItem("auth_token") },
            { name: 'sessionStorage.token', value: sessionStorage.getItem("token") },
            { name: 'sessionStorage.auth_token', value: sessionStorage.getItem("auth_token") },
            { name: 'cookie.token', value: document.cookie.split("; ").find((row) => row.startsWith("token="))?.split("=")[1] },
            { name: 'cookie.auth_token', value: document.cookie.split("; ").find((row) => row.startsWith("auth_token="))?.split("=")[1] },
        ]

        for (const source of sources) {
            if (source.value) {
                console.log(`🔑 [Auth] Token found in ${source.name}:`, source.value.substring(0, 30) + "...")
                return source.value
            }
        }

        console.warn("⚠️ [Auth] No token found in any storage location")
        console.log("  - localStorage keys:", Object.keys(localStorage).slice(0, 10))
        return null
    }
    return null
}

// SSE connection helper
export function createSSEConnection(courseId: string, token: string, baseUrl = "http://localhost:8080"): EventSource {
    const url = `${baseUrl}/api/manage/courses/${courseId}/chat/events?token=${encodeURIComponent(token)}`
    return new EventSource(url)
}

// Multiple courses SSE connection for dashboard
export function createMultiCourseSSEConnection(
    courseIds: string[],
    token: string,
    baseUrl = "http://localhost:8080",
): EventSource {
    const courseIdsParam = courseIds.join(",")
    const url = `${baseUrl}/api/manage/courses/events?course_ids=${courseIdsParam}&token=${encodeURIComponent(token)}`
    return new EventSource(url)
}

// SSE event type definitions
export interface SSEEventData {
    type: "message" | "reply" | "pin" | "delete" | "connected"
    course_id: number
    message_id: number
    user_id: number
    timestamp: string
    data: any
}

// SSE message converter functions
export function convertSSEEventToMessage(eventData: SSEEventData): MessageType {
    return {
        id: eventData.message_id.toString(),
        content: eventData.data.content || "",
        user: {
            id: eventData.user_id.toString(),
            name: eventData.data.user_name || "Unknown User",
            avatar: eventData.data.user_avatar || "/avatar-kid.png",
            role: eventData.data.user_role || "student",
        },
        timestamp: eventData.data.created_at || eventData.timestamp,
        isPinned: eventData.data.is_pinned || false,
        files: eventData.data.medias || [],
    }
}

export function convertSSEReplyToMessage(eventData: SSEEventData, allMessages: MessageType[]): MessageType {
    const parentMessage = allMessages.find((msg) => msg.id === eventData.data.parent_message_id?.toString())

    return {
        id: eventData.message_id.toString(),
        content: eventData.data.reply.content || "",
        user: {
            id: eventData.user_id.toString(),
            name: eventData.data.reply.user_name || "Unknown User",
            avatar: eventData.data.reply.user_avatar || "/avatar-kid.png",
            role: eventData.data.reply.user_role || "student",
        },
        timestamp: eventData.data.reply.created_at || eventData.timestamp,
        isPinned: false,
        replyTo: parentMessage,
        files: eventData.data.reply.medias || [],
    }
}
