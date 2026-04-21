import axiosInstance from "./axios";

// Types
export interface Holiday {
  id: number;
  semester_id?: number;
  name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  week_id?: number;
  sort_order?: number;
  status?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Semester {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: boolean;
  sort_order: number;
  previous_semester_id: string;
  start_week_id: string;
  end_week_id: string;
  holidays: Holiday[];
  created_at: string;
  updated_at: string;
}

export interface CreateSemesterHoliday {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  week_id: number;
  sort_order: number;
  status: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSemesterRequest {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  start_week_id: number;
  end_week_id: number;
  previous_semester_id: number;
  sort_order: number;
  status: boolean;
  holidays: CreateSemesterHoliday[];
}

export interface CreateSemesterResponse {
  code: number;
  message: string;
  data: Semester;
  error: string;
}

export interface GetSemestersResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    semesters: Semester[];
    total_count: string;
  };
  error: string;
}

export interface GetSemesterDetailResponse {
  code: number;
  message: string;
  data: Semester;
  error: string;
}

// Hàm tạo semester mới
export async function CreateSemester(
  data: CreateSemesterRequest
): Promise<CreateSemesterResponse> {
  try {
    const response = await axiosInstance.post("/manage/semesters", data);
    return response.data;
  } catch (error: any) {
    console.error("Error creating semester:", error);

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

// Hàm lấy danh sách semesters
export async function GetSemestersList(): Promise<GetSemestersResponse> {
  try {
    const response = await axiosInstance.get("/manage/semesters");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching semesters list:", error);

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

// Hàm lấy thông tin chi tiết semester
export async function GetSemesterDetail(
  semesterId: string
): Promise<GetSemesterDetailResponse> {
  try {
    const response = await axiosInstance.get(`/manage/semesters/${semesterId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching semester detail:", error);

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

// Hàm cập nhật semester
export async function UpdateSemester(
  semesterId: string,
  data: CreateSemesterRequest
): Promise<CreateSemesterResponse> {
  try {
    const response = await axiosInstance.put(
      `/manage/semesters/${semesterId}`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error("Error updating semester:", error);

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

// Hàm xóa semester
export async function DeleteSemester(semesterId: string) {
  try {
    const response = await axiosInstance.delete(
      `/manage/semesters/${semesterId}`
    );
    return response.data;
  } catch (error: any) {
    console.error("Error deleting semester:", error);

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
