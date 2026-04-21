import axiosInstance from "./axios";

// Cập nhật interface cho response của lesson plans
interface LessonPlanResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    lessonPlans: LessonPlan[];
    total: string;
  };
  error: string;
}

// Cập nhật interface cho response của single lesson plan
interface SingleLessonPlanResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    id: string;
    name: string;
    description: string;
    cover_image: string;
    status: number;
    sort_position: number;
    total_time: string;
    views: number;
    created_at: string;
    updated_at: string;
    is_complete?: boolean;
    lesson_id?: string | number;
  };
  error: string;
}

// Cập nhật interface cho response của lesson plan parts
interface LessonPlanPartsResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    parts: LessonPlanPart[];
    total: string;
  };
  error: string;
}

// Interface cho response của delete lesson plan
interface DeleteLessonPlanResponse {
  code: number;
  data: null;
  message: string;
}

// Interface for lesson plan data
export interface LessonPlan {
  id: string | number;
  name: string;
  description: string;
  status: number;
  sort_position: number;
  total_time: string | number;
  views: number;
  created_at: string | number;
  updated_at: string | number;
  cover_image: string;
  lesson_id?: string | number;
  is_complete?: boolean;
}

// Interface for lesson plan part data
export interface LessonPlanPart {
  id: string | number;
  lesson_plan_id: string | number;
  title: string;
  tag: string;
  cover_image: string;
  file?: string;
  sort_position: number;
  time: string | number;
  is_classwork: boolean;
  is_program?: boolean;
  file_type: string;
  link: string;
  link_type: string;
  guide_teacher: string;
  guide_student: string;
  created_at: string | number;
  created_by: string | number;
  updated_at: string | number;
  updated_by: string | number;
}

export interface LectureFilters {
  subject?: string;
  grade?: string;
  keyword?: string;
  status?: string;
  lesson_id?: string | number; // Thêm filter lesson_id để lọc theo bài học
  page?: number;
  limit?: number;
  sort_id?: "asc" | "desc";
  sort_created_at?: "newest" | "oldest";
}

/**
 * Tính tổng thời gian của bài giảng từ các phần
 */
export function calculateTotalTime(parts: Array<{ time: string | number }>) {
  if (!parts || !Array.isArray(parts) || parts.length === 0) {
    return 0;
  }

  return parts.reduce((total, part) => {
    // Chuyển đổi time thành số nếu là chuỗi
    const partTime =
      typeof part.time === "string"
        ? Number.parseInt(part.time, 10)
        : part.time;

    // Kiểm tra nếu partTime là NaN hoặc không phải số hợp lệ
    if (isNaN(partTime) || partTime < 0) {
      return total;
    }

    return total + partTime;
  }, 0);
}

// Cập nhật hàm get list lesson plans để xử lý cấu trúc response mới
export const getLessonPlans = async (
  filters: LectureFilters = { page: 1, limit: 9 }
): Promise<{ lessonPlans: LessonPlan[]; totalPages: number; page: number; total: number }> => {
  try {
    const response = await axiosInstance.get("/manage/lesson-plans", {
      params: { ...filters },
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });

    const data = response.data as LessonPlanResponse;

    if (data.code === 200 && data.data && data.data.lessonPlans) {
      const lessonPlans = data.data.lessonPlans;
      const page = filters.page || 1;
      const limit = filters.limit || 9;
      const total = Number.parseInt(data.data.total) || 0;

      // Tính toán tổng số trang dựa trên tổng số bản ghi từ API
      const totalPages = Math.ceil(total / limit);

      return {
        lessonPlans: lessonPlans,
        totalPages: totalPages || 1,
        page: page,
        total: total,
      };
    } else {
      throw new Error(
        `Failed to fetch lesson plans: ${data.message || data.error}`
      );
    }
  } catch (error) {
    console.error("Error fetching lesson plans:", error);
    throw error;
  }
};

