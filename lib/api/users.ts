import axiosInstance from "./axios";

// Hàm gọi API tạo người dùng
export async function CreateUser(data: any) {
  try {

    const response = await axiosInstance.post("/manage/users", data);

    return response.data;
  } catch (error: any) {
    console.error("Error creating user:", error);

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

// Hàm lấy danh sách người dùng
export async function GetUserList(
  role_id?: number,
  school_id?: number,
  pagination?: { page?: number; per_page?: number; keyword?: string }
) {
  try {
    const params: any = {};
    if (role_id !== undefined) params.role_id = role_id;
    if (school_id !== undefined) params.school_id = school_id;

    // Thêm pagination params
    if (pagination) {
      if (pagination.page !== undefined) params.page = pagination.page;
      if (pagination.per_page !== undefined)
        params.per_page = pagination.per_page;
      if (pagination.keyword !== undefined && pagination.keyword !== "")
        params.keyword = pagination.keyword;
    }

    const response = await axiosInstance.get("/manage/users", {
      params,
    });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching user list:", error);

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

// Hàm xóa người dùng theo ID
export async function DeleteUser(userId: string) {
  try {
    const response = await axiosInstance.delete(`/manage/users/${userId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error deleting user:", error);

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

export async function GetDetailUser(userId: string) {
  try {
    const response = await axiosInstance.get(`/manage/users/${userId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error deleting user:", error);

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

// Hàm cập nhật thông tin người dùng
export async function UpdateUser(userId: string, data: any) {
  try {
    console.log("Updating user:", userId, JSON.stringify(data, null, 2));

    const response = await axiosInstance.put(`/manage/users/${userId}`, data);

    return response.data;
  } catch (error: any) {
    console.error("Error updating user:", error);

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

// Hàm lấy thông tin tài khoản đang đăng nhập
export async function GetUserLogin() {
  try {
    const response = await axiosInstance.get(`/manage/profile`);
    return response.data;
  } catch (error: any) {
    console.error("Error updating user:", error);
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

//hàm đổi thông tin tài khoản đang đăng nhập
export async function UpdateUserLogin(data: any) {
  try {
    console.log("Updating user login data:", JSON.stringify(data, null, 2));

    const response = await axiosInstance.put(`/manage/profile`, data);

    return response.data;
  } catch (error: any) {
    console.error("Error updating user login:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
      // Hiển thị thông báo lỗi từ API nếu có
      throw new Error(
        error.response.data?.message || "Có lỗi xảy ra khi cập nhật thông tin."
      );
    } else if (error.request) {
      console.error("No response received:", error.request);

      // Hiển thị thông báo lỗi khi không nhận được phản hồi từ server
      throw new Error("Không thể kết nối đến server. Vui lòng thử lại sau.");
    } else {
      console.error("Error setting up request:", error.message);

      // Hiển thị thông báo lỗi chung
      throw new Error(error.message || "Có lỗi xảy ra. Vui lòng thử lại sau.");
    }
  }
}

// Hàm đổi mật khẩu người dùng
export async function ChangePassword(data: {
  old_password: string;
  new_password: string;
  confirm_password: string;
}) {
  try {
    const response = await axiosInstance.put(`/change-password`, data);
    return response.data;
  } catch (error: any) {
    console.error("Error changing password:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
      throw new Error(
        error.response.data?.message || "Có lỗi xảy ra khi đổi mật khẩu."
      );
    } else if (error.request) {
      console.error("No response received:", error.request);
      throw new Error("Không thể kết nối đến server. Vui lòng thử lại sau.");
    } else {
      console.error("Error setting up request:", error.message);
      throw new Error(error.message || "Có lỗi xảy ra. Vui lòng thử lại sau.");
    }
  }
}

// Kiểm tra username đã tồn tại chưa
export async function CheckUsernameExists(username: string) {
  try {
    console.log("Checking if username exists:", username);
    const response = await axiosInstance.get(
      `/manage/users/username-exists/${encodeURIComponent(username)}`
    );
    return response.data;
  } catch (error: any) {
    console.error("Error checking username exists:", error);
    throw error;
  }
}

// Lấy danh sách người dùng nâng cao
export async function GetUserListAdvanced(params: {
  province_code?: string;
  district_code?: string;
  ward_code?: string;
  status?: string;
  keyword?: string;
  role_id?: number | string;
  school_id?: number | string;
  course_id?: number | string;
  class_id?: number | string;
  page?: number;
  per_page?: number;
  is_used?: boolean | string; // Thêm filter cho trạng thái đã đăng nhập
}) {
  try {
    // Apply smart filtering logic - Priority: School > Ward > Province
    const optimizedParams: any = {
      role_id: params.role_id,
      page: params.page,
      per_page: params.per_page
    };

    // Add independent filters
    if (params.keyword) optimizedParams.keyword = params.keyword;
    if (params.status !== undefined && params.status !== 'all') optimizedParams.status = params.status;
    if (params.is_used !== undefined) optimizedParams.is_used = params.is_used;

    // Smart location filtering - only use the most specific location parameter
    if (params.school_id && params.school_id !== 'all') {
      // If school_id exists, use only school_id (ignore province_code and ward_code)
      optimizedParams.school_id = params.school_id;
    } else if (params.ward_code) {
      // If ward_code exists but no school_id, use only ward_code (ignore province_code)
      optimizedParams.ward_code = params.ward_code;
    } else if (params.province_code) {
      // If only province_code exists, use province_code
      optimizedParams.province_code = params.province_code;
    }

    // Add other filters
    if (params.course_id && params.course_id !== 'all') optimizedParams.course_id = params.course_id;
    if (params.class_id && params.class_id !== 'all') optimizedParams.class_id = params.class_id;

    const response = await axiosInstance.get("/manage/users", {
      params: optimizedParams,
    });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching user list:", error);

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

// Thêm học sinh vào lớp
export async function AddStudentsToClass(data: {
  class_id: number;
  student_ids: number[];
}) {
  try {
    const response = await axiosInstance.put(
      "/manage/class/user-relation",
      data
    );
    return response.data;
  } catch (error: any) {
    console.error("Error adding students to class:", error);

    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
      throw new Error(
        error.response.data?.message ||
        "Có lỗi xảy ra khi thêm học sinh vào lớp."
      );
    } else if (error.request) {
      console.error("No response received:", error.request);
      throw new Error("Không thể kết nối đến server. Vui lòng thử lại sau.");
    } else {
      console.error("Error setting up request:", error.message);
      throw new Error(error.message || "Có lỗi xảy ra. Vui lòng thử lại sau.");
    }
  }
}

// Hàm xuất PDF danh sách người dùng theo trường và lớp
export async function exportUserPdf(params: {
  school_id: number | string;
  class_id: number | string;
}) {
  try {
    console.log("📄 Exporting user PDF with params:", JSON.stringify(params, null, 2));

    const response = await axiosInstance.get("/manage/users/export-pdf", {
      params: {
        school_id: params.school_id,
        class_id: params.class_id,
      },
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
      responseType: 'blob', // Nhận dữ liệu binary
    });

    console.log("✅ PDF export response received as blob");

    // Tạo blob URL từ dữ liệu binary
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);

    return { blob, url };
  } catch (error: any) {
    console.error("❌ Error exporting PDF:", error);

    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
      throw new Error(
        error.response.data?.message ||
        "Có lỗi xảy ra khi xuất PDF danh sách người dùng."
      );
    } else if (error.request) {
      console.error("No response received:", error.request);
      throw new Error("Không thể kết nối đến server. Vui lòng thử lại sau.");
    } else {
      console.error("Error setting up request:", error.message);
      throw new Error(error.message || "Có lỗi xảy ra. Vui lòng thử lại sau.");
    }
  }
}

// Hàm reset mật khẩu người dùng về mặc định
export async function ResetUserPassword(userId: string) {
  try {
    console.log("🔄 Resetting password for user ID:", userId);

    const response = await axiosInstance.put(`/manage/users/${userId}/reset-password`);

    console.log("✅ Password reset response:", response.data);

    if (response.data.code === 200) {
      return response.data;
    } else {
      throw new Error(
        response.data.message || "Có lỗi xảy ra khi reset mật khẩu."
      );
    }
  } catch (error: any) {
    console.error("❌ Error resetting password:", error);

    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
      throw new Error(
        error.response.data?.message ||
        "Có lỗi xảy ra khi reset mật khẩu người dùng."
      );
    } else if (error.request) {
      console.error("No response received:", error.request);
      throw new Error("Không thể kết nối đến server. Vui lòng thử lại sau.");
    } else {
      console.error("Error setting up request:", error.message);
      throw new Error(error.message || "Có lỗi xảy ra. Vui lòng thử lại sau.");
    }
  }
}

/**
 * Get browser type from user agent
 */
function getBrowserType(): string {
  if (typeof window === "undefined") return "unknown";

  const userAgent = window.navigator.userAgent.toLowerCase();

  if (userAgent.indexOf("firefox") > -1) return "firefox";
  if (userAgent.indexOf("edg") > -1) return "edge";
  if (userAgent.indexOf("chrome") > -1) return "chrome";
  if (userAgent.indexOf("safari") > -1) return "safari";
  if (userAgent.indexOf("opera") > -1 || userAgent.indexOf("opr") > -1) return "opera";

  return "unknown";
}

/**
 * Get app version from package.json or environment
 */
function getAppVersion(): string {
  return process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0";
}

/**
 * Register FCM device token for push notifications
 */
export async function RegisterFCMToken(deviceToken: string) {
  try {
    const response = await axiosInstance.post(
      "/v1/push/devices/register",
      {
        device_token: deviceToken,
      },
      {
        headers: {
          "platform": "web",
          "device_type": getBrowserType(),
          "app_version": getAppVersion(),
        },
      }
    );

    console.log("✅ FCM token registered successfully");
    return response.data;
  } catch (error: any) {
    console.error("❌ Error registering FCM token:", error);

    if (error.response) {
      console.error("Response data:", error.response.data);
      throw new Error(
        error.response.data?.message || "Không thể đăng ký token notification"
      );
    }
    throw error;
  }
}

/**
 * Unregister FCM device token
 */
export async function UnregisterFCMToken(deviceToken: string) {
  try {
    const response = await axiosInstance.post(
      "/v1/push/devices/unregister",
      {
        device_token: deviceToken,
      },
      {
        headers: {
          "platform": "web",
          "device_type": getBrowserType(),
          "app_version": getAppVersion(),
        },
      }
    );

    console.log("✅ FCM token unregistered successfully");
    return response.data;
  } catch (error: any) {
    console.error("❌ Error unregistering FCM token:", error);

    if (error.response) {
      console.error("Response data:", error.response.data);
    }
    throw error;
  }
}


