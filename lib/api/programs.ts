import axiosInstance from "@/lib/api/axios";

export const GetProgramList = async (params?: {
  keyword?: string;
  school_id?: string;
  subject_id?: string;
  page?: number;
  per_page?: number;
  fields?: string;
}) => {
  try {
    const response = await axiosInstance.get("manage/programs", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching programs:", error);
    throw error;
  }
};

export const GetProgramDetail = async (id: string) => {
  try {
    const response = await axiosInstance.get(`manage/programs/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching program detail:", error);
    throw error;
  }
};

export const UpdateProgram = async (id: string, data: any) => {
  try {
    const response = await axiosInstance.put(`manage/programs/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating program:", error);
    throw error;
  }
};

export const CreateProgram = async (data: any) => {
  try {
    // Sử dụng axios instance đã được cấu hình với token
    const response = await axiosInstance.post("manage/programs", data);

    return response.data;
  } catch (error: any) {
    console.error("Error creating program:", error);

    // Log thêm thông tin chi tiết về lỗi
    if (error.response) {
      // Server trả về response với status code nằm ngoài range 2xx
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    } else if (error.request) {
      // Request đã được gửi nhưng không nhận được response
      console.error("No response received:", error.request);
    } else {
      // Có lỗi khi thiết lập request
      console.error("Error setting up request:", error.message);
    }

    throw error;
  }
};

export const DeleteProgram = async (id: string) => {
  try {
    const response = await axiosInstance.delete(`manage/programs/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting program:", error);
    throw error;
  }
};
