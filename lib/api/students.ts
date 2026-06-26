import axiosInstance from "./axios";

// Hàm lấy danh sách học sinh
export async function GetStudentList(params?: Record<string, any>) {
  try {
    const response = await axiosInstance.get("/mng/users", {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
      params: { role_id: 3, ...(params || {}) }, // thêm role_id: 3 vào params
    });

    return response.data;
  } catch (error: any) {
    console.error("Error fetching course list:", error);

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

export interface TeacherInfo {
  name: string;
  phone: string;
  email: string;
}

export interface ClassInfo {
  id: string;
  school_id: string;
  name: string;
  teacher_info: TeacherInfo;
}

export interface Student {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  is_activity: boolean;
  activity_date: string;
}

export interface ClassByUserResponse {
  total_student: string;
  active_students: string;
  class: ClassInfo;
  courses: any[];
  students: Student[];
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  error: string;
}

export const getClassByUser = async (): Promise<ClassByUserResponse> => {
  try {
    const response = await axiosInstance.get<ApiResponse<ClassByUserResponse>>(
      "/manage/users/class"
    );

    if (response.data.code === 200) {
      return response.data.data;
    } else {
      throw new Error(response.data.error || "Failed to fetch class data");
    }
  } catch (error) {
    console.error("Error fetching class data:", error);
    throw error;
  }
};

export interface Week {
  id: string;
  year: number;
  week_number: number;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export interface WeeksResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    weeks: Week[];
    total_count: string;
  };
  error: string;
}

export interface Exam {
  id: string;
  name: string;
  status: number;
  description: string;
  cover_image: string;
  deadline: string;
  is_submitted: boolean;
  unscored_count: number;
}

export interface Exercise {
  id: string;
  name: string;
  status: number;
  description: string;
  cover_image: string;
  deadline: string;
  is_submitted: boolean;
  unscored_count: number;
}

export interface Homework {
  id: string;
  name: string;
  status: number;
  description: string;
  cover_image: string;
  total_question: number;
  question_completed: number;
  submitted_status: number;
  last_question_id_completed: number;
  question_form: "question" | "write";
  is_submitted: boolean;
}

export interface Assessment {
  id: string;
  name: string;
  description: string;
  type: string;
  is_submitted: boolean;
  is_scored: boolean;
  is_published: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  status: boolean;
  exams: Exam[];
  exercises: Exercise[];
  homeworks: Homework[];
  assessments?: Assessment[];
}

export interface Course {
  id: string;
  name: string;
  description: string;
  status: boolean;
  subject_name: string;
  type: string;
  image: string;
  level: string;
  target: string;
  lessons: Lesson[];
}

export interface ExamsByWeekResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    courses: Course[];
    total: string;
  };
  error: string;
}

export async function getWeeks(course_id?: string): Promise<WeeksResponse> {
  try {
    const response = await axiosInstance.get("/manage/weeks", {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
      params: course_id ? { course_id } : {},
    });

    return response.data;
  } catch (error: any) {
    console.error("Error fetching weeks:", error);

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

export async function getExamsByWeek(
  weekId: string,
  limit = 10,
  page = 1,
  start_date?: number,
  end_date?: number,
  course_id?: string
): Promise<ExamsByWeekResponse> {
  try {
    const response = await axiosInstance.get("/study/student/exams-by-week", {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
      params: {
        week_id: weekId,
        limit: limit.toString(),
        page: page.toString(),
        ...(start_date !== undefined ? { start_date } : {}),
        ...(end_date !== undefined ? { end_date } : {}),
        ...(course_id ? { course_id } : {}),
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Error fetching exams by week:", error);

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

// Đánh dấu bài học đã hoàn thành cho học sinh
export interface LessonCompletionResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    id: string;
    student_id: string;
    is_complete: boolean;
    completion_at: string;
  };
  error: string;
}

/**
 * Đánh dấu bài học đã hoàn thành
 * @param lessonId id của bài học
 * @param isComplete trạng thái hoàn thành (true/false)
 */
export async function markLessonComplete(
  lessonId: string,
  isComplete: boolean = true
): Promise<LessonCompletionResponse> {
  try {
    const response = await axiosInstance.put<LessonCompletionResponse>(
      `/manage/lessons/${lessonId}/completion`,
      {
        is_complete: isComplete,
      },
      {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error marking lesson as complete:", error);
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
