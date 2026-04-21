import axiosInstance from "./axios";

// Types
export interface Holiday {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  type: string;
  week_id: string;
  status: boolean;
  sort_order: number;
  semester_id?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateHolidayRequest {
  semester_id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  week_id: number;
  sort_order: number;
  status: boolean;
}

export interface CreateHolidayResponse {
  code: number;
  message: string;
  data: Holiday;
  error: string;
}

// Hàm tạo holiday mới
export async function CreateHoliday(
  data: CreateHolidayRequest
): Promise<CreateHolidayResponse> {
  try {
    const response = await axiosInstance.post("/manage/holidays", data);
    return response.data;
  } catch (error: any) {
    console.error("Error creating holiday:", error);

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
