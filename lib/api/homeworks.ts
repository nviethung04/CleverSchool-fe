import { StringNullableChain } from "lodash";
import axiosInstance from "./axios";
import type { QuestionType } from "./questions";

// Interface cho bài tập về nhà
export interface Homework {
  id: string | number;
  name: string;
  description: string;
  status: number;
  max_score: number;
  cover_image: string;
  lesson_id: string | number;
  created_at: string;
  created_by: string | number;
  updated_at: string;
  updated_by: string | number;
  is_assigned?: boolean;
  total_questions?: number;
  question_completed?: number;
  last_question_id_completed?: number;
  questions?: QuestionType[];
  question_form: string;
  question_files?: {
    type: string;
    url: string;
  }[];
}

// Interface cho response của API
interface HomeworksResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    homeworks: Homework[];
    total: number | string;
  };
  error: string;
}

interface SingleHomeworkResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    id: string | number;
    name: string;
    lesson_id: string | number;
    status: number;
    max_score: number;
    description: string;
    cover_image: string;
    created_at: string;
    created_by: string | number;
    updated_at: string;
    updated_by: string | number;
    is_assigned?: boolean;
    total_questions: number;
    question_completed: number;
    last_question_id_completed: number;
    question_form?: string;
    question_files?: {
      type: string;
      url: string;
    }[];
  };
  error: string;
}

// Interface cho tham số lọc
export interface HomeworkFilters {
  lesson_id?: string | number;
  status?: number;
  keyword?: string;
  page?: number;
  limit?: number;
}

// Interface cho dữ liệu tạo bài tập về nhà mới
export interface CreateHomeworkData {
  name: string;
  description: string;
  status: number;
  max_score: number;
  cover_image?: string;
  lesson_id: string | number;
  question_form?: string;
  question_files?: {
    type: string;
    url: string;
  }[];
}

// Interface cho dữ liệu cập nhật bài tập về nhà
export interface UpdateHomeworkData extends Partial<CreateHomeworkData> {
  is_assigned?: boolean;
}

// Interface cho request body của save score
export interface SaveScoreRequest {
  homework_id: number;
  lesson_id: number;
  question_id: number;
  answer_id: number;
}

// Interface cho response của save score
export interface SaveScoreResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    id: string;
    question_id: string;
    answer_id: string;
    true_answer_id: string;
    answer: string;
    true_answer: string;
    is_correct: boolean;
    score: number;
  };
  error: string;
}

// Interface for saveScoreMultipleChoice request
export interface SaveScoreMultipleChoiceRequest {
  homework_id: number;
  lesson_id: number;
  question_id: number | string;
  answer_ids: (number | string)[];
}

// Interface for saveScoreMultipleChoice response
export interface SaveScoreMultipleChoiceResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    id: string;
    question_id: string;
    answer_ids: string[];
    true_answer_ids: string[];
    answers: string[];
    true_answers: string[];
    is_correct: boolean;
    score: number;
  };
  error: string;
}

// Interface for saveScoreFillInBlank request
export interface SaveScoreFillInBlankRequest {
  homework_id: number;
  lesson_id: number;
  question_id: number;
  answers: Record<number, string>;
}

// Interface for saveScoreFillInBlank response
export interface SaveScoreFillInBlankResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    question_id: string;
    score: number;
    answers: Array<{
      sort_position: number;
      answer: string;
      true_answer: string;
      is_correct: boolean;
    }>;
    is_all_correct: boolean;
  };
  error: string;
}

// Interface for saveScoreOrderingDragdrop request
export interface SaveScoreOrderingDragdropRequest {
  homework_id: number;
  lesson_id: number;
  question_id: number;
  answers: Record<number, number>;
}

// Interface for saveScoreOrderingDragdrop response
export interface SaveScoreOrderingDragdropResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
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
  };
  error: string;
}

