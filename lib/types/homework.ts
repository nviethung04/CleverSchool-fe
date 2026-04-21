export interface HomeworkQuestion {
  id: string
  type: "multiple-choice" | "fill-in-blank" | "ordering" | "matching" | "drag-drop" | "writing" | "speaking"
  text: string
  points: number
  timeLimit?: number
  hint?: string
  explanation?: string

  // Multiple choice specific
  options?: Array<{
    id: string
    text: string
    isCorrect: boolean
  }>
  allowMultiple?: boolean

  // Fill in blank specific
  blanks?: Array<{
    id: string
    answer: string
    position: number
  }>

  // Ordering specific
  items?: Array<{
    id: string
    text: string
    position: number
  }>

  // Matching specific
  pairs?: Array<{
    leftId: string
    leftText: string
    rightId: string
    rightText: string
  }>

  // Drag and drop specific
  dragItems?: Array<{
    id: string
    text: string
    correctBlankId: string
  }>

  // Media
  image?: string
  audio?: string
  video?: string
}

export interface HomeworkSubmission {
  id: string
  homeworkId: string
  studentId: string
  answers: Record<string, any>
  score: number
  totalPoints: number
  timeSpent: number
  submittedAt: Date
  status: "in-progress" | "submitted" | "graded"
}

export interface Homework {
  id: string
  title: string
  description: string
  questions: HomeworkQuestion[]
  totalPoints: number
  timeLimit?: number
  dueDate: Date
  createdAt: Date
  createdBy: string
  status: "draft" | "published" | "archived"
}
