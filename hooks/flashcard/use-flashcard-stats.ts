import { useState, useEffect } from 'react'
import { FlashcardAPI } from '@/lib/api/flashcard-api'
import { FlashcardStats } from '@/lib/types/flashcard'
import { useToast } from '@/hooks/use-toast'

export const useFlashcardStats = (studentId: number) => {
    const [stats, setStats] = useState<FlashcardStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { toast } = useToast()

    useEffect(() => {
        const loadStats = async () => {
            try {
                setLoading(true)
                const response = await FlashcardAPI.getStudentAnalytics(studentId)
                if (response.success) {
                    setStats(response.data)
                }
            } catch (err) {
                setError('Không thể tải thống kê')
                toast({
                    title: 'Lỗi',
                    description: 'Không thể tải thống kê học tập',
                    variant: 'destructive'
                })
            } finally {
                setLoading(false)
            }
        }

        if (studentId) {
            loadStats()
        }
    }, [studentId, toast])

    const refresh = async () => {
        if (!studentId) return

        try {
            setLoading(true)
            const response = await FlashcardAPI.getStudentAnalytics(studentId)
            if (response.success) {
                setStats(response.data)
            }
        } catch (err) {
            // Silently handle error
        } finally {
            setLoading(false)
        }
    }

    return {
        stats,
        loading,
        error,
        refresh
    }
}
