import { useState, useEffect, useCallback } from 'react'
import { FlashcardAPI } from '@/lib/api/flashcard-api'
import {
    LessonVocabulary,
    FlashcardSession,
    StudentProgress,
} from '@/lib/types/flashcard'
import { useToast } from '@/hooks/use-toast'

export const useFlashcard = (lessonId: number, studentId: number) => {
    const [vocabularies, setVocabularies] = useState<LessonVocabulary[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)
    const [session, setSession] = useState<FlashcardSession | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [cardStartTime, setCardStartTime] = useState<number>(Date.now())
    const [sessionStartTime, setSessionStartTime] = useState<number>(0)

    // Marking state tracking
    const [markingState, setMarkingState] = useState<{
        isMarking: boolean
        markedAs: 'known' | 'unknown' | null
        vocabularyId: number | null
    }>({
        isMarking: false,
        markedAs: null,
        vocabularyId: null
    })

    // Persistent vocabulary choices tracking
    const [vocabularyChoices, setVocabularyChoices] = useState<Map<number, 'known' | 'unknown'>>(new Map())

    // Session completion dialog
    const [showCompletionDialog, setShowCompletionDialog] = useState(false)
    const [completionStats, setCompletionStats] = useState<any>(null)

    // Resume session dialog
    const [showResumeDialog, setShowResumeDialog] = useState(false)
    const [pendingSessionData, setPendingSessionData] = useState<any>(null)

    // Session statistics
    const [sessionStats, setSessionStats] = useState({
        wordsStudied: new Set<number>(), // Track unique vocabulary IDs studied
        wordsKnown: new Set<number>(),   // Track vocabulary IDs marked as known
        totalScores: [] as number[]      // Track scores for average calculation
    })

    const { toast } = useToast()

    // Load vocabularies for lesson
    useEffect(() => {
        const loadVocabularies = async () => {
            try {
                setLoading(true)
                const response = await FlashcardAPI.getLessonVocabularies(lessonId)

                if (response.success && response.data) {
                    // Handle nested data structure: response.data.data.vocabularies
                    const lessonData = response.data as any
                    const vocabulariesData = lessonData.vocabularies || []
                    setVocabularies(vocabulariesData)
                }
            } catch (err) {
                setError('Không thể tải từ vựng')
                toast({
                    title: 'Lỗi',
                    description: 'Không thể tải từ vựng',
                    variant: 'destructive'
                })
            } finally {
                setLoading(false)
            }
        }

        if (lessonId) {
            loadVocabularies()
        }
    }, [lessonId, toast])

    // Start study session
    const startSession = useCallback(async () => {
        try {
            const response = await FlashcardAPI.startStudySession(lessonId)

            if (response.success) {
                const data = response.data

                // Check if it's resuming existing session
                if (!data.is_new_session && data.current_index > 0) {
                    // Store pending session data and show resume dialog
                    setPendingSessionData(data)
                    setShowResumeDialog(true)
                } else {
                    // New session or resume from beginning - proceed normally
                    proceedWithSession(data)
                }
            } else {
                toast({
                    title: 'Lỗi',
                    description: 'Không thể bắt đầu phiên học',
                    variant: 'destructive'
                })
            }
        } catch (err) {
            toast({
                title: 'Lỗi',
                description: 'Không thể bắt đầu phiên học',
                variant: 'destructive'
            })
        }
    }, [lessonId, toast])

    // Helper function to proceed with session setup
    const proceedWithSession = useCallback((data: any) => {
        // Update vocabularies FIRST if provided
        if (data.vocabularies && data.vocabularies.length > 0) {
            setVocabularies(data.vocabularies)
        }

        // Then set session and index (this will trigger the useEffect with proper vocabularies)
        setSession(data.session)
        setCurrentIndex(data.current_index || 0)
        setCardStartTime(Date.now()) // Start timing for first card
        setSessionStartTime(Date.now()) // Start session timer

        // Reset session stats
        setSessionStats({
            wordsStudied: new Set<number>(),
            wordsKnown: new Set<number>(),
            totalScores: []
        })

        console.log('✅ Session started:', data.session)
        toast({
            title: data.is_new_session === false ? 'Tiếp tục học' : 'Bắt đầu học',
            description: data.message || 'Phiên học đã được khởi tạo'
        })
    }, [toast])

    // Handle resume session choice
    const handleResumeSession = useCallback((continueFromCurrent: boolean) => {
        if (!pendingSessionData) return

        const data = { ...pendingSessionData }
        if (!continueFromCurrent) {
            // Start from beginning
            data.current_index = 0
        }

        proceedWithSession(data)
        setShowResumeDialog(false)
        setPendingSessionData(null)
    }, [pendingSessionData, proceedWithSession])

    // Record card view when vocabulary changes
    useEffect(() => {
        if (session && vocabularies[currentIndex]) {
            const currentVocab = vocabularies[currentIndex]
            const vocabularyId = currentVocab.vocabulary_id

            // Try multiple ways to get vocabularyId  
            const finalVocabId = vocabularyId || currentVocab.vocabulary?.id || (currentVocab as any).id

            if (!finalVocabId) {
                return
            }

            setCardStartTime(Date.now())

            // Track viewed vocabulary in session stats (use finalVocabId)
            setSessionStats(prev => ({
                ...prev,
                wordsStudied: new Set([...prev.wordsStudied, finalVocabId])
            }))

            // Record view activity (use finalVocabId)
            FlashcardAPI.recordCardView(session.id, finalVocabId)
                .catch(() => { }) // Silently handle errors
        }
    }, [session, currentIndex, vocabularies])

    // Navigate to next card
    const nextCard = useCallback(() => {
        if (currentIndex < vocabularies.length - 1) {
            setCurrentIndex(prev => prev + 1)
            setIsFlipped(false)
        }
    }, [currentIndex, vocabularies.length])

    // Navigate to previous card
    const prevCard = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1)
            setIsFlipped(false)
        }
    }, [currentIndex])

    // Flip card
    const flipCard = useCallback(() => {
        const newFlippedState = !isFlipped
        setIsFlipped(newFlippedState)

        // Record flip activity when flipping to see answer
        if (session && vocabularies[currentIndex] && newFlippedState) {
            const currentVocab = vocabularies[currentIndex]
            const vocabularyId = currentVocab.vocabulary_id
            const responseTime = Date.now() - cardStartTime

            // Try multiple ways to get vocabularyId (same as in useEffect)
            const finalVocabId = vocabularyId || currentVocab.vocabulary?.id || (currentVocab as any).id

            console.log('🃏 Hook recording flip:', {
                sessionId: session.id,
                vocabularyId,
                finalVocabId,
                responseTime,
                currentIndex,
                vocabulary: vocabularies[currentIndex]
            })

            if (!finalVocabId) {
                console.error('❌ No vocabulary ID found for flip:', currentVocab)
                return
            }

            FlashcardAPI.recordCardFlip(session.id, finalVocabId, responseTime)
                .catch(err => console.error('Failed to record card flip:', err))
        }
    }, [isFlipped, session, vocabularies, currentIndex, cardStartTime])

    // Mark card as known/unknown
    const markCard = useCallback(async (vocabularyId: number, isKnown: boolean) => {
        if (!session) return

        // Set loading state
        setMarkingState({
            isMarking: true,
            markedAs: null,
            vocabularyId: vocabularyId
        })

        const responseTime = Date.now() - cardStartTime

        try {
            // Use the new API method that combines progress update + activity recording
            await FlashcardAPI.recordCardMark(session.id, vocabularyId, isKnown, responseTime)

            console.log(`✅ Marked vocabulary ${vocabularyId} as ${isKnown ? 'known' : 'unknown'}`)

            // Save persistent choice
            setVocabularyChoices(prev => new Map(prev.set(vocabularyId, isKnown ? 'known' : 'unknown')))

            // Set success state with feedback (shorter duration)
            setMarkingState({
                isMarking: false,
                markedAs: isKnown ? 'known' : 'unknown',
                vocabularyId: vocabularyId
            })

            // Clear temporary feedback after 1 second (choice is still persisted)
            setTimeout(() => {
                setMarkingState({
                    isMarking: false,
                    markedAs: null,
                    vocabularyId: null
                })
            }, 1000)

            // Update session stats
            setSessionStats(prev => ({
                ...prev,
                wordsStudied: new Set([...prev.wordsStudied, vocabularyId]),
                wordsKnown: isKnown
                    ? new Set([...prev.wordsKnown, vocabularyId])
                    : new Set([...prev.wordsKnown].filter(id => id !== vocabularyId)),
                totalScores: [...prev.totalScores, isKnown ? 10 : 0] // Simple scoring: 10 for known, 0 for unknown
            }))

            // Update local state
            setVocabularies(prev => prev.map(v =>
                v.vocabulary_id === vocabularyId
                    ? {
                        ...v,
                        progress: {
                            ...v.progress!,
                            status: isKnown ? 'known' : 'learning',
                            is_known: isKnown,
                            study_count: (v.progress?.study_count || 0) + 1
                        }
                    }
                    : v
            ))

            toast({
                title: isKnown ? 'Đã biết' : 'Chưa biết',
                description: isKnown ? 'Từ đã được đánh dấu là đã biết' : 'Từ đã được đánh dấu là chưa biết'
            })
        } catch (err) {
            console.error('Failed to mark card:', err)

            // Set error state
            setMarkingState({
                isMarking: false,
                markedAs: null,
                vocabularyId: null
            })

            toast({
                title: 'Lỗi',
                description: 'Không thể lưu tiến độ học',
                variant: 'destructive'
            })
        }
    }, [session, cardStartTime, toast])

    // Record pronunciation attempt
    const recordPronunciation = useCallback(async (vocabularyId: number, audioUrl: string, score: number) => {
        if (!session) return

        const responseTime = Date.now() - cardStartTime

        try {
            await FlashcardAPI.recordPronunciation(session.id, vocabularyId, audioUrl, score, responseTime)

            console.log(`✅ Recorded pronunciation for ${vocabularyId}: ${score}/10`)

            toast({
                title: 'Phát âm đã ghi nhận',
                description: `Điểm số: ${score}/10`,
                variant: score >= 7 ? 'default' : 'destructive'
            })
        } catch (err) {
            console.error('Failed to record pronunciation:', err)
            toast({
                title: 'Lỗi',
                description: 'Không thể lưu kết quả phát âm',
                variant: 'destructive'
            })
        }
    }, [session, cardStartTime, toast])

    // Complete session
    const completeSession = useCallback(async () => {
        if (!session || vocabularies.length === 0) return

        console.log('🏁 Completing session:', session.id)

        try {
            // Calculate completion data
            const currentVocabId = vocabularies[currentIndex]?.vocabulary_id || vocabularies[vocabularies.length - 1]?.vocabulary_id
            const totalTimeSpent = Math.floor((Date.now() - sessionStartTime) / 1000) // Convert to seconds
            const wordsStudied = sessionStats.wordsStudied.size
            const wordsKnown = sessionStats.wordsKnown.size
            const wordsLearning = wordsStudied - wordsKnown
            const completionRate = vocabularies.length > 0 ? wordsStudied / vocabularies.length : 0
            const averageScore = sessionStats.totalScores.length > 0
                ? sessionStats.totalScores.reduce((sum, score) => sum + score, 0) / sessionStats.totalScores.length
                : 0

            const completionData = {
                vocabulary_id: currentVocabId,
                total_time_spent: totalTimeSpent,
                words_studied: wordsStudied,
                words_known: wordsKnown,
                words_learning: wordsLearning,
                completion_rate: completionRate,
                average_score: averageScore
            }

            console.log('📊 Session completion data:', completionData)

            const response = await FlashcardAPI.completeStudySession(session.id, completionData)
            console.log('📡 Complete session response:', response)

            if (response.success) {
                // Store completion stats for dialog
                setCompletionStats({
                    totalTimeSpent: totalTimeSpent,
                    wordsStudied: wordsStudied,
                    wordsKnown: wordsKnown,
                    totalWords: vocabularies.length,
                    completionRate: completionRate,
                    averageScore: averageScore
                })

                // Reset session state
                setSession(null)
                setCurrentIndex(0)
                setIsFlipped(false)
                setSessionStats({
                    wordsStudied: new Set<number>(),
                    wordsKnown: new Set<number>(),
                    totalScores: []
                })

                // Show completion dialog instead of toast
                setShowCompletionDialog(true)
                console.log('✅ Session completed successfully')
            } else {
                throw new Error('Failed to complete session')
            }
        } catch (err) {
            console.error('💥 Complete session error:', err)
            toast({
                title: 'Lỗi',
                description: 'Không thể hoàn thành phiên học',
                variant: 'destructive'
            })
        }
    }, [session, vocabularies, currentIndex, sessionStartTime, sessionStats, toast])

    // Get current vocabulary and progress
    const currentVocabulary = vocabularies[currentIndex]?.vocabulary
    const currentProgress = vocabularies[currentIndex]?.progress

    // Debug log for current state
    useEffect(() => {
        console.log('🎯 Current state:', {
            loading,
            vocabulariesCount: vocabularies.length,
            currentIndex,
            hasVocabularyAtIndex: !!vocabularies[currentIndex],
            vocabularyStructure: vocabularies[currentIndex] ? Object.keys(vocabularies[currentIndex]) : 'No vocab',
            currentVocabulary: currentVocabulary?.word || 'None',
            session: session ? `Session ${session.id}` : 'No session'
        })

        if (vocabularies.length > 0 && !currentVocabulary) {
            console.log('🔍 Debug vocabulary structure at index 0:', vocabularies[0])
        }
    }, [loading, vocabularies, currentIndex, currentVocabulary, session])

    // Dialog handlers
    const handleRestartSession = useCallback(() => {
        setShowCompletionDialog(false)
        setCompletionStats(null)
        // Start a new session immediately
        startSession()
    }, [startSession])

    const handleGoBack = useCallback(() => {
        setShowCompletionDialog(false)
        setCompletionStats(null)
        // Navigate back (handled by parent component)
    }, [])

    return {
        // State
        vocabularies,
        currentVocabulary,
        currentProgress,
        currentIndex,
        isFlipped,
        session,
        loading,
        error,

        // Marking state
        markingState,
        vocabularyChoices,

        // Dialog state
        showCompletionDialog,
        completionStats,
        showResumeDialog,
        pendingSessionData,

        // Actions
        startSession,
        completeSession,
        nextCard,
        prevCard,
        flipCard,
        markCard,
        recordPronunciation,
        handleRestartSession,
        handleGoBack,
        handleResumeSession,
        setShowCompletionDialog,

        // Computed
        hasNext: currentIndex < vocabularies.length - 1,
        hasPrev: currentIndex > 0,
        progress: vocabularies.length > 0 ? Math.round((currentIndex + 1) / vocabularies.length * 100) : 0,
        totalCards: vocabularies.length
    }
}
