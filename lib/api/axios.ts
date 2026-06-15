declare global {
  interface Window {
    __showingKickedPopup?: boolean;
    showToast?: (options: {
      title: string;
      description: string;
      status?: string;
      duration?: number;
      onClose?: () => void;
    }) => void;
  }
}
import axios from "axios";
import type { AxiosRequestConfig } from "axios";
import { logoutFn } from "@/lib/context/auth-context";

const baseURL = `/api`;

export function getDirectApiBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  return "http://localhost:8080/api";
}

export function getAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
    Token: token,
  };
}

/** Let the browser set multipart boundary; axios instance defaults to application/json. */
export const multipartUploadOptions = (
  timeoutMs = 10 * 60 * 1000
): AxiosRequestConfig => ({
  timeout: timeoutMs,
  transformRequest: [
    (data, headers) => {
      if (typeof FormData !== "undefined" && data instanceof FormData) {
        delete headers["Content-Type"];
      }
      return data;
    },
  ],
});

/** Upload large files directly to the API server (bypasses Next.js rewrite proxy). */
export async function postMultipartUpload(
  formData: FormData,
  endpoint = "/upload-file"
) {
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${getDirectApiBaseUrl()}${path}`;

  const response = await fetch(url, {
    method: "POST",
    body: formData,
    headers: getAuthHeaders(),
    credentials: "include",
  });

  let data: unknown = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = text ? { message: text } : null;
  }

  if (!response.ok) {
    const message =
      (data as { message?: string })?.message ||
      `Upload failed (${response.status})`;
    const error = new Error(message) as Error & {
      response?: { status: number; data: unknown };
    };
    error.response = { status: response.status, data };
    throw error;
  }

  return {
    data,
    status: response.status,
    headers: response.headers,
  };
}

// Update the axios instance to include the Type: json header
const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Thêm interceptor để xử lý token (chỉ đọc, không tự động lưu)
axiosInstance.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // Nếu có token, thêm vào header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;

      // Chỉ thêm header Token cho các API khác ngoài API login
      if (!config.url?.includes("/login")) {
        config.headers.Token = token;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Thêm interceptor để xử lý response
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Xử lý lỗi TOKEN_KICKED (bị đăng nhập thiết bị khác)
    const data = error?.response?.data;
    if (
      data?.code === "TOKEN_KICKED" &&
      typeof window !== "undefined" &&
      !window.__showingKickedPopup
    ) {
      window.__showingKickedPopup = true;
      // Hiển thị popup thông báo
      if (window.showToast) {
        window.showToast({
          title: "Thông báo",
          description:
            "Tài khoản của bạn đã được đăng nhập trên thiết bị khác!",
          status: "error",
          duration: 5000,
        });
      } else {
        alert("Tài khoản của bạn đã được đăng nhập trên thiết bị khác!");
      }
      // Logout ngay lập tức
      localStorage.removeItem("token");
      window.location.href = "/login";
      // Không reset flag về false, chỉ reload mới reset
    }
    // Xử lý lỗi 401 (Unauthorized)
    const status = error?.response?.status || error?.response?.data?.code;

    if (status === 401) {
      // Kiểm tra xem có đang ở trang login không
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.includes("/login")
      ) {
        logoutFn?.();
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
