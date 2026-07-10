import axiosInstance from "./axios";

export interface Exercise {
  id: string | number;
  name: string;
  description: string;
  status: number;
  time_limit: string | number;
  max_score: number;
  cover_image: string;
  lesson_id: string | number;
  created_at: string;
  created_by: string | number;
  updated_at: string;
  updated_by: string | number;
  deadline: string;
  is_assigned?: boolean;
}

interface SingleExerciseResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    id: string | number;
    name: string;
    lesson_id: string | number;
    status: number;
    time_limit: string | number;
    max_score: number;
    description: string;
    cover_image: string;
    created_at: string;
    created_by: string | number;
    updated_at: string;
    updated_by: string | number;
    deadline?: string;
    is_assigned?: boolean;
    total_questions: number;
  };
  error: string;
}

// Interface cho dữ liệu tạo bài tập mới
export interface CreateExerciseData {
  name: string;
  description: string;
  status: number;
  max_score: number;
  cover_image?: string;
  lesson_id: string | number;
}

export interface UpdateExerciseData extends Partial<CreateExerciseData> {
  is_assigned?: boolean;
}

export type CreateExerciseBody = {
  name: string;
  lesson_id: number;
  status: number;
  // time_limit: number;
  max_score: number;
  description: string;
  // cover_image: string;
};

export interface SaveScoreBulkRequest {
  exercise_id: number;
  lesson_id?: number;
  time: number;
  list_answers: Array<{
    type_question: string;
    question_id: number;
    data: any; // Tùy từng dạng sẽ có cấu trúc khác nhau
  }>;
}

export interface SaveScoreBulkResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    exercise_name: string;
    total_score: number;
    ratio: number;
    time: string;
    multiple_choice?: Array<{
      id: string;
      question_id: string;
      answer_ids: string[];
      true_answer_ids: string[];
      answers: string[];
      true_answers: string[];
      is_correct: boolean;
      score: number;
    }>;
    fill_in_blank?: Array<{
      question_id: string;
      total_score: number;
      answers: Array<{
        sort_position: number;
        answer: string;
        true_answer: string;
        is_correct: boolean;
        score: number;
      }>;
      is_all_correct: boolean;
    }>;
    ordering?: Array<{
      question_id: string;
      total_score: number;
      answers: Array<{
        sort_position: number;
        answer_id: string;
        true_answer_id: string;
        true_answer_content: string;
        is_correct: boolean;
        score: number;
      }>;
      is_all_correct: boolean;
    }>;
    dragdrop?: Array<{
      question_id: string;
      total_score: number;
      answers: Array<{
        sort_position: number;
        answer_id: string;
        true_answer_id: string;
        true_answer_content: string;
        is_correct: boolean;
        score: number;
      }>;
      is_all_correct: boolean;
    }>;
    matching?: Array<{
      question_id: string;
      total_score: number;
      matches: Array<{
        first_item_id: string;
        second_item_id: string;
        first_item_content: string;
        second_item_content: string;
        is_correct: boolean;
        score: number;
      }>;
      is_all_correct: boolean;
    }>;
    labeling?: Array<{
      question_id: string;
      total_score: number;
      labels: Array<{
        blank_id: string;
        answer_id: string;
        blank_content: string;
        answer_content: string;
        is_correct: boolean;
        score: number;
      }>;
      is_all_correct: boolean;
    }>;
    category?: Array<{
      question_id: string;
      total_score: number;
      groups: Array<{
        answer_id: string;
        group_id: string;
        answer_content: string;
        group_content: string;
        is_correct: boolean;
        score: number;
      }>;
      is_all_correct: boolean;
    }>;
  };
  error: string;
}

export interface ExerciseStudentsParams {
  exercise_id: number;
  course_id?: number;
  limit?: number;
  page?: number;
}

export interface ExerciseInfo {
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

export interface ExerciseStudent {
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

export interface ExerciseStudentsResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    /** BE dùng chung proto ExamStudentResponseWithCount — field JSON là exam_info */
    exam_info?: ExerciseInfo;
    exercise_info?: ExerciseInfo;
    students?: ExerciseStudent[];
    total_count: string;
  };
  error: string;
}

export interface UIExerciseInfo {
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

export interface ExerciseAnswersResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    questions: ExerciseQuestion[];
    overview: ExerciseOverview;
  };
  error: string;
}

export interface ExerciseAnswersParams {
  exercise_id: number;
  user_id: number;
}

export interface ExerciseQuestion {
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
    groups: ExerciseAnswerGroup[];
    is_all_correct: boolean;
  };
  answer_position?: {
    answers: ExerciseAnswerPosition[];
    is_all_correct: boolean;
  };
  answer_multiple_choice?: ExerciseAnswerMultipleChoice;
  answer_fill_in_blank?: {
    answers: ExerciseAnswerFillInBlank[];
    is_all_correct: boolean;
  };
  answer_labeling?: ExerciseAnswerLabeling;
  answer_matching?: ExerciseAnswerMatching;
  answer_manual?: ExerciseAnswerManual;
}