// Hàm lấy chi tiết một lesson plan - đã cập nhật theo cấu trúc response mới
export const getLessonPlanById = async (
  id: number,
  courseId?: string | number
): Promise<LessonPlan> => {
  try {
    const params: any = {};
    if (courseId) {
      params.course_id = courseId;
    }

    const response = await axiosInstance.get(`/manage/lesson-plans/${id}`, {
      params,
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });

    const data = response.data as SingleLessonPlanResponse;

    if (data.code === 200 && data.data) {
      // Chuyển đổi dữ liệu từ response sang interface LessonPlan
      const lessonPlan: LessonPlan = {
        id: data.data.id,
        name: data.data.name,
        description: data.data.description,
        status: data.data.status,
        sort_position: data.data.sort_position,
        total_time: data.data.total_time,
        created_at: data.data.created_at,
        updated_at: data.data.updated_at,
        cover_image: data.data.cover_image,
        views: data.data.views,
        is_complete: data.data.is_complete,
        lesson_id: data.data.lesson_id,
      };
      return lessonPlan;
    } else {
      throw new Error(
        `Failed to fetch lesson plan: ${data.message || data.error}`
      );
    }
  } catch (error) {
    console.error(`Error fetching lesson plan with ID ${id}:`, error);
    throw error;
  }
};

// Cập nhật hàm getLessonPlanParts để phù hợp với cấu trúc response mới
export const getLessonPlanParts = async (
  lessonPlanId: number,
  courseId?: string | number
): Promise<LessonPlanPart[]> => {
  try {
    // Sử dụng GET với lesson_plan_id trong query parameter
    const params: any = { lesson_plan_id: Number(lessonPlanId) };
    if (courseId) {
      params.course_id = courseId;
    }

    const response = await axiosInstance.get("/manage/lesson-plan-parts", {
      params,
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });

    const data = response.data as LessonPlanPartsResponse;

    if (data.code === 200 && data.data && data.data.parts) {
      return data.data.parts;
    } else {
      console.warn("Unexpected data structure or empty parts:", data);
      return [];
    }
  } catch (error) {
    console.error(
      `Error fetching parts for lesson plan ID ${lessonPlanId}:`,
      error
    );
    throw error;
  }
};

// Hàm tạo bài giảng mới (lesson plan)
export async function createLessonPlan(lessonPlanData: any) {
  try {
    // Đảm bảo total_time là số
    let totalTime = 0;
    if (typeof lessonPlanData.total_time === "string") {
      totalTime = Number.parseInt(lessonPlanData.total_time, 10);
      if (isNaN(totalTime) || totalTime < 0) {
        totalTime = 0;
      }
    } else if (typeof lessonPlanData.total_time === "number") {
      totalTime = lessonPlanData.total_time;
    }

    const response = await axiosInstance.post("/manage/lesson-plans", {
      name: lessonPlanData.name,
      description: lessonPlanData.description,
      status: Number(lessonPlanData.status) || 1,
      sort_position: Number(lessonPlanData.sort_position) || 1,
      total_time: totalTime, // Sử dụng giá trị đã xử lý
      lesson_id: Number(lessonPlanData.lesson_id) || 1,
      cover_image: lessonPlanData.cover_image || "",
    });

    console.log("Lesson plan created:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating lesson plan:", error);
    throw error;
  }
}

// Hàm cập nhật bài giảng (lesson plan)
export async function updateLessonPlan(id: number, lessonPlanData: any) {
  try {
    // Đảm bảo total_time là số
    let totalTime = 0;
    if (typeof lessonPlanData.total_time === "string") {
      // Nếu là chuỗi, chuyển đổi thành số và đảm bảo giá trị hợp lý
      totalTime = Number.parseInt(lessonPlanData.total_time, 10);
      if (isNaN(totalTime) || totalTime < 0) {
        totalTime = 0;
      }
    } else if (typeof lessonPlanData.total_time === "number") {
      totalTime = lessonPlanData.total_time;
    }

    const response = await axiosInstance.put(`/manage/lesson-plans/${id}`, {
      name: lessonPlanData.name,
      description: lessonPlanData.description,
      status: Number(lessonPlanData.status),
      sort_position: Number(lessonPlanData.sort_position) || 1,
      total_time: totalTime, // Sử dụng giá trị đã xử lý
      lesson_id: Number(lessonPlanData.lesson_id) || 1,
      cover_image: lessonPlanData.cover_image || "",
    });

    console.log("Lesson plan updated:", response.data);
    return response.data;
  } catch (error) {
    console.error(`Error updating lesson plan with ID ${id}:`, error);
    throw error;
  }
}

