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
import { logoutFn } from "@/lib/context/auth-context";

const baseURL = `/api`;

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
