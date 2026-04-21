// src/api/permissions.ts

import axiosInstance from "./axios";

// Hàm lấy danh sách tỉnh
export async function GetProvinceList() {
    try {
        const timestamp = Date.now(); // tham số chống cache
        const response = await axiosInstance.get(`/manage/provinces?_=${timestamp}`, {
            headers: {
                "ngrok-skip-browser-warning": "true",
            },
            timeout: 1000, // Thêm timeout 10 giây
        });

        if (!response.data) {
            throw new Error("No data received from API");
        }

        return response.data;
    } catch (error: any) {
        console.error("Error fetching province list:", error);

        // Xử lý các loại lỗi khác nhau
        if (error.response) {
            // Lỗi từ server (status code không phải 2xx)
            console.error("Server error:", {
                status: error.response.status,
                data: error.response.data,
            });
            throw new Error(`Server error: ${error.response.status}`);
        } else if (error.request) {
            // Không nhận được phản hồi từ server
            console.error("No response received from server");
            throw new Error("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.");
        } else {
            // Lỗi khi thiết lập request
            console.error("Request setup error:", error.message);
            throw new Error(`Lỗi kết nối: ${error.message}`);
        }
    }
}