// Interface for saveScoreMatching request
export interface SaveScoreMatchingRequest {
  homework_id: number;
  lesson_id: number;
  question_id: number;
  answers: Record<number, number>;
}

// Interface for saveScoreMatching response
export interface SaveScoreMatchingResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
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
  };
  error: string;
}

// Interface for saveScoreCategory request
export interface SaveScoreCategoryRequest {
  homework_id: number;
  lesson_id: number;
  question_id: number;
  answers: Record<number, number>;
}

// Interface for saveScoreCategory response
export interface SaveScoreCategoryResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
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
  };
  error: string;
}

// Interface for saveScoreLabeling request
export interface SaveScoreLabelingRequest {
  homework_id: number;
  lesson_id: number;
  question_id: number;
  answers: Record<number, number>;
}

// Interface for saveScoreLabeling response
export interface SaveScoreLabelingResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
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
  };
  error: string;
}

// Interface for saveScoreManual request
export interface SaveScoreManualRequest {
  homework_id: number;
  lesson_id: number;
  question_id: number;
  answer: string;
  file_url: string;
}

// Interface for saveScoreManual response
export interface SaveScoreManualResponse {
  code: number;
  message: string;
  data: {
    message: string;
    success: string;
  };
  error: string;
}

// Interface for skip question request
export interface SkipQuestionRequest {
  homework_id: number;
  lesson_id: number;
  question_id: number;
}

// Interface for skip question response
export interface SkipQuestionResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    success: boolean;
    message: string;
    homework_id: string;
    question_id: string;
    user_id: string;
  };
  error: string;
}

// Interface for submit homework request
export interface SubmitHomeworkRequest {
  homework_id: number;
  lesson_id: number;
  files?: Array<{
    type: string;
    url: string;
  }>;
}

// Interface for submit homework response
export interface SubmitHomeworkResponse {
  code: number;
  message: string;
  data: {
    homework_id: number;
    ratio: number;
    score: number;
    star: number;
    user_id: number;
    has_manual_scoring?: boolean;
    has_questions_need_manual_grading?: boolean;
    is_completed: boolean;
    exp: number;
    total_exp: number;
    total_star: string;
    completion_rate: number;
  };
}

// Interface for check submit homework response
export interface CheckSubmitHomeworkResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    homework_id: string;
    lesson_id: string;
    user_id: string;
    skipped_count: string;
    skipped_question_ids: Array<number | string>;
    not_completed_count: string;
  };
  error: string;
}

export interface HomeworkSubmission {
  id: string;
  homeworkId: string;
  studentId: string;
  answers: Record<string, any>;
  score: number;
  totalPoints: number;
  timeSpent: number;
  submittedAt: Date;
  status: "in-progress" | "submitted" | "graded";
}

/**
 * Lấy danh sách bài tập về nhà với bộ lọc
 */
