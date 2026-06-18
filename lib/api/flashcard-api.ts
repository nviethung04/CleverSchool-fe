import axiosInstance from './axios'
import {
    Vocabulary,
    FlashcardSession,
    FlashcardActivity,
    StudentProgress,
    LessonVocabulary,
    FlashcardStats,
    PronunciationAssessment,
    FlashcardResponse
} from '@/lib/types/flashcard'

const FLASHCARD_BASE_URL = '/manage/flashcard'

export class FlashcardAPI {
    // 📚 VOCABULARY APIs

    static async listVocabularies(params?: {
        page?: number;
        limit?: number;
        search?: string;
    }) {
        const response = await axiosInstance.get(
            `${FLASHCARD_BASE_URL}/vocabularies`,
            { params }
        );
        return response.data;
    }

    // Lấy chi tiết từ vựng cụ thể
    static async getVocabulary(vocabularyId: number) {
        const response = await axiosInstance.get<FlashcardResponse<Vocabulary>>(
            `${FLASHCARD_BASE_URL}/vocabularies/${vocabularyId}`
        )
        return response.data
    }

    // Tạo từ vựng mới (cho admin/teacher)
    static async createVocabulary(vocabulary: Partial<Vocabulary>) {
        const response = await axiosInstance.post<FlashcardResponse<Vocabulary>>(
            `${FLASHCARD_BASE_URL}/vocabularies`,
            vocabulary
        )
        return response.data
    }

    // 🎯 LESSON VOCABULARY APIs

    // Lấy danh sách từ vựng theo bài học
    static async getLessonVocabularies(lessonId: number, page = 1, limit = 20) {
        const response = await axiosInstance.get<any>(
            `${FLASHCARD_BASE_URL}/lessons/${lessonId}/vocabularies?page=${page}&limit=${limit}`
        )

        // Transform backend response to standard format
        const backendData = response.data
        return {
            success: backendData.code === 200,
            data: backendData.data,
            message: backendData.message
        }
    }

    // Thêm từ vựng vào bài học (cho admin/teacher)
    static async addVocabularyToLesson(lessonId: number, vocabularyData: Partial<Vocabulary>) {
        const response = await axiosInstance.post<FlashcardResponse<LessonVocabulary>>(
            `${FLASHCARD_BASE_URL}/lessons/${lessonId}/vocabularies`,
            vocabularyData
        )
        return response.data
    }

    // 🎮 SESSION MANAGEMENT APIs

    // Bắt đầu phiên học flashcard
    static async startStudySession(lessonId: number) {
        const response = await axiosInstance.post<any>(
            `${FLASHCARD_BASE_URL}/sessions`,
            { lesson_id: lessonId }
        )

        // Transform backend response to standard format
        const backendData = response.data
        return {
            success: backendData.code === 201, // Backend trả về 201 cho create
            data: backendData.data,
            message: backendData.message
        }
    }

    // Hoàn thành phiên học flashcard
    static async completeStudySession(sessionId: number, completionData: {
        vocabulary_id: number
        total_time_spent: number
        words_studied: number
        words_known: number
        words_learning: number
        completion_rate: number
        average_score: number
    }) {
        const response = await axiosInstance.put<any>(
            `${FLASHCARD_BASE_URL}/sessions/${sessionId}/complete`,
            completionData
        )

        // Transform backend response to standard format
        const backendData = response.data
        return {
            success: backendData.code === 200,
            data: backendData.data,
            message: backendData.message
        }
    }

    // 📊 PROGRESS TRACKING APIs

    // Cập nhật tiến độ học từ vựng (học đến từ vựng nào)
    static async updateVocabularyProgress(vocabularyId: number, progressData: {
        is_known?: boolean
        study_count?: number
        correct_count?: number
        pronunciation_score?: number
        mastery_level?: number
        streak_count?: number
    }) {
        // Use PUT with backend expected format
        const backendFormat = {
            status: progressData.is_known ? 'known' : 'learning',
            mastery_level: progressData.mastery_level || (progressData.is_known ? 8.5 : 5.0),
            last_studied_at: new Date().toISOString(),
            next_review_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days later
            study_count: progressData.study_count || 1,
            correct_count: progressData.correct_count || (progressData.is_known ? 1 : 0),
            streak_count: progressData.streak_count || (progressData.is_known ? 1 : 0)
        }

        const response = await axiosInstance.put<any>(
            `${FLASHCARD_BASE_URL}/vocabulary-progress/${vocabularyId}`,
            backendFormat
        )

        // Transform backend response to standard format
        const backendData = response.data
        return {
            success: backendData.code === 200,
            data: backendData.data,
            message: backendData.message
        }
    }    // 🎯 ACTIVITY TRACKING APIs

    // Ghi lại hoạt động trong phiên học
    static async recordSessionActivity(sessionId: number, activityData: {
        vocabulary_id: number
        activity_type: 'view' | 'flip' | 'mark_known' | 'mark_unknown' | 'pronunciation'
        response_time: number // Required - no optional
        is_correct: boolean   // Required - no optional  
        response?: string // audio_url hoặc text_response cho pronunciation
        pronunciation_score?: number // chỉ có khi activity_type = pronunciation
    }) {
        console.log('🎯 Recording activity:', {
            sessionId,
            activityData,
            url: `${FLASHCARD_BASE_URL}/sessions/${sessionId}/activities`
        })

        // Ensure required fields are present
        const cleanedData = {
            vocabulary_id: activityData.vocabulary_id,
            activity_type: activityData.activity_type,
            response_time: activityData.response_time,
            is_correct: activityData.is_correct,
            ...(activityData.response && { response: activityData.response }),
            ...(activityData.pronunciation_score && { pronunciation_score: activityData.pronunciation_score })
        }

        console.log('📤 Final request body:', cleanedData)

        const response = await axiosInstance.post<any>(
            `${FLASHCARD_BASE_URL}/sessions/${sessionId}/activities`,
            cleanedData
        )

        console.log('📡 Activity response:', response.data)

        // Transform backend response to standard format
        const backendData = response.data
        return {
            success: backendData.code === 201, // Backend có thể trả về 201 cho create activity
            data: backendData.data,
            message: backendData.message
        }
    }    // 📈 HELPER METHODS FOR UI INTEGRATION

