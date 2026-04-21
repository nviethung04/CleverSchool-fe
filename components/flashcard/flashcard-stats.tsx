import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    BookOpen,
    Brain,
    Clock,
    Trophy,
    TrendingUp,
    Target,
    Zap
} from 'lucide-react'
import { FlashcardStats } from '@/lib/types/flashcard'
import { cn } from '@/lib/utils'

interface FlashcardStatsProps {
    stats: FlashcardStats
    className?: string
}

export const FlashcardStatsComponent = ({ stats, className }: FlashcardStatsProps) => {
    const formatTime = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
    }

    const getProgressColor = (percentage: number) => {
        if (percentage >= 80) return 'bg-green-500'
        if (percentage >= 60) return 'bg-yellow-500'
        if (percentage >= 40) return 'bg-orange-500'
        return 'bg-red-500'
    }

    const masteredPercentage = stats.total_vocabularies > 0
        ? Math.round((stats.mastered_cards / stats.total_vocabularies) * 100)
        : 0

    const knownPercentage = stats.total_vocabularies > 0
        ? Math.round(((stats.known_cards + stats.mastered_cards) / stats.total_vocabularies) * 100)
        : 0

    return (
        <div className={cn("space-y-4", className)}>
            {/* Overview cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <BookOpen className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                        <div className="text-2xl font-bold">{stats.total_vocabularies}</div>
                        <p className="text-sm text-muted-foreground">Tổng từ vựng</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <Brain className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                        <div className="text-2xl font-bold">{stats.mastered_cards}</div>
                        <p className="text-sm text-muted-foreground">Đã thành thạo</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <Clock className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <div className="text-2xl font-bold">{formatTime(stats.study_time_today)}</div>
                        <p className="text-sm text-muted-foreground">Hôm nay</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <Zap className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                        <div className="text-2xl font-bold">{stats.study_streak}</div>
                        <p className="text-sm text-muted-foreground">Ngày liên tiếp</p>
                    </CardContent>
                </Card>
            </div>

            {/* Progress overview */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Tiến độ học tập
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Mastery progress */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Độ thành thạo</span>
                            <Badge variant="secondary">{masteredPercentage}%</Badge>
                        </div>
                        <Progress
                            value={masteredPercentage}
                            className="h-2"
                        />
                    </div>

                    {/* Known progress */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Đã biết</span>
                            <Badge variant="secondary">{knownPercentage}%</Badge>
                        </div>
                        <Progress
                            value={knownPercentage}
                            className="h-2"
                        />
                    </div>

                    {/* Average score */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Điểm trung bình</span>
                            <Badge
                                variant="secondary"
                                className={cn(getProgressColor(stats.average_score))}
                            >
                                {stats.average_score}/100
                            </Badge>
                        </div>
                        <Progress
                            value={stats.average_score}
                            className="h-2"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Vocabulary status breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Phân loại từ vựng
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-xl font-bold text-blue-600">{stats.new_cards}</div>
                            <p className="text-sm text-blue-600">Mới</p>
                        </div>

                        <div className="text-center p-3 bg-yellow-50 rounded-lg">
                            <div className="text-xl font-bold text-yellow-600">{stats.learning_cards}</div>
                            <p className="text-sm text-yellow-600">Đang học</p>
                        </div>

                        <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-xl font-bold text-green-600">{stats.known_cards}</div>
                            <p className="text-sm text-green-600">Đã biết</p>
                        </div>

                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <div className="text-xl font-bold text-purple-600">{stats.mastered_cards}</div>
                            <p className="text-sm text-purple-600">Thành thạo</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Achievement section */}
            {(stats.study_streak >= 7 || stats.average_score >= 80 || masteredPercentage >= 50) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            Thành tích
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {stats.study_streak >= 7 && (
                                <Badge className="bg-orange-100 text-orange-800">
                                    🔥 Streak {stats.study_streak} ngày
                                </Badge>
                            )}
                            {stats.average_score >= 80 && (
                                <Badge className="bg-green-100 text-green-800">
                                    ⭐ Điểm cao
                                </Badge>
                            )}
                            {masteredPercentage >= 50 && (
                                <Badge className="bg-purple-100 text-purple-800">
                                    🎓 Thành thạo 50%+
                                </Badge>
                            )}
                            {stats.study_time_today >= 1800 && ( // 30 minutes
                                <Badge className="bg-blue-100 text-blue-800">
                                    ⏰ Chăm chỉ hôm nay
                                </Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
