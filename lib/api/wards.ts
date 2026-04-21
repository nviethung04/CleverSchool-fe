// import { console } from "inspector";
import axiosInstance from "./axios"

// Hàm lấy danh sách xã/phường theo tỉnh
export async function GetWardList(provinceCode: string) {
    try {
        const response = await axiosInstance.get(`/manage/provinces/${provinceCode}/wards`, {
            headers: {
                "ngrok-skip-browser-warning": "true",
            },
            timeout: 10000, // 10 seconds timeout
        })

        if (!response.data) {
            throw new Error("No data received from API")
        }

        return response.data
    } catch (error: any) {
        console.error("Error fetching ward list:", error)

        // Log chi tiết lỗi
        if (error.response) {
            console.error("Response data:", error.response.data)
            console.error("Response status:", error.response.status)
            console.error("Response headers:", error.response.headers)
        } else if (error.request) {
            console.error("No response received:", error.request)
        } else {
            console.error("Error setting up request:", error.message)
        }

        // Return empty data structure to prevent undefined errors
        return {
            data: {
                wards: [],
            },
        }
    }
}

// Hàm lấy danh sách tất cả xã/phường (nếu cần)
export async function GetAllWards() {
    try {
        const response = await axiosInstance.get("/manage/wards", {
            headers: {
                "ngrok-skip-browser-warning": "true",
            },
            timeout: 10000,
        })

        if (!response.data) {
            throw new Error("No data received from API")
        }

        return response.data
    } catch (error: any) {
        console.error("Error fetching all wards:", error)

        if (error.response) {
            console.error("Response data:", error.response.data)
            console.error("Response status:", error.response.status)
            console.error("Response headers:", error.response.headers)
        } else if (error.request) {
            console.error("No response received:", error.request)
        } else {
            console.error("Error setting up request:", error.message)
        }

        return {
            data: {
                wards: [],
            },
        }
    }
}
