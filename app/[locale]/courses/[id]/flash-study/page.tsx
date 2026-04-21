'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, BookOpen, Mic, BarChart3 } from 'lucide-react'

// Import flashcard components
import {
    Flashcard,
    FlashcardControls,
    PronunciationCard,
    FlashcardStatsComponent
} from '@/components/flashcard'
import { SessionCompleteDialog } from '@/components/flashcard/session-complete-dialog'
import { ResumeSessionDialog } from '@/components/flashcard/resume-session-dialog'

// Import hooks
import {
    useFlashcard,
    useFlashcardStats
} from '@/hooks/flashcard'

export default function FlashcardStudyPage() {
    const params = useParams()
    const router = useRouter()

    const courseId = params.id as string
    const locale = params.locale as string

    const [activeTab, setActiveTab] = useState<'learning' | 'pronunciation' | 'stats'>('learning')

    // Mock student ID - in real app this would come from auth context
    const studentId = 123 // Changed to number
    const lessonId = Number(courseId) // This should be lessonId, not courseId

    // Initialize hooks
    const flashcardHook = useFlashcard(lessonId, studentId)
    const statsHook = useFlashcardStats(studentId)

    const handleBack = () => {
        router.push(`/${locale}/courses/${courseId}`)
    }

    // Debug logs
    useEffect(() => {
        console.log('🎯 Page Debug State:', {
            loading: flashcardHook.loading,
            vocabulariesCount: flashcardHook.vocabularies?.length || 0,
            currentVocabulary: flashcardHook.currentVocabulary?.word || 'None',
            currentIndex: flashcardHook.currentIndex,
            session: flashcardHook.session?.id || 'No session'
        })
    }, [flashcardHook])

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBack}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Quay về
                    </Button>

                    <div>
                        <h1 className="text-2xl font-bold">
                            Flashcard Study
                        </h1>
                        <p className="text-muted-foreground">
                            Học từ vựng với flashcard - Lesson {lessonId}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs System */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                <TabsList className="grid grid-cols-3 mb-6">
                    <TabsTrigger value="learning" className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Học từ vựng
                    </TabsTrigger>
                    <TabsTrigger value="pronunciation" className="flex items-center gap-2">
                        <Mic className="h-4 w-4" />
                        Luyện phát âm
                    </TabsTrigger>
                    <TabsTrigger value="stats" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Thống kê
                    </TabsTrigger>
                </TabsList>

                {/* Learning Tab */}
                <TabsContent value="learning" className="space-y-4">
                    {flashcardHook.loading ? (
                        <Card>
                            <CardContent className="p-8">
                                <div className="text-center">Đang tải flashcards...</div>
                            </CardContent>
                        </Card>
                    ) : flashcardHook.currentVocabulary ? (
                        <div className="space-y-4">
                            <Flashcard
                                vocabulary={flashcardHook.currentVocabulary}
                                progress={flashcardHook.currentProgress}
                                isFlipped={flashcardHook.isFlipped}
                                onFlip={flashcardHook.flipCard}
                                sessionActive={flashcardHook.session !== null}
                            />
                            <FlashcardControls
                                currentIndex={flashcardHook.currentIndex}
                                totalCards={flashcardHook.totalCards}
                                progress={flashcardHook.progress}
                                isFlipped={flashcardHook.isFlipped}
                                canMarkCard={flashcardHook.session !== null}
                                hasNext={flashcardHook.hasNext}
                                hasPrev={flashcardHook.hasPrev}
                                onNext={flashcardHook.nextCard}
                                onPrev={flashcardHook.prevCard}
                                onFlip={flashcardHook.flipCard}
                                // Add marking state props
                                markingState={flashcardHook.markingState}
                                currentVocabularyId={flashcardHook.vocabularies[flashcardHook.currentIndex]?.vocabulary_id || flashcardHook.currentVocabulary?.id}
                                vocabularyChoices={flashcardHook.vocabularyChoices}
                                onMarkKnown={() => {
                                    const vocabId = flashcardHook.vocabularies[flashcardHook.currentIndex]?.vocabulary_id
                                        || flashcardHook.currentVocabulary?.id
                                        || 0
                                    console.log('🎯 Mark Known clicked:', { vocabId, currentIndex: flashcardHook.currentIndex })
                                    flashcardHook.markCard(vocabId, true)
                                }}
                                onMarkUnknown={() => {
                                    const vocabId = flashcardHook.vocabularies[flashcardHook.currentIndex]?.vocabulary_id
                                        || flashcardHook.currentVocabulary?.id
                                        || 0
                                    console.log('🎯 Mark Unknown clicked:', { vocabId, currentIndex: flashcardHook.currentIndex })
                                    flashcardHook.markCard(vocabId, false)
                                }}
                                sessionActive={flashcardHook.session !== null}
                                onStartSession={() => {
                                    console.log('🎯 Start Session button clicked!')
                                    flashcardHook.startSession()
                                }}
                                onCompleteSession={() => {
                                    console.log('🏁 Complete Session button clicked!')
                                    flashcardHook.completeSession()
                                }}
                            />
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="p-8">
                                <div className="text-center space-y-4">
                                    <div className="text-muted-foreground">
                                        <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p className="text-lg">Không có flashcard nào để học.</p>
                                    </div>
                                    <Button onClick={() => {
                                        console.log('🎯 Button clicked - Starting session...')
                                        flashcardHook.startSession()
                                    }}>
                                        Bắt đầu học flashcard
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Pronunciation Tab */}
                <TabsContent value="pronunciation">
                    {flashcardHook.currentVocabulary ? (
                        <PronunciationCard
                            vocabulary={flashcardHook.currentVocabulary}
                            studentId={studentId}
                            onScoreReceived={(score) => console.log('Score:', score)}
                        />
                    ) : (
                        <Card>
                            <CardContent className="p-8">
                                <div className="text-center">Không có từ vựng để luyện phát âm.</div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Stats Tab */}
                <TabsContent value="stats">
                    {statsHook.stats ? (
                        <FlashcardStatsComponent stats={statsHook.stats} />
                    ) : (
                        <Card>
                            <CardContent className="p-8">
                                <div className="text-center">
                                    {statsHook.loading ? 'Đang tải thống kê...' : 'Không có dữ liệu thống kê.'}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>

            {/* Resume Session Dialog */}
            <ResumeSessionDialog
                open={flashcardHook.showResumeDialog}
                onContinue={() => flashcardHook.handleResumeSession(true)}
                onRestart={() => flashcardHook.handleResumeSession(false)}
                sessionData={flashcardHook.pendingSessionData}
            />

            {/* Session Complete Dialog */}
            {flashcardHook.completionStats && (
                <SessionCompleteDialog
                    open={flashcardHook.showCompletionDialog}
                    onClose={() => flashcardHook.setShowCompletionDialog(false)}
                    onRestartSession={flashcardHook.handleRestartSession}
                    onGoBack={() => {
                        flashcardHook.handleGoBack()
                        handleBack() // Navigate back to course page
                    }}
                    stats={flashcardHook.completionStats}
                />
            )}
        </div>
    )
}