export async function GetHomeworkList(filters: HomeworkFilters = {}): Promise<{
  homeworks: Homework[];
  totalPages: number;
  page: number;
  total: number;
}> {
  try {
    console.log("Fetching homeworks with filters:", filters);

    const response = await axiosInstance.get("/manage/homeworks", {
      params: filters,
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });

    const data = response.data as HomeworksResponse;

    if (data.code === 200 && data.data) {
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const totalCount =
        typeof data.data.total === "string"
          ? Number.parseInt(data.data.total)
          : data.data.total;
      const totalPages = Math.ceil(totalCount / limit);

      return {
        homeworks: data.data.homeworks,
        totalPages,
        page,
        total: totalCount,
      };
    } else {
      throw new Error(
        data.message || data.error || "Failed to fetch homeworks"
      );
    }
  } catch (error: any) {
    console.error("Error fetching homeworks:", error);

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
 * Lấy chi tiết một bài tập về nhà
 */
export async function GetHomeworkDetail(
  id: string | number
): Promise<Homework> {
  try {
    console.log("Fetching homework detail for ID:", id);

    const response = await axiosInstance.get(`/manage/homeworks/${id}`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });
    const data = response.data as SingleHomeworkResponse;

    if (data.code === 200 && data.data) {
      return {
        id: data.data.id,
        name: data.data.name,
        description: data.data.description,
        status: data.data.status,
        max_score: data.data.max_score,
        cover_image: data.data.cover_image,
        lesson_id: data.data.lesson_id,
        created_at: data.data.created_at,
        created_by: data.data.created_by,
        updated_at: data.data.updated_at,
        updated_by: data.data.updated_by,
        is_assigned: data.data.is_assigned,
        total_questions: data.data.total_questions,
        question_completed: data.data.question_completed,
        last_question_id_completed: data.data.last_question_id_completed,
        question_form: data.data.question_form ?? "",
        question_files: data.data.question_files,
      };
    } else {
      throw new Error(data.message || data.error || "Failed to fetch homework");
    }
  } catch (error: any) {
    console.error(`Error fetching homework with ID ${id}:`, error);

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
 * Tạo bài tập về nhà mới
 */
export async function CreateHomework(
  homeworkData: CreateHomeworkData
): Promise<Homework> {
  try {
    const response = await axiosInstance.post(
      "/manage/homeworks",
      homeworkData,
      {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      }
    );
    const data = response.data as SingleHomeworkResponse;

    if (data.code === 200 && data.data) {
      return {
        id: data.data.id,
        name: data.data.name,
        description: data.data.description,
        status: data.data.status,
        max_score: data.data.max_score,
        cover_image: data.data.cover_image,
        lesson_id: data.data.lesson_id,
        created_at: data.data.created_at,
        created_by: data.data.created_by,
        updated_at: data.data.updated_at,
        updated_by: data.data.updated_by,
        question_form: data.data.question_form ?? "",
        question_files: data.data.question_files,
      };
    } else {
      throw new Error(
        data.message || data.error || "Failed to create homework"
      );
    }
  } catch (error: any) {
    console.error("Error creating homework:", error);

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
 * Cập nhật bài tập về nhà
 */
export async function UpdateHomework(
  id: string | number,
  homeworkData: UpdateHomeworkData
): Promise<Homework> {
  try {
    console.log("Updating homework with ID:", id);
    console.log("Updated data:", JSON.stringify(homeworkData, null, 2));

    const response = await axiosInstance.put(
      `/manage/homeworks/${id}`,
      homeworkData,
      {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      }
    );
    const data = response.data as SingleHomeworkResponse;

    if (data.code === 200 && data.data) {
      return {
        id: data.data.id,
        name: data.data.name,
        description: data.data.description,
        status: data.data.status,
        max_score: data.data.max_score,
        cover_image: data.data.cover_image,
        lesson_id: data.data.lesson_id,
        created_at: data.data.created_at,
        created_by: data.data.created_by,
        updated_at: data.data.updated_at,
        updated_by: data.data.updated_by,
        question_form: data.data.question_form ?? "",
        question_files: data.data.question_files,
      };
    } else {
      throw new Error(
        data.message || data.error || "Failed to update homework"
      );
    }
  } catch (error: any) {
    console.error(`Error updating homework with ID ${id}:`, error);

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
 * Xóa bài tập về nhà
 */
export async function DeleteHomework(id: string | number): Promise<boolean> {
  try {
    console.log("Deleting homework with ID:", id);

    const response = await axiosInstance.delete(`/manage/homeworks/${id}`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });
    const data = response.data;

    if (data.code === 200) {
      return true;
    } else {
      throw new Error(
        data.message || data.error || "Failed to delete homework"
      );
    }
  } catch (error: any) {
    console.error(`Error deleting homework with ID ${id}:`, error);

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

// Function to submit homework answers
export async function submitHomework(
  homeworkId: string | number,
  answers: Record<string, any>
): Promise<HomeworkSubmission> {
  try {
    // Simulate API call for demo
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const submission: HomeworkSubmission = {
      id: `submission-${Date.now()}`,
      homeworkId: homeworkId.toString(),
      studentId: "student-1",
      answers,
      score: 0, // Would be calculated on server
      totalPoints: 0, // mockHomework.max_score,
      timeSpent: 0, // Would be tracked
      submittedAt: new Date(),
      status: "submitted",
    };

    return submission;

    // Uncomment for real API call
    /*
    const response = await axiosInstance.post(
      `/manage/homeworks/${homeworkId}/submit`,
      { answers },
      {
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
        },
      },
    )

    return response.data
    */
  } catch (error) {
    console.error(`Error submitting homework with ID ${homeworkId}:`, error);
    throw error;
  }
}

// Function to get homework submissions
export async function getHomeworkSubmissions(homeworkId: string | number) {
  try {
    const response = await axiosInstance.get(
      `/manage/homeworks/${homeworkId}/submissions`,
      {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      `Error fetching submissions for homework ID ${homeworkId}:`,
      error
    );
    throw error;
  }
}

//Lưu điểm cho câu hỏi multiple-choice
export async function saveScoreMultipleChoice(
  requestData: SaveScoreMultipleChoiceRequest
): Promise<SaveScoreMultipleChoiceResponse> {
  try {
    console.log(
      "Saving score for multiple choice:",
      JSON.stringify(requestData, null, 2)
    );

    const response = await axiosInstance.post(
      "/study/save-score/multiple-choice",
      requestData,
      {
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data as SaveScoreMultipleChoiceResponse;

    if (data.code === 200) {
      return data;
    } else {
      throw new Error(data.message || data.error || "Failed to save score");
    }
  } catch (error: any) {
    console.error("Error saving score:", error);

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

//Lưu điểm cho câu hỏi fill in blank
export async function saveScoreFillInBlank(
  requestData: SaveScoreFillInBlankRequest
): Promise<SaveScoreFillInBlankResponse> {
  try {
    console.log(
      "Saving score for fill in blank:",
      JSON.stringify(requestData, null, 2)
    );

    const response = await axiosInstance.post(
      "/study/save-score/fill-in-blank",
      requestData,
      {
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data as SaveScoreFillInBlankResponse;

    if (data.code === 200) {
      return data;
    } else {
      throw new Error(data.message || data.error || "Failed to save score");
    }
  } catch (error: any) {
    console.error("Error saving score:", error);

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

//Lưu điểm cho câu hỏi ordering-Dragdrop
export async function saveScoreOrderingDragdrop(
  requestData: SaveScoreOrderingDragdropRequest
): Promise<SaveScoreOrderingDragdropResponse> {
  try {
    console.log(
      "Saving score for ordering dragdrop:",
      JSON.stringify(requestData, null, 2)
    );

    const response = await axiosInstance.post(
      "/study/save-score/ordering-and-dragdrop",
      requestData,
      {
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data as SaveScoreOrderingDragdropResponse;

    if (data.code === 200) {
      return data;
    } else {
      throw new Error(data.message || data.error || "Failed to save score");
    }
  } catch (error: any) {
    console.error("Error saving score:", error);

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

//Lưu điểm cho câu hỏi matching
export async function saveScoreMatching(
  requestData: SaveScoreMatchingRequest
): Promise<SaveScoreMatchingResponse> {
  try {
    console.log(
      "Saving score for matching:",
      JSON.stringify(requestData, null, 2)
    );

    const response = await axiosInstance.post(
      "/study/save-score/matching",
      requestData,
      {
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data as SaveScoreMatchingResponse;

    if (data.code === 200) {
      return data;
    } else {
      throw new Error(data.message || data.error || "Failed to save score");
    }
  } catch (error: any) {
    console.error("Error saving score:", error);

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

//Lưu điểm cho câu hỏi category
export async function saveScoreCategory(
  requestData: SaveScoreCategoryRequest
): Promise<SaveScoreCategoryResponse> {
  try {
    console.log(
      "Saving score for category:",
      JSON.stringify(requestData, null, 2)
    );

    const response = await axiosInstance.post(
      "/study/save-score/category",
      requestData,
      {
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data as SaveScoreCategoryResponse;

    if (data.code === 200) {
      return data;
    } else {
      throw new Error(data.message || data.error || "Failed to save score");
    }
  } catch (error: any) {
    console.error("Error saving score:", error);

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

//Lưu điểm cho câu hỏi labeling
export async function saveScoreLabeling(
  requestData: SaveScoreLabelingRequest
): Promise<SaveScoreLabelingResponse> {
  try {
    console.log(
      "Saving score for labeling:",
      JSON.stringify(requestData, null, 2)
    );

    const response = await axiosInstance.post(
      "/study/save-score/labeling",
      requestData,
      {
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data as SaveScoreLabelingResponse;

    if (data.code === 200) {
      return data;
    } else {
      throw new Error(data.message || data.error || "Failed to save score");
    }
  } catch (error: any) {
    console.error("Error saving score:", error);

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

//Lưu điểm cho câu hỏi manual
export async function saveScoreManual(
  requestData: SaveScoreManualRequest
): Promise<SaveScoreManualResponse> {
  try {
    console.log(
      "Saving score for manual:",
      JSON.stringify(requestData, null, 2)
    );

    const response = await axiosInstance.post(
      "/study/save-answer/manual-scoring",
      requestData,
      {
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data as SaveScoreManualResponse;

    if (data.code === 200) {
      return data;
    } else {
      throw new Error(data.message || data.error || "Failed to save score");
    }
  } catch (error: any) {
    console.error("Error saving score:", error);

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

// Skip a question in homework
export async function skipHomeworkQuestion(
  requestData: SkipQuestionRequest
): Promise<SkipQuestionResponse> {
  try {
    const response = await axiosInstance.post(
      "/study/save-score/skip-question",
      requestData,
      {
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data as SkipQuestionResponse;

    if (data.code === 200) {
      return data;
    } else {
      throw new Error(data.message || data.error || "Failed to skip question");
    }
  } catch (error: any) {
    console.error("Error skipping question:", error);

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

// Submit homework (final submission)
export async function submitHomeworkFinal(
  requestData: SubmitHomeworkRequest
): Promise<SubmitHomeworkResponse> {
  try {
    const response = await axiosInstance.post(
      "/study/save-score/submit-homework",
      requestData,
      {
        headers: {
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data as SubmitHomeworkResponse;
    if (data.code === 200) {
      return data;
    } else {
      throw new Error(data.message || "Failed to submit homework");
    }
  } catch (error: any) {
    console.error("Error submitting homework:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    }
    throw error;
  }
}

// Check submit status before final submission
export async function checkSubmitHomework(
  homeworkId: number,
  lessonId: number
): Promise<CheckSubmitHomeworkResponse> {
  try {
    const response = await axiosInstance.get(
      "/study/save-score/check-submit-homework",
      {
        params: {
          homework_id: homeworkId,
          lesson_id: lessonId,
        },
        headers: { "ngrok-skip-browser-warning": "true" },
      }
    );
    return response.data as CheckSubmitHomeworkResponse;
  } catch (error: any) {
    console.error("Error checking submit homework:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    }
    throw error;
  }
}

//API giao bài tập về nhà
export async function AssignHomework(
  id: string | number,
  lessonId: number,
  requestBody: { is_assigned: boolean; course_id?: number }
): Promise<{ lesson_id: string; is_assigned: boolean }> {
  try {
    console.log("Assigning homework with ID:", id, "with data:", requestBody);

    const response = await axiosInstance.post(
      `/manage/homeworks/${id}/assigned`,
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
          "Failed to assign homework"
      );
    }
  } catch (error: any) {
    console.error(`Error assigning homework with ID ${id}:`, error);
    throw error;
  }
}
