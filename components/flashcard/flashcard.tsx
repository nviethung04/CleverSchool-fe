import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Volume2, Eye, Book } from 'lucide-react'
import { Vocabulary, StudentProgress } from '@/lib/types/flashcard'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface FlashcardProps {
    vocabulary: Vocabulary
    progress?: StudentProgress
    isFlipped: boolean
    onFlip: () => void
    onPlayAudio?: () => void
    className?: string
    sessionActive?: boolean  // Add session state
    disabled?: boolean       // Add disabled prop
}

export const Flashcard = ({
    vocabulary,
    progress,
    isFlipped,
    onFlip,
    onPlayAudio,
    className,
    sessionActive = false,
    disabled = false
}: FlashcardProps) => {
    const getDifficultyColor = (difficulty: number) => {
        if (difficulty <= 2) return 'bg-green-500'
        if (difficulty <= 4) return 'bg-yellow-500'
        return 'bg-red-500'
    }

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'new': return 'bg-blue-500'
            case 'learning': return 'bg-yellow-500'
            case 'known': return 'bg-green-500'
            case 'mastered': return 'bg-purple-500'
            default: return 'bg-gray-500'
        }
    }

    return (
        <div className={cn("relative w-full max-w-md mx-auto", className)}>
            <motion.div
                className="relative w-full h-80"
                style={{ perspective: 1000 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
            >
                <motion.div
                    className={cn(
                        "absolute inset-0 w-full h-full",
                        !disabled && sessionActive ? "cursor-pointer" : "cursor-not-allowed"
                    )}
                    initial={false}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6, type: "spring" }}
                    style={{ transformStyle: "preserve-3d" }}
                    onClick={sessionActive && !disabled ? onFlip : undefined}
                >
                    {/* Front side */}
                    <Card className="absolute inset-0 w-full h-full backface-hidden">
                        <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center">
                            {/* Status badges */}
                            <div className="absolute top-4 left-4 flex gap-2">
                                {progress && (
                                    <Badge
                                        className={cn("text-white", getStatusColor(progress.status))}
                                    >
                                        {progress.status}
                                    </Badge>
                                )}
                                <Badge
                                    variant="secondary"
                                    className={cn("text-white", getDifficultyColor(vocabulary.difficulty))}
                                >
                                    {vocabulary.difficulty}/5
                                </Badge>
                            </div>

                            {/* Audio button */}
                            {vocabulary.audio_url && onPlayAudio && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-4 right-4"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onPlayAudio()
                                    }}
                                >
                                    <Volume2 className="h-4 w-4" />
                                </Button>
                            )}

                            {/* Main word */}
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <h2 className="text-4xl font-bold mb-2 text-primary">
                                    {vocabulary.word}
                                </h2>

                                {vocabulary.phonetic && (
                                    <p className="text-lg text-muted-foreground mb-4">
                                        /{vocabulary.phonetic}/
                                    </p>
                                )}

                                <Badge variant="outline" className="mb-4">
                                    {vocabulary.part_of_speech}
                                </Badge>

                                {/* Image if available */}
                                {vocabulary.image_url && (
                                    <div className="w-32 h-32 rounded-lg overflow-hidden mb-4">
                                        <img
                                            src={vocabulary.image_url}
                                            alt={vocabulary.word}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Flip hint */}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Eye className="h-4 w-4" />
                                <span>Nhấn để xem nghĩa</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Back side */}
                    <Card
                        className="absolute inset-0 w-full h-full backface-hidden"
                        style={{ transform: "rotateY(180deg)" }}
                    >
                        <CardContent className="flex flex-col justify-center h-full p-6 text-center">
                            {/* Translation */}
                            <div className="mb-6">
                                <h3 className="text-2xl font-semibold mb-2 text-primary">
                                    {vocabulary.translation}
                                </h3>

                                {vocabulary.definition && (
                                    <p className="text-muted-foreground mb-4">
                                        {vocabulary.definition}
                                    </p>
                                )}
                            </div>

                            {/* Example */}
                            {vocabulary.example_sentence && (
                                <div className="bg-muted rounded-lg p-4 mb-4">
                                    <p className="italic mb-2">"{vocabulary.example_sentence}"</p>
                                    {vocabulary.example_translation && (
                                        <p className="text-sm text-muted-foreground">
                                            "{vocabulary.example_translation}"
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Level and frequency info */}
                            <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                                <span>Cấp độ: <strong>{vocabulary.level}</strong></span>
                                <span>Tần suất: <strong>{vocabulary.frequency}%</strong></span>
                            </div>

                            {/* Flip hint */}
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-4">
                                <Eye className="h-4 w-4" />
                                <span>Nhấn để xem từ</span>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>

            {/* Disabled overlay */}
            {!sessionActive && (
                <div className="absolute inset-0 bg-gray-50/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
                    <div className="text-center text-gray-500">
                        <Book className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-medium">Nhấn "Bắt đầu học" để thao tác</p>
                    </div>
                </div>
            )}

            <style jsx global>{`
        .backface-hidden {
          backface-visibility: hidden;
        }
      `}</style>
        </div>
    )
}
