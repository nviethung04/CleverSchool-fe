import axiosInstance from "./axios";

// Interface cho bài kiểm tra
export interface Exam {
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

// Interface cho response của API
interface ExamsResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    exams: Exam[];
    total: number;
  };
  error: string;
}

interface SingleExamResponse {
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
    deadline: string;
    is_assigned?: boolean;
  };
  error: string;
}

// Interface cho tham số lọc
export interface ExamFilters {
  lesson_id?: string | number;
  status?: number;
  keyword?: string;
  page?: number;
  limit?: number;
}

// Interface cho dữ liệu tạo bài kiểm tra mới
export interface CreateExamData {
  name: string;
  description: string;
  status: number;
  time_limit: number;
  max_score: number;
  cover_image?: string;
  lesson_id: string | number;
}

// Interface cho dữ liệu cập nhật bài kiểm tra
export interface UpdateExamData extends Partial<CreateExamData> {
  is_assigned?: boolean;
}

// Interface cho dữ liệu liên kết câu hỏi
export interface QuestionRelationData {
  exam_id: number | null;
  homework_id: number | null;
  exercise_id: number | null;
  lesson_plan_part_id: number | null;
  question_scores: Record<string, number>;
}

// Interface cho request body của save score bulk
export interface SaveScoreBulkRequest {
  exam_id: number;
  time: number;
  list_answers: Array<{
    type_question: string;
    question_id: number;
    data: any; // Tùy từng dạng sẽ có cấu trúc khác nhau
  }>;
}

// Interface cho response của save score bulk
export interface SaveScoreBulkResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    exam_name: string;
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

/**
 * Lấy danh sách bài kiểm tra với bộ lọc
 */
export async function GetExamList(
  filters: ExamFilters = {}
): Promise<{ exams: Exam[]; totalPages: number; page: number; total: number }> {
  try {
    console.log("Fetching exams with filters:", filters);

    const response = await axiosInstance.get("/manage/exams", {
      params: filters,
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });

    const data = response.data as ExamsResponse;

    if (data.code === 200 && data.data) {
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const totalPages = Math.ceil(data.data.total / limit);

      return {
        exams: data.data.exams,
        totalPages,
        page,
        total: data.data.total,
      };
    } else {
      throw new Error(data.message || data.error || "Failed to fetch exams");
    }
  } catch (error: any) {
    console.error("Error fetching exams:", error);

    // Log chi tiết lỗi
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

/**
 * Lấy chi tiết một bài kiểm tra
 */
export async function GetExamDetail(id: string | number): Promise<Exam> {
  try {
    console.log("Fetching exam detail for ID:", id);

    const response = await axiosInstance.get(`/manage/exams/${id}`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });
    const data = response.data as SingleExamResponse;

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
        deadline: data.data.deadline,
        is_assigned: data.data.is_assigned,
      };
    } else {
      throw new Error(data.message || data.error || "Failed to fetch exam");
    }
  } catch (error: any) {
    console.error(`Error fetching exam with ID ${id}:`, error);

    // Log chi tiết lỗi
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

/**
 * Tạo bài kiểm tra mới
 */
export async function CreateExam(examData: CreateExamData): Promise<Exam> {
  try {
    console.log("Creating exam with data:", JSON.stringify(examData, null, 2));

    const response = await axiosInstance.post("/manage/exams", examData, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });
    const data = response.data as SingleExamResponse;

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
        deadline: data.data.deadline,
      };
    } else {
      throw new Error(data.message || data.error || "Failed to create exam");
    }
  } catch (error: any) {
    console.error("Error creating exam:", error);

    // Log chi tiết lỗi
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

/**
 * Liên kết câu hỏi với bài kiểm tra, bài tập về nhà hoặc phần bài giảng
 */
export async function CreateQuestionRelation(
  relationData: QuestionRelationData
): Promise<any> {
  try {
    console.log(
      "Creating question relation with data:",
      JSON.stringify(relationData, null, 2)
    );

    const response = await axiosInstance.post(
      "/manage/question-relation",
      relationData,
      {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      }
    );

    if (response.data.code === 200) {
      return response.data;
    } else {
      throw new Error(
        response.data.message ||
          response.data.error ||
          "Failed to create question relation"
      );
    }
  } catch (error: any) {
    console.error("Error creating question relation:", error);

    // Log chi tiết lỗi
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

/**
 * Cập nhật bài kiểm tra
 */
export async function UpdateExam(
  id: string | number,
  examData: UpdateExamData
): Promise<Exam> {
  try {
    console.log("Updating exam with ID:", id);
    console.log("Updated data:", JSON.stringify(examData, null, 2));

    const response = await axiosInstance.put(`/manage/exams/${id}`, examData, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });
    const data = response.data as SingleExamResponse;

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
        deadline: data.data.deadline,
      };
    } else {
      throw new Error(data.message || data.error || "Failed to update exam");
    }
  } catch (error: any) {
    console.error(`Error updating exam with ID ${id}:`, error);

    // Log chi tiết lỗi
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

/**
 * Xóa bài kiểm tra
 */
export async function DeleteExam(id: string | number): Promise<boolean> {
  try {
    console.log("Deleting exam with ID:", id);

    const response = await axiosInstance.delete(`/manage/exams/${id}`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });
    const data = response.data;

    if (data.code === 200) {
      return true;
    } else {
      throw new Error(data.message || data.error || "Failed to delete exam");
    }
  } catch (error: any) {
    console.error(`Error deleting exam with ID ${id}:`, error);

    // Log chi tiết lỗi
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

// API lưu điểm cho bài kiểm tra (bulk)
export async function saveScoreExamBulk(
  requestData: SaveScoreBulkRequest
): Promise<SaveScoreBulkResponse> {
  try {
    console.log(
      "Saving score for exam (bulk):",
      JSON.stringify(requestData, null, 2)
    );
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

//API giao bài kiểm tra
export async function AssignExam(
  id: string | number,
  lessonId: number,
  requestBody: { is_assigned: boolean; course_id?: number }
): Promise<{ lesson_id: string; is_assigned: boolean }> {
  try {
    console.log("Assigning exam with ID:", id, "with data:", requestBody);

    const response = await axiosInstance.post(
      `/manage/exams/${id}/assigned`,
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
        response.data.message || response.data.error || "Failed to assign exam"
      );
    }
  } catch (error: any) {
    console.error(`Error assigning exam with ID ${id}:`, error);
    throw error;
  }
}
