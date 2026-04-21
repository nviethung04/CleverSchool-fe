import axiosInstance from "./axios";

// Interface cho bài học
export interface Lesson {
  id: string | number;
  title: string;
  description: string;
  status: boolean;
  chapter: {
    id: string | number;
    title: string;
  };
  dependencies: Array<{
    id: string | number;
    title: string;
  }>;
  tags: Array<{
    id: string | number;
    name: string;
  }>;
  topics: Array<{
    id: string | number;
    name: string;
  }>;
  skill: Array<{
    id: string | number;
    name: string;
  }>;
  exams: Array<{
    id: string | number;
    name: string;
  }>;
  homeworks: Array<{
    id: string | number;
    name: string;
  }>;
  assessment: Array<{
    id: string | number;
    name: string;
  }>;
  author: {
    id: string | number;
    name: string;
    username: string;
    email: string;
    phone_number: string;
  };
  created_at?: string;
  updated_at?: string;
  is_complete?: boolean; // trạng thái hoàn thành của học sinh
}

// Hàm lấy danh sách bài học
export async function GetLessons(params?: any) {
  try {
    console.log("Fetching lessons with params:", params);

    const response = await axiosInstance.get("/manage/lessons", {
      params, // optional query params (e.g., chapter_id, pagination, etc.)
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Error fetching lessons:", error);

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

// Hàm lấy chi tiết bài học
export async function GetLessonDetail(
  lessonId: string | number,
  courseId?: string | number
) {
  try {
    const params: any = {};
    if (courseId) {
      params.course_id = courseId;
    }

    const response = await axiosInstance.get(`/manage/lessons/${lessonId}`, {
      params,
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });

    return response.data;
  } catch (error: any) {
    console.error(`Error fetching lesson detail for ID ${lessonId}:`, error);

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

// Hàm tạo bài học mới (chuẩn body mới)
export async function CreateLesson(lessonData: any) {
  try {
    // Đảm bảo status là boolean
    const status =
      typeof lessonData.status === "boolean"
        ? lessonData.status
        : Boolean(lessonData.status);

    // Xử lý các trường có thể là undefined/null
    const body = {
      title: lessonData.title,
      description: lessonData.description,
      status: status,
      chapter: lessonData.chapter ?? null, // luôn đẩy lên, nếu undefined thì là null
      dependencies: lessonData.dependencies || [],
      tags: lessonData.tags || [],
      topics: lessonData.topics || [],
      skills: lessonData.skills || [],
      exams: lessonData.exams || [],
      lesson_plans: lessonData.lesson_plans || [],
      homeworks: lessonData.homeworks || [],
      assessment: lessonData.assessment || [],
      exercises: lessonData.exercises || [],
      created_at: lessonData.created_at || undefined,
      updated_at: lessonData.updated_at || undefined,
    };

    const response = await axiosInstance.post("/manage/lessons", body);
    console.log("Lesson created:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating lesson:", error);
    throw error;
  }
}

// Hàm cập nhật bài học (PUT)
export async function UpdateLesson(
  lessonId: string | number,
  lessonData: any,
  courseId?: string | number
) {
  try {
    // Đảm bảo status là boolean nếu có
    const body: any = {};
    if ("title" in lessonData) body.title = lessonData.title;
    if ("description" in lessonData) body.description = lessonData.description;
    if ("status" in lessonData) {
      body.status =
        typeof lessonData.status === "boolean"
          ? lessonData.status
          : Boolean(lessonData.status);
    }
    if ("chapter" in lessonData) body.chapter = lessonData.chapter ?? null;
    if ("dependencies" in lessonData)
      body.dependencies = lessonData.dependencies || [];
    if ("tags" in lessonData) body.tags = lessonData.tags || [];
    if ("topics" in lessonData) body.topics = lessonData.topics || [];
    if ("skills" in lessonData) body.skills = lessonData.skills || [];
    if ("exams" in lessonData) body.exams = lessonData.exams || [];
    if ("lesson_plans" in lessonData)
      body.lesson_plans = lessonData.lesson_plans || [];
    if ("homeworks" in lessonData) body.homeworks = lessonData.homeworks || [];
    if ("exercises" in lessonData) body.exercises = lessonData.exercises || [];
    if ("assessment" in lessonData)
      body.assessment = lessonData.assessment || [];
    if ("created_at" in lessonData) body.created_at = lessonData.created_at;
    if ("updated_at" in lessonData) body.updated_at = lessonData.updated_at;

    const response = await axiosInstance.put(
      `/manage/lessons/${lessonId}`,
      body,
      {
        params: courseId ? { course_id: courseId } : undefined,
      }
    );
    console.log("Lesson updated:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error updating lesson:", error);
    throw error;
  }
}
export async function DeleteLesson(lessonId: string) {
  try {
    const response = await axiosInstance.delete(`/manage/lessons/${lessonId}`);
    // Trả về status code để component có thể kiểm tra thành công/thất bại
    return { status: response.status };
  } catch (error: any) {
    console.error("Error deleting lesson:", error);

    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
      // Nếu có response trả về, trả về status code để component xử lý
      return { status: error.response.status };
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }

    throw error;
  }
}
