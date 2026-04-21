// Flashcard Types
export interface Vocabulary {
    id: number
    word: string
    phonetic: string
    translation: string
    definition: string
    part_of_speech: string
    level: 'beginner' | 'intermediate' | 'advanced'
    tags: string
    difficulty: number // 1-5
    frequency: number // 0-100
    example_sentence: string
    example_translation: string
    audio_url?: string
    image_url?: string
    pronunciation_guide?: string
    created_by?: number
    updated_by?: number
    created_at?: string
    updated_at?: string
}

export interface StudentProgress {
    student_id: number
    vocabulary_id: number
    lesson_id: number
    status: 'new' | 'learning' | 'known' | 'mastered'
    is_known: boolean
    study_count: number
    correct_count: number
    pronunciation_score?: number
    best_pronunciation_score?: number
    last_studied_at?: string
    mastered_at?: string
}

export interface FlashcardSession {
    id: number
    student_id: number
    lesson_id: number
    total_cards: number
    completed_cards: number
    known_cards: number
    study_duration: number // seconds
    session_score: number // 0-100
    started_at?: string
    completed_at?: string
    created_at?: string
    is_completed: boolean
    progress_percentage?: number
}

export interface FlashcardActivity {
    session_id: number
    vocabulary_id: number
    activity_type: 'view' | 'flip' | 'mark_known' | 'mark_unknown' | 'pronunciation'
    response?: string
    response_time: number // milliseconds
    pronunciation_score?: number
    created_at?: string
}

export interface LessonVocabulary {
    lesson_id: number
    vocabulary_id: number
    sort_order: number
    is_required: boolean
    vocabulary: Vocabulary
    progress?: StudentProgress
}

export interface FlashcardStats {
    total_vocabularies: number
    new_cards: number
    learning_cards: number
    known_cards: number
    mastered_cards: number
    average_score: number
    study_time_today: number
    study_streak: number
}

export interface PronunciationAssessment {
    vocabulary_id: number
    student_id: number
    audio_data: Blob
    score?: number
    feedback?: string
}

// API Response types
export interface FlashcardResponse<T> {
    success: boolean
    data: T
    message?: string
    pagination?: {
        page: number
        limit: number
        total: number
        total_pages: number
    }
}