export interface ExerciseAnswerGroup {
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

export interface ExerciseAnswerPosition {
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

export interface ExerciseAnswerMultipleChoice {
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

export interface ExerciseAnswerFillInBlank {
  sort_position: number;
  answer: string;
  true_answer: string;
  is_correct: boolean;
  score: number;
}

export interface ExerciseAnswerLabeling {
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

export interface ExerciseAnswerMatching {
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

export interface ExerciseAnswerManual {
  answer: string;
  answer_file_url: string;
  answer_text: string;
  score: number;
  is_scored: boolean;
}

export interface ExerciseOverview {
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

export interface ExerciseCommentRequest {
  exercise_id: number;
  student_id: number;
  content: string;
}

export interface ExerciseCommentResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    success: boolean;
    message: string;
  };
  error: string;
}

export interface ManualScoringRequest {
  exercise_id: number;
  user_id: number;
  score_list: Record<string, number>;
}

export interface ManualScoringResponse {
  code: number;
  data: {
    exercise_id: number;
    user_id: number;
  };
  message: string;
}

export async function getExercisesList(params?: {
  page?: number;
  limit?: number;
  keyword?: string;
}): Promise<{
  exercises: Exercise[];
  totalPages: number;
  page: number;
  total: number;
}> {
  try {
    const response = await axiosInstance.get("/manage/exercises", { params });
    const data = response.data;

    if (data.code === 200 && data.data) {
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const total = data.data.total || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        exercises: data.data.exercises || [],
        totalPages,
        page,
        total,
      };
    } else {
      throw new Error(
        data.message || data.error || "Failed to fetch exercises"
      );
    }
  } catch (error: any) {
    console.error("Error fetching exercises list:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }
    throw error;
  }
}

export async function getExerciseDetail(
  id: string | number,
  options?: { forStudent?: boolean; courseId?: string | number }
): Promise<Exercise> {
  try {
    console.log("Fetching exercise detail for ID:", id);

    const path = options?.forStudent
      ? `/study/student/exercises/${id}`
      : `/manage/exercises/${id}`;

    const response = await axiosInstance.get(path, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
      params:
        options?.forStudent && options.courseId != null
          ? { course_id: options.courseId }
          : undefined,
    });
    const data = response.data as SingleExerciseResponse;

    if (data.code === 200 && data.data) {
      return {
        id: data.data.id,
        name: data.data.name,
        description: data.data.description,
        status: data.data.status,
        time_limit: data.data.time_limit,
        max_score: data.data.max_score,
        cover_image: data.data.cover_image,
        lesson_id: data.data.lesson_id,
        created_at: data.data.created_at,
        created_by: data.data.created_by,
        updated_at: data.data.updated_at,
        updated_by: data.data.updated_by,
        deadline: data.data.deadline || "",
        is_assigned: data.data.is_assigned,
      };
    } else {
      throw new Error(data.message || data.error || "Failed to fetch exercise");
    }
  } catch (error: any) {
    console.error(`Error fetching exercise with ID ${id}:`, error);

    // Log chi tiết lỗi
    if (error.response) {
      console.error("Response data:", error.response.data);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }

    throw error;
  }
}

export async function createExercise(
  exerciseData: CreateExerciseData
): Promise<Exercise> {
  try {
    const response = await axiosInstance.post(
      "/manage/exercises",
      exerciseData,
      {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      }
    );
    const data = response.data as SingleExerciseResponse;

    if (data.code === 200 && data.data) {
      return {
        id: data.data.id,
        name: data.data.name,
        description: data.data.description,
        status: data.data.status,
        time_limit: data.data.time_limit || 0,
        max_score: data.data.max_score,
        cover_image: data.data.cover_image,
        lesson_id: data.data.lesson_id,
        created_at: data.data.created_at,
        created_by: data.data.created_by,
        updated_at: data.data.updated_at,
        updated_by: data.data.updated_by,
        deadline: data.data.deadline || "",
      };
    } else {
      throw new Error(
        data.message || data.error || "Failed to create exercise"
      );
    }
  } catch (error: any) {
    console.error("Error creating exercise:", error);

    // Log chi tiết lỗi
    if (error.response) {
      console.error("Response data:", error.response.data);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }

    throw error;
  }
}

//Xóa bài tập
export async function DeleteExercise(id: string | number): Promise<boolean> {
  try {
    const response = await axiosInstance.delete(`/manage/exercises/${id}`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });
    const data = response.data;

    if (data.code === 200) {
      return true;
    } else {
      throw new Error(
        data.message || data.error || "Failed to delete exercise"
      );
    }
  } catch (error: any) {
    console.error(`Error deleting exercise with ID ${id}:`, error);

    if (error.response) {
      console.error("Response data:", error.response.data);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }

    throw error;
  }
}

//Cập nhật bài tập
export async function UpdateExercise(
  id: string | number,
  exerciseData: UpdateExerciseData
): Promise<Exercise> {
  try {
    const response = await axiosInstance.put(
      `/manage/exercises/${id}`,
      exerciseData,
      {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      }
    );
    const data = response.data as SingleExerciseResponse;

    if (data.code === 200 && data.data) {
      return {
        id: data.data.id,
        name: data.data.name,
        description: data.data.description,
        status: data.data.status,
        time_limit: data.data.time_limit || 0,
        max_score: data.data.max_score,
        cover_image: data.data.cover_image,
        lesson_id: data.data.lesson_id,
        created_at: data.data.created_at,
        created_by: data.data.created_by,
        updated_at: data.data.updated_at,
        updated_by: data.data.updated_by,
        deadline: data.data.deadline || "",
      };
    } else {
      throw new Error(
        data.message || data.error || "Failed to update exercise"
      );
    }
  } catch (error: any) {
    console.error(`Error updating exercise with ID ${id}:`, error);

    if (error.response) {
      console.error("Response data:", error.response.data);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }

    throw error;
  }
}

// API lưu điểm cho bài tập
export async function saveScoreExerciseBulk(
  requestData: SaveScoreBulkRequest
): Promise<SaveScoreBulkResponse> {
  try {
    const response = await axiosInstance.post(
      "/study/save-score/bulk",
      requestData,
      {
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
        },
      }
    );
    const data = response.data as SaveScoreBulkResponse;
    if (data.code === 200) {
      return data;
    } else {
      throw new Error(
        data.message || data.error || "Failed to save score (bulk)"
      );
    }
  } catch (error: any) {
    console.error("Error saving score (bulk):", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }
    throw error;
  }
}

/**
 * Giáo viên lấy thông tin bài tập và trạng thái của danh sách học sinh
 * API endpoint: GET /study/exercise-students
 */
export const getExerciseStudents = async (
  params: ExerciseStudentsParams
): Promise<ExerciseStudentsResponse> => {
  try {
    const response = await axiosInstance.get("/study/exercise-students", {
      params: {
        exercise_id: params.exercise_id,
        ...(params.course_id !== undefined
          ? { course_id: params.course_id }
          : {}),
        ...(params.limit !== undefined ? { limit: params.limit } : {}),
        ...(params.page !== undefined ? { page: params.page } : {}),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching exercise students:", error);
    throw error;
  }
};

export interface ResetExerciseAttemptParams {
  exercise_id: number;
  user_id: number;
  lesson_id?: number;
}

export async function resetExerciseAttempt(
  params: ResetExerciseAttemptParams
): Promise<{ code: number; message: string }> {
  const response = await axiosInstance.post("/study/exercise-reset", {
    exercise_id: params.exercise_id,
    user_id: params.user_id,
    ...(params.lesson_id != null ? { lesson_id: params.lesson_id } : {}),
  });
  const data = response.data as { code: number; message: string; error?: string };
  if (data.code === 200) {
    return data;
  }
  throw new Error(data.message || data.error || "Failed to reset exercise attempt");
}

/**
 * Giáo viên Lấy danh sách câu trả lời của học sinh cho bài tập
 * API endpoint: GET /study/exercise-answers
 */
export const getExerciseAnswersByTeacher = async (
  params: ExerciseAnswersParams
): Promise<ExerciseAnswersResponse> => {
  try {
    const response = await axiosInstance.get(
      "/study/teacher/exercise-answers",
      {
        params: {
          exercise_id: params.exercise_id,
          user_id: params.user_id,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching exercise answers:", error);
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

export const postExerciseComment = async (
  data: ExerciseCommentRequest
): Promise<ExerciseCommentResponse> => {
  try {
    const response = await axiosInstance.post("/study/exercise-comment", data);
    return response.data;
  } catch (error) {
    console.error("Error posting exercise comment:", error);
    throw error;
  }
};

/**
 * Học sinh xem lại danh sách câu trả lời cho bài tập
 * API endpoint: GET /study/exercise-answers
 */
export const getExerciseAnswersByStudent = async (
  params: ExerciseAnswersParams
): Promise<ExerciseAnswersResponse> => {
  try {
    const response = await axiosInstance.get(
      "/study/student/exercise-answers",
      {
        params: {
          exercise_id: params.exercise_id,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching exercise answers:", error);
    throw error;
  }
};

//API giao bài tập
export async function AssignExercise(
  id: string | number,
  lessonId: number,
  requestBody: { is_assigned: boolean; course_id?: number }
): Promise<{ lesson_id: string; is_assigned: boolean }> {
  try {
    console.log("Assigning exercise with ID:", id, "with data:", requestBody);

    const response = await axiosInstance.post(
      `/manage/exercises/${id}/assigned`,
      {
        ...requestBody,
        lesson_id: lessonId,
      },
      {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      }
    );

    if (response.data.code === 200) {
      return {
        lesson_id: response.data.data.lesson_id,
        is_assigned: response.data.data.is_assigned,
      };
    } else {
      throw new Error(
        response.data.message ||
          response.data.error ||
          "Failed to assign exercise"
      );
    }
  } catch (error: any) {
    console.error(`Error assigning exercise with ID ${id}:`, error);
    throw error;
  }
}
