import axiosInstance from "./axios";
import { unregisterFCMToken } from "@/lib/firebase/messaging";
import type { User } from "../types/auth";

interface LoginResponseNew {
  code: number;
  data: {
    id: number;
    role_id: number;
    school_id: number;
    username: string;
    password: string;
    name: string;
    token: string;
    expires_time: string;
    email: string;
    phone_number: string;
    address: string;
    status: boolean;
    parent_id: number;
    role_name: string;
    role_names: string[]
  };
  message: string;
}

export interface Permission {
  id: number;
  name: string;
  description?: string;
}

export interface RolePermissionsResponse {
  code: number;
  data: {
    id: number;
    name: string;
    permissions: Permission[];
  };
  message: string;
}

export async function getRolePermissions(
  roleId: number | string,
  token?: string
) {
  try {
    const response = await axiosInstance.get<RolePermissionsResponse>(
      `/manage/roles/${roleId}/permissions`,
      {
        headers: {
          Token: `${token || localStorage.getItem("token")}`,
        },
      }
    );
    if (response.data.code === 200 && response.data.data) {
      return response.data.data.permissions;
    } else {
      throw new Error(
        response.data.message || "Không lấy được quyền của vai trò"
      );
    }
  } catch (error: any) {
    console.error("Error fetching role permissions:", error);
    throw error;
  }
}

export const login = async (
  username: string,
  password: string
): Promise<{ token: string; user: User }> => {
  try {
    const response = await axiosInstance.post("login", {
      username,
      password,
    });

    const data = response.data as LoginResponseNew;

    if (data.code === 200 && data.data && data.data.token) {
      // Create a user object from the response data
      const user: User = {
        id: data.data.id,
        username: data.data.username,
        name: data.data.name,
        role_id: data.data.role_id,
        email: data.data.email || "",
        type: data.data.role_name as "student" | "teacher" | "admin",
        sub_type: data.data.role_names[0]
      };

      return { token: data.data.token, user };
    } else {
      throw new Error(
        "Login failed: " + (data.message || "Invalid response format")
      );
    }
  } catch (error: any) {
    // Nếu là lỗi từ axios, trả về nguyên object để frontend lấy được response.data.error
    if (error.response && error.response.data) {
      throw error;
    }
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("An unknown error occurred");
  }
};

export const apiLogoutServer = async () => {
  try {
    // Unregister FCM token before logout - DISABLED
    // await unregisterFCMToken();

    await axiosInstance.post("/logout");
  } catch (e) {
    // ignore error
  }
};

export const logout = (): void => {
  // Unregister FCM token - DISABLED
  // unregisterFCMToken().catch(console.error);

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
};

export const getCurrentUser = (): User | null => {
  // Check localStorage first, then sessionStorage
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      return JSON.parse(userStr) as User;
    } catch (error) {
      return null;
    }
  }
  return null;
};

// Forgot Password interfaces
interface ForgotPasswordResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    success: boolean;
    message: string;
  };
  error: string;
}

// Reset Password interfaces
interface ResetPasswordResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    success: boolean;
    message: string;
  };
  error: string;
}

export const forgotPassword = async (username: string): Promise<string> => {
  try {
    const response = await axiosInstance.post<ForgotPasswordResponse>(
      "/forgot-password",
      {
        username,
      }
    );

    const data = response.data;

    if (data.code === 200 && data.data && data.data.success) {
      return data.data.message;
    } else {
      throw new Error(
        data.message || "Có lỗi xảy ra khi gửi yêu cầu đặt lại mật khẩu"
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Có lỗi xảy ra khi gửi yêu cầu đặt lại mật khẩu");
  }
};

export const resetPassword = async (
  token: string,
  newPassword: string,
  confirmPassword: string
): Promise<string> => {
  try {
    const response = await axiosInstance.post<ResetPasswordResponse>(
      "/reset-password",
      {
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }
    );

    const data = response.data;

    if (data.code === 200 && data.data && data.data.success) {
      return data.data.message;
    } else {
      throw new Error(data.message || "Có lỗi xảy ra khi đặt lại mật khẩu");
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Có lỗi xảy ra khi đặt lại mật khẩu");
  }
};

// Register interfaces
interface RegisterResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    id: string;
    user_info: {
      school: any;
      class: any;
      courses: any[];
      address: any;
      role: {
        id: string;
        name: string;
      };
      certificates: any[];
      degrees: any[];
      departments: any[];
      positions: any[];
      subjects: any[];
    };
    username: string;
    name: string;
    address: string;
    email: string;
    phone_number: string;
    status: boolean;
    parent_id: string;
    role_name: string;
    password: string;
    role_id: string;
    avatar: string;
    date_of_birth: string;
    created_at: string;
    updated_at: string;
  };
  error: string;
}

export const register = async (
  fullName: string,
  email: string,
  phoneNumber: string,
  roleId: string
): Promise<string> => {
  try {
    const response = await axiosInstance.post<RegisterResponse>("/register", {
      full_name: fullName,
      email,
      phone_number: phoneNumber,
      role_id: roleId,
    });

    const data = response.data;

    if (data.code === 200 && data.data && data.data.id) {
      return "Đăng ký tài khoản thành công! Vui lòng đăng nhập để tiếp tục.";
    } else {
      throw new Error(
        data.message || data.error || "Có lỗi xảy ra khi đăng ký tài khoản"
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Có lỗi xảy ra khi đăng ký tài khoản");
  }
};
