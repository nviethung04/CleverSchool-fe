import axiosInstance from "./axios";

export interface GradeItem {
  id: string;
  number: number;
  name_vn: string;
  name_en: string;
  created_at: string;
  updated_at: string;
}

export interface GradesResponseData {
  "@type": string;
  grades: GradeItem[];
  total_count: string;
}

export interface GradesResponse {
  code: number;
  message: string;
  data: GradesResponseData;
  error: string;
}

interface GetGradesParams {
  page?: number;
  per_page?: number;
}

export async function GetGrades(
  params?: GetGradesParams
): Promise<GradesResponse> {
  try {
    const response = await axiosInstance.get("/manage/grades", {
      params,
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Error fetching grades:", error);
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
