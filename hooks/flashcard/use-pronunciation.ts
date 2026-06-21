import { useState, useRef, useCallback, useEffect } from 'react'
import { FlashcardAPI } from '@/lib/api/flashcard-api'
import { useToast } from '@/hooks/use-toast'

interface UsePronunciationProps {
    vocabularyId: number
    studentId: number
    onScoreReceived?: (score: number) => void
}

export const usePronunciation = ({
    vocabularyId,
    studentId,
    onScoreReceived
}: UsePronunciationProps) => {
    const [isRecording, setIsRecording] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [audioData, setAudioData] = useState<Blob | null>(null)
    const [score, setScore] = useState<number | null>(null)
    const [feedback, setFeedback] = useState<string | null>(null)

    // Audio playback states
    const [isPlaying, setIsPlaying] = useState(false)
    const [playbackProgress, setPlaybackProgress] = useState(0)
    const [audioDuration, setAudioDuration] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunks = useRef<Blob[]>([])
    const audioElementRef = useRef<HTMLAudioElement | null>(null)
    const { toast } = useToast()

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            })

            mediaRecorderRef.current = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            })

            audioChunks.current = []

            mediaRecorderRef.current.ondataavailable = (event: BlobEvent) => {
                audioChunks.current.push(event.data)
            }

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunks.current, {
                    type: 'audio/webm;codecs=opus'
                })
                setAudioData(audioBlob)

                // Auto-play recorded audio immediately
                setTimeout(() => {
                    playRecordedAudio()
                }, 100)

                // Stop all tracks to release microphone
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorderRef.current.start()
            setIsRecording(true)
            setScore(null)
            setFeedback(null)

            toast({
                title: 'Đang ghi âm',
                description: 'Hãy phát âm từ vựng này'
            })
        } catch (err) {
            toast({
                title: 'Lỗi',
                description: 'Không thể truy cập microphone',
                variant: 'destructive'
            })
        }
    }, [toast])

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
        }
    }, [isRecording])

    const assessPronunciation = useCallback(async () => {
        if (!audioData) return

        try {
            setIsProcessing(true)

            // For now, simulate assessment with random score
            // TODO: Implement actual API call when available
            const simulatedScore = Math.floor(Math.random() * 40) + 60; // Score between 60-100
            const simulatedFeedback = simulatedScore >= 80 ? 'Tuyệt vời!' : 'Cần cải thiện thêm';

            setScore(simulatedScore)
            setFeedback(simulatedFeedback)

            if (onScoreReceived) {
                onScoreReceived(simulatedScore)
            }

            // Show appropriate toast based on score
            if (simulatedScore >= 80) {
                toast({
                    title: 'Tuyệt vời!',
                    description: `Điểm phát âm: ${simulatedScore}/100. Phát âm rất tốt!`
                })
            } else if (simulatedScore >= 60) {
                toast({
                    title: 'Khá tốt',
                    description: `Điểm phát âm: ${simulatedScore}/100. Hãy thử lại để cải thiện!`
                })
            } else {
                toast({
                    title: 'Cần cải thiện',
                    description: `Điểm phát âm: ${simulatedScore}/100. Nghe lại và thử lần nữa!`,
                    variant: 'destructive'
                })
            }
        } catch (err) {
            toast({
                title: 'Lỗi',
                description: 'Không thể đánh giá phát âm',
                variant: 'destructive'
            })
        } finally {
            setIsProcessing(false)
        }
    }, [audioData, vocabularyId, studentId, onScoreReceived, toast])

    const reset = useCallback(() => {
        if (audioElementRef.current) {
            audioElementRef.current.pause()
            audioElementRef.current = null
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
        }
        setAudioData(null)
        setScore(null)
        setFeedback(null)
        setIsRecording(false)
        setIsProcessing(false)
        setIsPlaying(false)
        setPlaybackProgress(0)
        setAudioDuration(0)
        setCurrentTime(0)
        audioChunks.current = []
    }, [])

    useEffect(() => {
        reset()
    }, [vocabularyId, reset])

    const playRecordedAudio = useCallback(async () => {
        if (!audioData) return;

        try {
            setIsPlaying(true)

            const audioUrl = URL.createObjectURL(audioData)
            const audio = new Audio(audioUrl)
            audioElementRef.current = audio

            // Set audio duration once metadata is loaded
            audio.addEventListener('loadedmetadata', () => {
                setAudioDuration(audio.duration)
            })

            // Track playback progress
            audio.addEventListener('timeupdate', () => {
                if (audio.duration) {
                    const progress = (audio.currentTime / audio.duration) * 100
                    setPlaybackProgress(progress)
                    setCurrentTime(audio.currentTime)
                }
            })

            // Reset states when audio ends
            audio.addEventListener('ended', () => {
                setIsPlaying(false)
                setPlaybackProgress(0)
                setCurrentTime(0)
                audioElementRef.current = null
            })

            // Reset states on error
            audio.addEventListener('error', () => {
                setIsPlaying(false)
                setPlaybackProgress(0)
                setCurrentTime(0)
                audioElementRef.current = null
            })

            await audio.play()
        } catch (error) {
            setIsPlaying(false)
            setPlaybackProgress(0)
            setCurrentTime(0)
            audioElementRef.current = null
        }
    }, [audioData])

    const pauseAudio = useCallback(() => {
        if (audioElementRef.current) {
            audioElementRef.current.pause()
            setIsPlaying(false)
        }
    }, [])

    return {
        isRecording,
        isProcessing,
        audioData,
        score,
        feedback,
        // Playback states
        isPlaying,
        playbackProgress,
        audioDuration,
        currentTime,
        // Functions
        startRecording,
        stopRecording,
        assessPronunciation,
        playRecordedAudio,
        pauseAudio,
        reset,
        hasAudio: !!audioData,
        hasScore: score !== null
    }
}
