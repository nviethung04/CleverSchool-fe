'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Trophy,
    Clock,
    BookOpen,
    CheckCircle,
    Target,
    RotateCcw,
    ArrowLeft
} from 'lucide-react'

interface SessionCompleteDialogProps {
    open: boolean
    onClose: () => void
    onRestartSession: () => void
    onGoBack: () => void
    stats: {
        totalTimeSpent: number
        wordsStudied: number
        wordsKnown: number
        totalWords: number
        completionRate: number
        averageScore: number
    }
}

export const SessionCompleteDialog = ({
    open,
    onClose,
    onRestartSession,
    onGoBack,
    stats
}: SessionCompleteDialogProps) => {
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const getPerformanceMessage = () => {
        const percentage = (stats.wordsKnown / stats.totalWords) * 100
        if (percentage >= 80) return { text: "Xuất sắc!", color: "text-green-600" }
        if (percentage >= 60) return { text: "Tốt!", color: "text-blue-600" }
        if (percentage >= 40) return { text: "Khá!", color: "text-yellow-600" }
        return { text: "Cần cố gắng thêm!", color: "text-orange-600" }
    }

    const performance = getPerformanceMessage()

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2">
                        <Trophy className="h-6 w-6 text-yellow-500" />
                        Hoàn thành!
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Performance Message */}
                    <div className="text-center">
                        <p className={`text-lg font-semibold ${performance.color}`}>
                            {performance.text}
                        </p>
                        <p className="text-muted-foreground text-sm">
                            Bạn đã hoàn thành phiên học flashcard
                        </p>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-2 gap-3">
                        <Card>
                            <CardContent className="p-3 text-center">
                                <Clock className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                                <p className="text-sm text-muted-foreground">Thời gian</p>
                                <p className="font-semibold">{formatTime(stats.totalTimeSpent)}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-3 text-center">
                                <BookOpen className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                                <p className="text-sm text-muted-foreground">Đã học</p>
                                <p className="font-semibold">{stats.wordsStudied}/{stats.totalWords}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-3 text-center">
                                <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-500" />
                                <p className="text-sm text-muted-foreground">Đã biết</p>
                                <p className="font-semibold">{stats.wordsKnown}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-3 text-center">
                                <Target className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                                <p className="text-sm text-muted-foreground">Tỷ lệ</p>
                                <p className="font-semibold">{Math.round(stats.completionRate * 100)}%</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Progress Summary */}
                    <Card>
                        <CardContent className="p-3">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-muted-foreground">Tiến độ hoàn thành</span>
                                <Badge variant="secondary">
                                    {Math.round(stats.completionRate * 100)}%
                                </Badge>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${stats.completionRate * 100}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6">
                        <Button
                            variant="outline"
                            onClick={onRestartSession}
                            className="flex-1 flex items-center justify-center gap-2"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Học lại
                        </Button>

                        <Button
                            onClick={onGoBack}
                            className="flex-1 flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Quay lại
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
