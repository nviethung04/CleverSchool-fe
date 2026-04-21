import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    Mic,
    MicOff,
    Play,
    Volume2,
    RefreshCw,
    Award,
    Loader2
} from 'lucide-react'
import { usePronunciation } from '@/hooks/flashcard/use-pronunciation'
import { Vocabulary } from '@/lib/types/flashcard'
import { cn } from '@/lib/utils'

// Helper function to format time in MM:SS
const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

interface PronunciationCardProps {
    vocabulary: Vocabulary
    studentId: number
    onScoreReceived?: (score: number) => void
    className?: string
}

export const PronunciationCard = ({
    vocabulary,
    studentId,
    onScoreReceived,
    className
}: PronunciationCardProps) => {
    const [showResult, setShowResult] = useState(false)

    const {
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
        hasAudio,
        hasScore
    } = usePronunciation({
        vocabularyId: vocabulary.id,
        studentId,
        onScoreReceived: (newScore) => {
            setShowResult(true)
            onScoreReceived?.(newScore)
        }
    })

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600'
        if (score >= 60) return 'text-yellow-600'
        return 'text-red-600'
    }

    const getScoreBadgeColor = (score: number) => {
        if (score >= 80) return 'bg-green-100 text-green-800'
        if (score >= 60) return 'bg-yellow-100 text-yellow-800'
        return 'bg-red-100 text-red-800'
    }

    const handleReset = () => {
        reset()
        setShowResult(false)
    }

    const playVocabularyAudio = () => {
        if (vocabulary.audio_url) {
            const audio = new Audio(vocabulary.audio_url)
            audio.play().catch(console.error)
        }
    }

    return (
        <Card className={cn("w-full max-w-md mx-auto", className)}>
            <CardHeader className="text-center pb-4">
                <CardTitle className="flex items-center justify-center gap-2">
                    <Mic className="h-5 w-5" />
                    Luyện phát âm
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Target word */}
                <div className="text-center bg-muted rounded-lg p-4">
                    <h3 className="text-2xl font-bold text-primary mb-1">
                        {vocabulary.word}
                    </h3>
                    {vocabulary.phonetic && (
                        <p className="text-muted-foreground mb-2">
                            /{vocabulary.phonetic}/
                        </p>
                    )}

                    {/* Play original audio */}
                    {vocabulary.audio_url && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={playVocabularyAudio}
                            className="mt-2"
                        >
                            <Volume2 className="h-4 w-4 mr-2" />
                            Nghe mẫu
                        </Button>
                    )}
                </div>

                {/* Recording controls */}
                <div className="space-y-3">
                    {!isRecording && !hasAudio && (
                        <Button
                            onClick={startRecording}
                            className="w-full"
                            size="lg"
                        >
                            <Mic className="h-5 w-5 mr-2" />
                            Bắt đầu ghi âm
                        </Button>
                    )}

                    {isRecording && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-center gap-2 text-red-600">
                                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                                <span className="font-medium">Đang ghi âm...</span>
                            </div>
                            <Button
                                onClick={stopRecording}
                                variant="outline"
                                className="w-full"
                                size="lg"
                            >
                                <MicOff className="h-5 w-5 mr-2" />
                                Dừng ghi âm
                            </Button>
                        </div>
                    )}

                    {hasAudio && !showResult && (
                        <div className="space-y-3">
                            {/* Playback controls with progress */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={isPlaying ? pauseAudio : playRecordedAudio}
                                        variant="outline"
                                        className="flex-1"
                                        disabled={!hasAudio}
                                    >
                                        {isPlaying ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Đang phát...
                                            </>
                                        ) : (
                                            <>
                                                <Play className="h-4 w-4 mr-2" />
                                                Nghe lại
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={handleReset}
                                        variant="outline"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Audio progress bar */}
                                {isPlaying || playbackProgress > 0 ? (
                                    <div className="space-y-1">
                                        <Progress value={playbackProgress} className="h-2" />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>{formatTime(currentTime)}</span>
                                            <span>{formatTime(audioDuration)}</span>
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            <Button
                                onClick={assessPronunciation}
                                disabled={isProcessing}
                                className="w-full"
                                size="lg"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                        Đang đánh giá...
                                    </>
                                ) : (
                                    <>
                                        <Award className="h-5 w-5 mr-2" />
                                        Đánh giá phát âm
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Results */}
                {showResult && hasScore && score !== null && (
                    <div className="space-y-3">
                        <div className="text-center bg-muted rounded-lg p-4">
                            <div className="mb-2">
                                <Badge
                                    className={cn("text-lg px-3 py-1", getScoreBadgeColor(score))}
                                >
                                    {score}/100 điểm
                                </Badge>
                            </div>

                            {/* Score visualization */}
                            <div className="space-y-2">
                                <Progress value={score} className="h-3" />
                                <p className={cn("font-medium", getScoreColor(score))}>
                                    {score >= 80 && "Tuyệt vời! Phát âm rất chuẩn!"}
                                    {score >= 60 && score < 80 && "Khá tốt! Hãy tiếp tục luyện tập!"}
                                    {score < 60 && "Cần cải thiện. Nghe lại và thử lần nữa!"}
                                </p>
                            </div>

                            {feedback && (
                                <p className="text-sm text-muted-foreground mt-2">
                                    {feedback}
                                </p>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2">
                            <Button
                                onClick={isPlaying ? pauseAudio : playRecordedAudio}
                                variant="outline"
                                className="flex-1"
                                disabled={!hasAudio}
                            >
                                {isPlaying ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Đang phát...
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-4 w-4 mr-2" />
                                        Nghe lại
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={handleReset}
                                variant="outline"
                                className="flex-1"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Thử lại
                            </Button>
                        </div>
                    </div>
                )}

                {/* Tips */}
                {!isRecording && !hasAudio && (
                    <div className="bg-blue-50 rounded-lg p-3">
                        <h4 className="font-medium text-blue-800 mb-1">💡 Mẹo:</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Nói to và rõ ràng</li>
                            <li>• Đảm bảo môi trường yên tĩnh</li>
                            <li>• Phát âm chậm và chính xác</li>
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
