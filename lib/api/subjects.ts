import axiosInstance from "./axios";

// Hàm lấy danh sách môn học
export async function GetSubjectsList() {
  try {
    const response = await axiosInstance.get("manage/subjects");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching subjects: ", error);

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

// Hàm lấy thông tin môn học theo ID
export async function GetSubjectById(id: string) {
  try {
    const response = await axiosInstance.get(`manage/subjects/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching subject: ", error);

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

// Hàm tạo môn học
export async function CreateSubject(data: {
  name: string;
  description: string;
  status: boolean;
}) {
  try {
    console.log("Sending subject data to API:", JSON.stringify(data, null, 2));
    const response = await axiosInstance.post("/manage/subjects", data);
    return response.data;
  } catch (error: any) {
    console.error("Error creating subject:", error);
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

// Hàm cập nhật môn học
export async function UpdateSubject(
  id: string,
  data: {
    name: string;
    description: string;
    status: boolean;
  }
) {
  try {
    console.log("Updating subject:", id, JSON.stringify(data, null, 2));
    const response = await axiosInstance.put(`/manage/subjects/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error("Error updating subject:", error);
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

// Hàm xóa môn học
export async function DeleteSubject(id: string) {
  try {
    console.log("Deleting subject:", id);
    const response = await axiosInstance.delete(`/manage/subjects/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("Error deleting subject:", error);
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
