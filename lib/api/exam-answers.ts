import axiosInstance from "./axios";

export interface ExamAnswerGroup {
  answer_id: string;
  group_id: string;
  answer_content: string;
  group_content: string;
  answer_file_url: string;
  answer_file_kind: string;
  group_file_url: string;
  group_file_kind: string;
  is_correct: boolean;
  score: number;
}

export interface ExamAnswerPosition {
  sort_position: number;
  answer_id: string;
  answer_content: string;
  answer_file_url: string;
  answer_file_kind: string;
  true_answer_id: string;
  true_answer_content: string;
  true_answer_file_url: string;
  true_answer_file_kind: string;
  is_correct: boolean;
  score: number;
}

export interface ExamAnswerMultipleChoice {
  all_answer_ids: string[];
  all_answer_contents: string[];
  all_answer_file_urls: string[];
  all_answer_kinds: string[];
  answer_ids: string[];
  answers: string[];
  answer_file_urls: string[];
  answer_kinds: string[];
  true_answer_ids: string[];
  true_answers: string[];
  true_answer_file_urls: string[];
  true_answer_kinds: string[];
  is_all_correct: boolean;
  score: number;
}

export interface ExamAnswerFillInBlank {
  sort_position: number;
  answer: string;
  true_answer: string;
  is_correct: boolean;
  score: number;
}

export interface ExamAnswerLabeling {
  answers: {
    blank_id: string;
    true_blank_content: string;
    true_blank_file_url: string;
    true_blank_kind: string;
    blank_position_x: number;
    blank_position_y: number;
    blank_position_width: number;
    blank_position_height: number;
    answer_id: string;
    answer_content: string;
    answer_file_url: string;
    answer_kind: string;
    is_correct: boolean;
    score: number;
  }[];
  is_all_correct: boolean;
}

export interface ExamAnswerMatching {
  matches: {
    first_item_id: string;
    first_item_content: string;
    first_item_file_url: string;
    first_item_kind: string;
    second_item_id: string;
    second_item_content: string;
    second_item_file_url: string;
    second_item_kind: string;
    is_correct: boolean;
    score: number;
  }[];
  is_all_correct: boolean;
}

export interface ExamAnswerManual {
  answer: string;
  answer_file_url: string;
  answer_text: string;
  score: number;
  is_scored: boolean;
}

export interface ExamQuestion {
  id: string;
  content: string;
  type:
    | "category"
    | "writing"
    | "speaking"
    | "ordering"
    | "multiple_choice"
    | "fill_in_blanks"
    | "matching"
    | "drag_drop"
    | "labeling";
  file_url: string;
  question_kind: string;
  answer_group?: {
    groups: ExamAnswerGroup[];
    is_all_correct: boolean;
  };
  answer_position?: {
    answers: ExamAnswerPosition[];
    is_all_correct: boolean;
  };
  answer_multiple_choice?: ExamAnswerMultipleChoice;
  answer_fill_in_blank?: {
    answers: ExamAnswerFillInBlank[];
    is_all_correct: boolean;
  };
  answer_labeling?: ExamAnswerLabeling;
  answer_matching?: ExamAnswerMatching;
  answer_manual?: ExamAnswerManual;
}

export interface ExamOverview {
  student_name: string;
  duration: string;
  total_score: number;
  ratio: number;
  submitted_at: string;
  has_manual_scoring: boolean;
  total_questions: number;
  unscored_questions: number;
  comment: string;
}

export interface ExamAnswersResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    questions: ExamQuestion[];
    overview: ExamOverview;
  };
  error: string;
}

export interface ExamAnswersParams {
  exam_id: number;
  user_id: number;
}

export interface StudentExamAnswersParams {
  exam_id: number;
}

// Interface lưu điểm cho 2 dạng Speaking và Writing
export interface ManualScoringRequest {
  exam_id?: number;
  homework_id?: number;
  user_id: number;
  score_list: Record<string, number>;
}

export interface ManualScoringResponse {
  code: number;
  data: {
    exam_id: number;
    user_id: number;
  };
  message: string;
}

/**
 * Giáo viên Lấy danh sách câu trả lời của học sinh cho bài kiểm tra
 * API endpoint: GET /study/exam-answers
 */