// Hàm xóa bài giảng (lesson plan)
export async function deleteLessonPlan(id: number) {
  try {
    const response = await axiosInstance.delete(`/manage/lesson-plans/${id}`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });

    const data = response.data as DeleteLessonPlanResponse;

    if (data.code === 200) {
      console.log("Lesson plan deleted successfully:", data);
      return true;
    } else {
      console.error("Failed to delete lesson plan:", data);
      return false;
    }
  } catch (error) {
    console.error(`Error deleting lesson plan with ID ${id}:`, error);
    throw error;
  }
}

// Hàm tạo phần của bài giảng (lesson plan part)
export async function createLessonPlanPart(
  partData: any,
  courseId?: string | number
) {
  try {
    // Đảm bảo các trường số được gửi dưới dạng số, không phải chuỗi
    const requestData: any = {
      lesson_plan_id: Number(partData.lesson_plan_id),
      title: partData.title,
      tag: partData.tag || "",
      cover_image: partData.cover_image || "",
      file: partData.file || "",
      sort_position: Number(partData.sort_position) || 1,
      time: Number(partData.time) || 0,
      is_classwork: Boolean(partData.is_classwork),
      file_type: partData.file_type || "",
      link: partData.link || "",
      link_type: partData.link_type || "",
      guide_teacher: partData.guide_teacher || "",
      guide_student: partData.guide_student || "",
    };

    if (courseId) {
      requestData.course_id = courseId;
    }

    const response = await axiosInstance.post(
      "/manage/lesson-plan-parts",
      requestData
    );

    console.log("Lesson plan part created:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating lesson plan part:", error);
    throw error;
  }
}
export async function deleteLessonPlanPart(
  id: number,
  courseId?: string | number
) {
  try {
    const params: any = {};
    if (courseId) {
      params.course_id = courseId;
    }

    const response = await axiosInstance.delete(
      `/manage/lesson-plan-parts/${id}`,
      {
        params,
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      }
    );

    const data = response.data as DeleteLessonPlanResponse;

    if (data.code === 200) {
      console.log("Lesson plan part deleted successfully:", data);
      return true;
    } else {
      console.error("Failed to delete lesson plan part:", data);
      return false;
    }
  } catch (error) {
    console.error(`Error deleting lesson plan part with ID ${id}:`, error);
    throw error;
  }
}
// Hàm cập nhật phần của bài giảng (lesson plan part)
export async function updateLessonPlanPart(
  id: number,
  partData: any,
  courseId?: string | number
) {
  try {
    const requestData: any = {
      lesson_plan_id: Number(partData.lesson_plan_id),
      title: partData.title,
      tag: partData.tag || "",
      cover_image: partData.cover_image || "",
      file: partData.file || "",
      sort_position: Number(partData.sort_position) || 1,
      time: Number(partData.time) || 0,
      is_classwork: Boolean(partData.is_classwork),
      file_type: partData.file_type || "",
      link: partData.link || "",
      link_type: partData.link_type || "",
      guide_teacher: partData.guide_teacher || "",
      guide_student: partData.guide_student || "",
    };

    if (courseId) {
      requestData.course_id = courseId;
    }

    const response = await axiosInstance.put(
      `/manage/lesson-plan-parts/${id}`,
      requestData
    );

    console.log("Lesson plan part updated:", response.data);
    return response.data;
  } catch (error) {
    console.error(`Error updating lesson plan part with ID ${id}:`, error);
    throw error;
  }
}

//Cập nhật trạng thái hoàn thành bài giảng
export async function updateLessonPlanComplete(
  id: string | number,
  is_complete: boolean,
  courseId?: string | number
) {
  try {
    const requestBody: any = {
      is_complete: is_complete,
    };

    if (courseId) {
      requestBody.course_id = courseId;
    }

    const response = await axiosInstance.put(
      `/manage/lesson-plans/${id}/complete`,
      requestBody
    );
    return response.data;
  } catch (error: any) {
    console.error("Error updating lesson plan complete:", error);
    throw error;
  }
}