    // Ghi lại việc xem flashcard
    static async recordCardView(sessionId: number, vocabularyId: number, responseTime?: number) {
        console.log('👁️ Recording card view:', { sessionId, vocabularyId, responseTime })

        if (!vocabularyId) {
            console.error('❌ vocabularyId is required for recordCardView')
            throw new Error('vocabularyId is required')
        }

        return this.recordSessionActivity(sessionId, {
            vocabulary_id: vocabularyId,
            activity_type: 'view',
            response_time: responseTime || 0,
            is_correct: false // Default for view activity
        })
    }

    // Ghi lại việc lật thẻ
    static async recordCardFlip(sessionId: number, vocabularyId: number, responseTime?: number) {
        console.log('🃏 Recording card flip:', { sessionId, vocabularyId, responseTime })

        if (!vocabularyId) {
            console.error('❌ vocabularyId is required for recordCardFlip')
            throw new Error('vocabularyId is required')
        }

        return this.recordSessionActivity(sessionId, {
            vocabulary_id: vocabularyId,
            activity_type: 'flip',
            response_time: responseTime || 0,
            is_correct: false // Default for flip activity
        })
    }

    // Ghi lại việc đánh dấu biết/không biết
    static async recordCardMark(sessionId: number, vocabularyId: number, isKnown: boolean, responseTime?: number) {
        console.log('🎯 recordCardMark called with:', { sessionId, vocabularyId, isKnown, responseTime })

        try {
            // Use exact format that works in Postman
            const exactBodyFormat = {
                vocabulary_id: vocabularyId,
                activity_type: isKnown ? 'mark_known' as const : 'mark_unknown' as const,
                response_time: responseTime || 0, // Ensure it's never undefined
                is_correct: isKnown
            }

            console.log('📤 Sending exact body format:', exactBodyFormat)

            // Record activity first (this is most important)  
            const activityResult = await this.recordSessionActivity(sessionId, exactBodyFormat)

            console.log('✅ Activity recorded successfully')

            // Try to update progress (optional - if fails, at least we have activity log)
            try {
                await this.updateVocabularyProgress(vocabularyId, {
                    is_known: isKnown,
                    study_count: 1,
                    correct_count: isKnown ? 1 : 0
                })
            } catch (progressError) {
                console.warn('⚠️ Progress update failed but activity was recorded:', progressError)
            }

            return activityResult
        } catch (error) {
            console.error('❌ recordCardMark failed:', error)
            // Log detailed error info
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as any
                console.error('Error response:', axiosError.response?.status, axiosError.response?.data)
            }
            throw error
        }
    }    // Ghi lại luyện phát âm
    static async recordPronunciation(sessionId: number, vocabularyId: number, audioUrl: string, pronunciationScore: number, responseTime?: number) {
        // Update vocabulary progress with pronunciation score
        await this.updateVocabularyProgress(vocabularyId, {
            pronunciation_score: pronunciationScore,
            study_count: 1,
            correct_count: pronunciationScore >= 7 ? 1 : 0 // Consider 7+ as correct
        })

        // Record activity
        return this.recordSessionActivity(sessionId, {
            vocabulary_id: vocabularyId,
            activity_type: 'pronunciation',
            response: audioUrl,
            response_time: responseTime || 0, // Fix: provide default if undefined
            pronunciation_score: pronunciationScore,
            is_correct: pronunciationScore >= 7
        })
    }

    // Đánh dấu từ đã biết (shortcut method)
    static async markVocabularyKnown(vocabularyId: number) {
        return this.updateVocabularyProgress(vocabularyId, {
            is_known: true,
            study_count: 1,
            correct_count: 1
        })
    }

    // Đánh dấu từ chưa biết (shortcut method)
    static async markVocabularyUnknown(vocabularyId: number) {
        return this.updateVocabularyProgress(vocabularyId, {
            is_known: false,
            study_count: 1,
            correct_count: 0
        })
    }

    // 📊 ANALYTICS APIs

    // Lấy thống kê học tập của học sinh
    static async getStudentAnalytics(studentId: number) {
        const response = await axiosInstance.get<any>(
            `${FLASHCARD_BASE_URL}/analytics/student/${studentId}`
        )

        // Transform backend response to standard format
        const backendData = response.data
        return {
            success: backendData.code === 200,
            data: backendData.data,
            message: backendData.message
        }
    }

    // Lấy thống kê theo bài học
    static async getLessonAnalytics(lessonId: number, studentId?: number) {
        const queryParams = studentId ? `?studentId=${studentId}` : ''
        const response = await axiosInstance.get<any>(
            `${FLASHCARD_BASE_URL}/analytics/lesson/${lessonId}${queryParams}`
        )

        // Transform backend response to standard format
        const backendData = response.data
        return {
            success: backendData.code === 200,
            data: backendData.data,
            message: backendData.message
        }
    }

    // Lấy thống kê tổng quan hệ thống
    static async getSystemAnalytics() {
        const response = await axiosInstance.get<any>(
            `${FLASHCARD_BASE_URL}/analytics/system`
        )

        // Transform backend response to standard format
        const backendData = response.data
        return {
            success: backendData.code === 200,
            data: backendData.data,
            message: backendData.message
        }
    }
}