export const getExamAnswersByTeacher = async (
  params: ExamAnswersParams
): Promise<ExamAnswersResponse> => {
  try {
    const response = await axiosInstance.get("/study/teacher/exam-answers", {
      params: {
        exam_id: params.exam_id,
        user_id: params.user_id,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching exam answers:", error);
    throw error;
  }
};

/**
 * Lưu điểm chấm thủ công cho các câu hỏi Writing và Speaking
 * API endpoint: POST /study/save-score/manual-scoring
 */
export const saveManualScoring = async (
  data: ManualScoringRequest
): Promise<ManualScoringResponse> => {
  try {
    const response = await axiosInstance.post(
      "/study/save-score/manual-scoring",
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error saving manual scoring:", error);
    throw error;
  }
};

// Homework comment API
export interface HomeworkCommentRequest {
  homework_id: number;
  student_id: number;
  content: string;
}

export interface HomeworkCommentResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    success: boolean;
    message: string;
  };
  error: string;
}

export const postHomeworkComment = async (
  data: HomeworkCommentRequest
): Promise<HomeworkCommentResponse> => {
  try {
    const response = await axiosInstance.post("/study/homework-comment", data);
    return response.data;
  } catch (error) {
    console.error("Error posting homework comment:", error);
    throw error;
  }
};

/**
 * Học sinh xem lại danh sách câu trả lời cho bài kiểm tra
 * API endpoint: GET /study/exam-answers
 */
export const getExamAnswersByStudent = async (
  params: ExamAnswersParams
): Promise<ExamAnswersResponse> => {
  try {
    const response = await axiosInstance.get("/study/student/exam-answers", {
      params: {
        exam_id: params.exam_id,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching exam answers:", error);
    throw error;
  }
};

export interface ExamInfo {
  name: string;
  description: string;
  is_assigned: boolean;
  status: number;
  max_score: number;
  time_limit: string;
  created_at: string;
  deadline: string;
  total_questions: string;
  total_students: string;
  submitted_students: string;
  graded_students: string;
  avg_score: number;
}

export interface ExamStudent {
  user_id: string;
  name: string;
  avatar: string;
  is_submitted: boolean;
  submitted_at: string;
  duration: string;
  unscored_count: number;
  score: number;
  ratio: number;
}

export interface ExamStudentsResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    exam_info: ExamInfo;
    students: ExamStudent[];
    total_count: string;
  };
  error: string;
}

export interface ExamStudentsParams {
  exam_id: number;
  course_id?: number;
  limit?: number;
  page?: number;
}

// Interface cho UI component
export interface UIExamInfo {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  lessonId: string;
  lessonTitle: string;
  totalQuestions: number;
  maxScore: number;
  timeLimit: number; // in minutes
  startDate: string;
  endDate: string;
  status: "draft" | "published" | "ended";
  createdAt: string;
}

export interface UIStudentSubmission {
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  submissionStatus: "not_started" | "submitted";
  gradingStatus: "not_graded" | "graded";
  submittedAt?: string;
  score?: number;
  timeSpent?: number; // in seconds
  lastAccessed?: string;
  unscoredCount?: number;
  ratio?: number;
}

/**
 * Giáo viên lấy thông tin bài kiểm tra và trạng thái của danh sách học sinh
 * API endpoint: GET /study/exam-students
 */
export const getExamStudents = async (
  params: ExamStudentsParams
): Promise<ExamStudentsResponse> => {
  try {
    const response = await axiosInstance.get("/study/exam-students", {
      params: {
        exam_id: params.exam_id,
        ...(params.course_id !== undefined
          ? { course_id: params.course_id }
          : {}),
        ...(params.limit !== undefined ? { limit: params.limit } : {}),
        ...(params.page !== undefined ? { page: params.page } : {}),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching exam students:", error);
    throw error;
  }
};

export interface HomeworkStudentsParams {
  homework_id: number;
  course_id?: number;
  limit?: number;
  page?: number;
}

export interface HomeworkStudentsResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    homework_info: HomeworkInfo;
    students: HomeworkStudent[];
    total_count: string;
  };
  error: string;
}

export interface HomeworkInfo {
  name: string;
  description: string;
  is_assigned: boolean;
  status: number;
  created_at: string;
  total_questions: string;
  total_students: string;
  cover_image: string;
  question_form?: "question" | "write";
  question_files?: HomeworkFile[];
}

export interface HomeworkStudent {
  user_id: string;
  name: string;
  avatar: string;
  questions_completed: number;
  last_question_id_completed: number;
  updated_at: string;
  is_submitted?: boolean;
}

/**
 * Giáo viên lấy thông tin bài tập về nhà và trạng thái của danh sách học sinh
 * API endpoint: GET /study/homework-students
 */
export const getHomeworkStudents = async (
  params: HomeworkStudentsParams
): Promise<HomeworkStudentsResponse> => {
  try {
    const response = await axiosInstance.get("/study/homework-students", {
      params: {
        homework_id: params.homework_id,
        ...(params.course_id !== undefined
          ? { course_id: params.course_id }
          : {}),
        ...(params.limit !== undefined ? { limit: params.limit } : {}),
        ...(params.page !== undefined ? { page: params.page } : {}),
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching homework students:", error);
    throw error;
  }
};

// Interface cho file (dùng chung cho question_files và submit_files)
export interface HomeworkFile {
  type: string;
  url: string;
}

// Định nghĩa lại HomeworkOverview theo response mới
export interface HomeworkOverview {
  student_name: string;
  homework_name: string;
  homework_description: string;
  homework_status: number;
  homework_cover_image: string;
  total_questions: number;
  questions_completed: string;
  last_question_id_completed: string;
  manual_questions_count: number;
  ratio?: number;
  latest_comment?: string;
  homework_question_form: string;
  question_files?: HomeworkFile[];
}

// Định nghĩa lại ManualAnswer
export interface ManualAnswer {
  id: string;
  type: string;
  source: string;
  status: boolean;
  content: string;
  answer: string;
  file_url: string;
  is_scored?: boolean;
  manual_score?: number;
  content_struct: {
    media: {
      file: string;
      type: string;
      url: string;
    };
    medias: {
      file: string;
      type: string;
      url: string;
    }[];
    text: string;
  };
}

// Định nghĩa lại HomeworkQuestion
export interface HomeworkQuestion {
  attributes: any[];
  content: {
    media: {
      file: string;
      type: string;
      url: string;
    };
    text: string;
  };
  correct_answers: {
    ids: string[];
    list: Record<string, string>;
  } | null;
  created_at: string;
  id: string;
  image_height: number;
  image_width: number;
  metadata: {
    instructions: string;
    is_random: boolean;
    points: number;
    time: number;
  };
  options: {
    answers: any[];
    blanks: any[];
    categories: any[];
    groups: any[];
    items: any[];
    labels: any[];
    questions: any[];
    sources: any[];
    targets: any[];
  } | null;
  sort_position: number;
  source: any;
  source_question_id: string;
  status: boolean;
  type: string;
  updated_at: string;
}

// Định nghĩa lại HomeworkAnswersResponse
export interface HomeworkAnswersResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    overview: HomeworkOverview;
    questions: HomeworkQuestion[];
    manual_answers: ManualAnswer[];
    skipped_question_ids: Array<string | number>;
    is_all_scored?: boolean;
    submit_files?: HomeworkFile[];
    is_submitted?: boolean;
    is_scored?: boolean;
  };
  error: string;
}

export interface HomeworkAnswersParams {
  homework_id: number;
  user_id: number;
}

/**
 * Giáo viên Lấy danh sách câu trả lời của học sinh cho BTVN
 * API endpoint: GET /study/teacher/homework-answers
 */
export const getHomeworkAnswersByTeacher = async (
  params: HomeworkAnswersParams
): Promise<HomeworkAnswersResponse> => {
  try {
    const response = await axiosInstance.get(
      "/study/teacher/homework-answers",
      {
        params: {
          homework_id: params.homework_id,
          user_id: params.user_id,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching homework answers:", error);
    throw error;
  }
};

export interface StudentHomeworkAnswersParams {
  homework_id: number;
  lesson_id?: number;
}
/**
 * Học sinh xem lại danh sách câu trả lời cho BTVN
 * API endpoint: GET /study/student/homework-answers
 */
export const getHomeworkAnswersByStudent = async (
  params: StudentHomeworkAnswersParams
): Promise<HomeworkAnswersResponse> => {
  try {
    const response = await axiosInstance.get(
      "/study/student/homework-answers",
      {
        params: {
          homework_id: params.homework_id,
          ...(params.lesson_id ? { lesson_id: params.lesson_id } : {}),
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching homework answers:", error);
    throw error;
  }
};

/**
 * Gửi nhận xét giáo viên cho học sinh về bài kiểm tra
 * API endpoint: POST /study/exam-comment
 */
export interface ExamCommentRequest {
  exam_id: number;
  student_id: number;
  content: string;
}

export interface ExamCommentResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    success: boolean;
    message: string;
  };
  error: string;
}

export const postExamComment = async (
  data: ExamCommentRequest
): Promise<ExamCommentResponse> => {
  try {
    const response = await axiosInstance.post("/study/exam-comment", data);
    return response.data;
  } catch (error) {
    console.error("Error posting exam comment:", error);
    throw error;
  }
};

/**
 * Chấm điểm cho bài tập dạng write (file upload)
 * API endpoint: POST /study/save-score/evaluate
 */
export interface EvaluateScoreRequest {
  exam_id?: number;
  homework_id?: number;
  exercise_id?: number;
  contest_round_id?: number;
  user_id: number;
  score: number;
}

export interface EvaluateScoreResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    success: boolean;
    message: string;
  };
  error: string;
}

export const postEvaluateScore = async (
  data: EvaluateScoreRequest
): Promise<EvaluateScoreResponse> => {
  try {
    const response = await axiosInstance.post(
      "/study/save-score/evaluate",
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error posting evaluate score:", error);
    throw error;
  }
};
