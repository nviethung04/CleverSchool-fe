import axiosInstance from "./axios";

// Hàm gọi API tạo người dùng
export interface Chapter {
  id: string;
  course_id: number;
  title: string;
  description?: string;
  lessons?: Array<{
    id: string;
    title: string;
  }>;
  created_at?: string;
  updated_at?: string;
}

interface ChapterCreatePayload {
  title: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  status?: boolean
}

export async function CreateChapter(
  data: ChapterCreatePayload,
  course_id: number,
  isProgram = false
) {
  try {
    console.log("Sending chapter data to API:", JSON.stringify(data, null, 2));

    const payload = isProgram ? {
      ...data,
      program_id: course_id,
    } : {
      ...data,
      course_id: course_id,
    };

    const response = await axiosInstance.post("/manage/chapters", payload);
    console.log("Chapter created with ID:", response.data);
    console.log("Full chapter create response:", response.data.data.course_id);
    return response.data.data;
  } catch (error: any) {
    console.error("Error creating chapter:", error);

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

export async function GetChapters(params: any = {}) {
  try {
    if (
      typeof params !== "object" ||
      Array.isArray(params) ||
      params === null
    ) {
      params = {};
    }

    const response = await axiosInstance.get("/manage/chapters", {
      params,
    });

    return response.data;
  } catch (error: any) {
    console.error("Error fetching chapters:", error);

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
export async function GetChapterDetail(chapterID: string | number) {
  try {
    console.log("Fetching chapter detail for ID:", chapterID);

    const response = await axiosInstance.get(`/manage/chapters/${chapterID}`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });

    return response.data;
  } catch (error: any) {
    console.error(`Error fetching chapter detail for ID ${chapterID}:`, error);

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

export async function DeleteChapter(id: string) {
  try {
    const response = await axiosInstance.delete(`/manage/chapters/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("Error deleting chapter:", error);

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

export async function UpdateChapter(id: string, data: any) {
  try {
    console.log("🔵 UpdateChapter API called:", {
      id,
      data,
      url: `/manage/chapters/${id}`
    });

    const response = await axiosInstance.put(`/manage/chapters/${id}`, data);

    console.log("✅ UpdateChapter API response:", response.data);

    return response.data;
  } catch (error: any) {
    console.error("❌ Error updating chapter:", error);

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

export async function SortLessons(id: string, data: any) {
  try {
    console.log("🔵 UpdateChapter API called:", {
      id,
      data,
      url: `/manage/chapters/${id}/sort-lessons`
    });

    const response = await axiosInstance.put(`/manage/chapters/${id}/sort-lessons`, data);

    console.log("✅ UpdateChapter API response:", response.data);

    return response.data;
  } catch (error: any) {
    console.error("❌ Error updating chapter:", error);

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

