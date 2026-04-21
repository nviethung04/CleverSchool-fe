import axiosInstance from "./axios";

export async function GetFeedbackList(
  page = 1,
  limit = 10,
  order_by?: "newest" | "oldest",
  role_id?: "student" | "teacher" | "admin" | "all" | "1" | "2" | "3",
  status?: "pending" | "completed" | "all" | "1" | "2",
  start_date?: string,
  end_date?: string
) {
  const params: any = { page, limit };

  if (order_by) params.order_by = order_by;
  if (role_id && role_id !== "all") params.role_id = role_id;
  if (status && status !== "all") params.status = status;
  if (start_date) params.start_date = start_date;
  if (end_date) params.end_date = end_date;

  const res = await axiosInstance.get("/manage/feedbacks", { params });
  return res.data;
}

export async function CreateFeedback(data: any) {
  try {
    const response = await axiosInstance.post("/manage/feedbacks", data);
    return response.data;
  } catch (error: any) {
    console.error("Error creating feedback:", error);

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

export async function getFeedbackDetail(id: string | number) {
  try {
    const res = await axiosInstance.get(`/manage/feedbacks/${id}`);
    return res.data;
  } catch (error: any) {
    console.error("Error getting feedback detail:", error);
    throw error;
  }
}

export async function updateFeedbackStatus(
  id: string | number,
  status: number
) {
  try {
    const response = await axiosInstance.put(`/manage/feedbacks/${id}`, {
      status: status,
    });
    return response.data;
  } catch (error: any) {
    console.error("Error updating feedback status:", error);
    throw error;
  }
}

export async function UpdateFeedback(feedbackId: string, data: any) {
  try {
    const response = await axiosInstance.put(
      `/manage/feedbacks/${feedbackId}`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error("Error updating feedback:", error);

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

// export async function DeleteFeedback(feedbackId: string) {
//     try {
//         const response = await axiosInstance.delete(`/manage/feedbacks/${feedbackId}`);
//         return response.data;
//     } catch (error: any) {
//         console.error("Error deleting feedback:", error);

//         if (error.response) {
//             console.error("Response data:", error.response.data);
//         } else if (error.request) {
//             console.error("No response received:", error.request);
//         } else {
//             console.error("Error setting up request:", error.message);
//         }
//         throw error;
//     }
// }
