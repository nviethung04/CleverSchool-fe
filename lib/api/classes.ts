import axiosInstance from "./axios";

function prepareClassPayload(data: any) {
  const payload = { ...data };
  const gradeIdCandidate =
    data?.grade_id ?? data?.gradeId ?? data?.grade?.id ?? data?.grade?.grade_id;

  if (
    gradeIdCandidate === undefined ||
    gradeIdCandidate === null ||
    gradeIdCandidate === "" ||
    gradeIdCandidate === 0 ||
    gradeIdCandidate === "0"
  ) {
    delete payload.grade_id;
    delete payload.gradeId;
    return payload;
  }

  const numericGradeId = Number(gradeIdCandidate);
  if (!Number.isNaN(numericGradeId) && numericGradeId === 0) {
    delete payload.grade_id;
    delete payload.gradeId;
    return payload;
  }

  payload.grade_id = Number.isNaN(numericGradeId)
    ? gradeIdCandidate
    : numericGradeId;

  return payload;
}

// Hàm tạo lớp học
export async function CreateClass(data: any) {
  try {
    console.log("Sending class data to API:", JSON.stringify(data, null, 2));
    const response = await axiosInstance.post(
      "/manage/classes",
      prepareClassPayload(data)
    );
    return response.data;
  } catch (error: any) {
    console.error("Error creating class:", error);
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

// Hàm lấy danh sách lớp học theo school_id
export async function GetClassList(
  school_id?: string,
  params?: {
    page?: number;
    per_page?: number;
  }
) {
  try {
    const requestParams: any = {};
    if (school_id) requestParams.school_id = school_id;
    if (params?.page) requestParams.page = params.page;
    if (params?.per_page) requestParams.per_page = params.per_page;

    const response = await axiosInstance.get("/manage/classes", {
      params: requestParams,
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching class list:", error);
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

// Hàm xóa lớp học
export async function DeleteClass(classId: string) {
  try {
    const response = await axiosInstance.delete(`/manage/classes/${classId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error deleting class:", error);
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

// Hàm cập nhật lớp học
export async function UpdateClass(classId: string, data: any) {
  try {
    console.log("Updating class:", classId, JSON.stringify(data, null, 2));
    const response = await axiosInstance.put(
      `/manage/classes/${classId}`,
      prepareClassPayload(data)
    );
    return response.data;
  } catch (error: any) {
    console.error("Error updating class:", error);
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

// Hàm lấy chi tiết lớp học
export async function GetClassDetail(classId: string) {
  try {
    const response = await axiosInstance.get(`/manage/classes/${classId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching class detail:", error);
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

// Hàm thêm học sinh vào lớp
export async function AddStudentsToClass(
  classId: string,
  studentIds: string[]
) {
  try {
    console.log("Adding students to class:", classId, studentIds);
    const response = await axiosInstance.post(
      `/manage/classes/${classId}/students`,
      {
        student_ids: studentIds,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error adding students to class:", error);
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
