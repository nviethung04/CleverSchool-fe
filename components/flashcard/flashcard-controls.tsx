import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
    ChevronLeft,
    ChevronRight,
    Check,
    X,
    Eye,
    Book,
    Play,
    Pause,
    Square
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FlashcardControlsProps {
    currentIndex: number
    totalCards: number
    progress: number
    isFlipped: boolean
    canMarkCard: boolean
    hasNext: boolean
    hasPrev: boolean
    onNext: () => void
    onPrev: () => void
    onFlip: () => void
    onMarkKnown: () => void
    onMarkUnknown: () => void
    sessionActive: boolean
    onStartSession?: () => void
    onCompleteSession?: () => void
    studyTime?: number
    className?: string
    // Add marking state for visual feedback
    markingState?: {
        isMarking: boolean
        markedAs: 'known' | 'unknown' | null
        vocabularyId: number | null
    }
    currentVocabularyId?: number
    // Add persistent vocabulary choices
    vocabularyChoices?: Map<number, 'known' | 'unknown'>
}

export const FlashcardControls = ({
    currentIndex,
    totalCards,
    progress,
    isFlipped,
    canMarkCard,
    hasNext,
    hasPrev,
    onNext,
    onPrev,
    onFlip,
    onMarkKnown,
    onMarkUnknown,
    sessionActive,
    onStartSession,
    onCompleteSession,
    studyTime = 0,
    className,
    markingState,
    currentVocabularyId,
    vocabularyChoices
}: FlashcardControlsProps) => {
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    // Check if current vocabulary is being marked or has been marked recently
    const isCurrentVocabMarking = markingState?.vocabularyId === currentVocabularyId && markingState?.isMarking
    const isCurrentVocabMarked = markingState?.vocabularyId === currentVocabularyId && markingState?.markedAs
    const recentMarkedAs = isCurrentVocabMarked ? markingState?.markedAs : null

    // Check persistent choice for current vocabulary
    const persistentChoice = currentVocabularyId ? vocabularyChoices?.get(currentVocabularyId) : null

    // Final state: recent marking takes priority, fallback to persistent choice
    const finalMarkedAs = recentMarkedAs || persistentChoice

    return (
        <Card className={cn("w-full max-w-md mx-auto", className)}>
            <CardContent className="p-4 space-y-4">
                {/* Progress and stats */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">
                            Thẻ {currentIndex + 1} / {totalCards}
                        </span>
                        <Badge variant="secondary">
                            {progress}% hoàn thành
                        </Badge>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                {/* Session info */}
                {sessionActive && (
                    <div className="flex justify-between items-center text-sm bg-muted rounded-lg p-2">
                        <span className="text-muted-foreground">Thời gian học:</span>
                        <Badge variant="outline">{formatTime(studyTime)}</Badge>
                    </div>
                )}

                {/* Navigation controls */}
                <div className="relative">
                    <div className="flex items-center justify-between gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onPrev}
                            disabled={!hasPrev || !sessionActive}
                            className="flex-1"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Trước
                        </Button>

                        <Button
                            variant="outline"
                            onClick={onFlip}
                            disabled={!sessionActive}
                            className="px-4"
                            title={isFlipped ? "Nhấn để xem từ" : "Nhấn để xem nghĩa"}
                        >
                            {isFlipped ? (
                                <Book className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onNext}
                            disabled={!hasNext || !sessionActive}
                            className="flex-1"
                        >
                            Sau
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>

                    {/* Overlay khi chưa bắt đầu session */}
                    {!sessionActive && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                            <div className="text-center">
                                <Play className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground font-medium">
                                    Nhấn "Bắt đầu học" để bắt đầu
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Knowledge marking buttons */}
                {isFlipped && canMarkCard && sessionActive && (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={onMarkUnknown}
                            disabled={isCurrentVocabMarking || finalMarkedAs === 'unknown'}
                            className={cn(
                                "flex-1 relative transition-all duration-200",
                                finalMarkedAs === 'unknown'
                                    ? "bg-red-100 border-red-300 text-red-700 font-medium cursor-default"
                                    : "text-red-600 border-red-200 hover:bg-red-50",
                                (isCurrentVocabMarking || finalMarkedAs === 'unknown') && "opacity-75"
                            )}
                        >
                            {isCurrentVocabMarking ? (
                                <>
                                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-red-300 border-t-red-600 rounded-full" />
                                    Đang lưu...
                                </>
                            ) : finalMarkedAs === 'unknown' ? (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Đã đánh dấu
                                </>
                            ) : (
                                <>
                                    <X className="h-4 w-4 mr-2" />
                                    Chưa biết
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={onMarkKnown}
                            disabled={isCurrentVocabMarking || finalMarkedAs === 'known'}
                            className={cn(
                                "flex-1 relative transition-all duration-200",
                                finalMarkedAs === 'known'
                                    ? "bg-green-700 hover:bg-green-800 font-medium cursor-default"
                                    : "bg-green-600 hover:bg-green-700",
                                (isCurrentVocabMarking || finalMarkedAs === 'known') && "opacity-75"
                            )}
                        >
                            {isCurrentVocabMarking ? (
                                <>
                                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-green-200 border-t-white rounded-full" />
                                    Đang lưu...
                                </>
                            ) : finalMarkedAs === 'known' ? (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Đã đánh dấu
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Đã biết
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {/* Session controls */}
                <div className="flex gap-2">
                    {!sessionActive ? (
                        <Button
                            onClick={onStartSession}
                            className="flex-1"
                            disabled={totalCards === 0}
                        >
                            <Play className="h-4 w-4 mr-2" />
                            Bắt đầu học
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            onClick={onCompleteSession}
                            className="flex-1"
                        >
                            <Square className="h-4 w-4 mr-2" />
                            Hoàn thành
                        </Button>
                    )}
                </div>

                {/* Quick stats */}
                {totalCards > 0 && (
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-blue-50 rounded p-2">
                            <div className="font-medium text-blue-600">{totalCards}</div>
                            <div className="text-blue-500">Tổng thẻ</div>
                        </div>
                        <div className="bg-green-50 rounded p-2">
                            <div className="font-medium text-green-600">{Math.round(progress * totalCards / 100)}</div>
                            <div className="text-green-500">Đã học</div>
                        </div>
                        <div className="bg-gray-50 rounded p-2">
                            <div className="font-medium text-gray-600">{totalCards - Math.round(progress * totalCards / 100)}</div>
                            <div className="text-gray-500">Còn lại</div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
