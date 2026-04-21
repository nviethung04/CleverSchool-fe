'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
    PlayCircle,
    RotateCcw,
    BookOpen,
    Clock
} from 'lucide-react'

interface ResumeSessionDialogProps {
    open: boolean
    onContinue: () => void
    onRestart: () => void
    sessionData?: {
        current_index: number
        session: {
            total_cards: number
            completed_cards: number
            study_duration: number
        }
        vocabularies: Array<{
            vocabulary: {
                word: string
            }
        }>
    }
}

export const ResumeSessionDialog = ({
    open,
    onContinue,
    onRestart,
    sessionData
}: ResumeSessionDialogProps) => {
    if (!sessionData) return null

    const currentWord = sessionData.vocabularies[sessionData.current_index]?.vocabulary?.word || 'N/A'
    const progress = sessionData.session.total_cards > 0
        ? Math.round((sessionData.current_index / sessionData.session.total_cards) * 100)
        : 0

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <Dialog open={open}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl font-bold">
                        Bạn đang học dở!
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="text-center text-muted-foreground">
                        <p>Phiên học trước chưa hoàn thành</p>
                        <p className="text-sm">Bạn có muốn tiếp tục học không?</p>
                    </div>

                    {/* Session Progress Info */}
                    <Card>
                        <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-blue-500" />
                                    <span className="text-sm text-muted-foreground">Từ hiện tại:</span>
                                </div>
                                <span className="font-semibold">{currentWord}</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <PlayCircle className="h-4 w-4 text-green-500" />
                                    <span className="text-sm text-muted-foreground">Tiến độ:</span>
                                </div>
                                <span className="font-semibold">
                                    {sessionData.current_index}/{sessionData.session.total_cards} ({progress}%)
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-purple-500" />
                                    <span className="text-sm text-muted-foreground">Thời gian đã học:</span>
                                </div>
                                <span className="font-semibold">
                                    {formatTime(sessionData.session.study_duration)}
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-1">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <p className="text-xs text-center text-muted-foreground">
                                    {progress}% hoàn thành
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6">
                        <Button
                            variant="outline"
                            onClick={onRestart}
                            className="flex-1 flex items-center justify-center gap-2"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Học lại từ đầu
                        </Button>

                        <Button
                            onClick={onContinue}
                            className="flex-1 flex items-center justify-center gap-2"
                        >
                            <PlayCircle className="h-4 w-4" />
                            Tiếp tục học
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
