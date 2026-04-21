// import { console } from "inspector";
import axiosInstance from "./axios"

// Hàm gọi API tạo trường
export async function CreateSchool(data: any) {
    try {
        // Log dữ liệu gửi đi để debug
        console.log("Sending data to API:", JSON.stringify(data, null, 2))

        // Sử dụng axios instance đã được cấu hình với token
        const response = await axiosInstance.post("/manage/schools", data)

        return response.data
    } catch (error: any) {
        console.error("Error creating school:", error)

        // Log thêm thông tin chi tiết về lỗi
        if (error.response) {
            // Server trả về response với status code nằm ngoài range 2xx
            console.error("Response data:", error.response.data)
            console.error("Response status:", error.response.status)
            console.error("Response headers:", error.response.headers)
        } else if (error.request) {
            // Request đã được gửi nhưng không nhận được response
            console.error("No response received:", error.request)
        } else {
            // Có lỗi khi thiết lập request
            console.error("Error setting up request:", error.message)
        }

        throw error
    }
}

// Hàm lấy danh sách trường học với các tham số lọc và sắp xếp
export async function GetSchoolList(params: {
    province_code?: string
    ward_code?: string // Đổi từ district_code thành ward_code
    name?: string
    type?: string
    status?: string // Thêm tham số status (1, 0)
    sort_id?: "asc" | "desc" // Thêm tham số sort_id
    sort_created_at?: "newest" | "oldest" // Thêm tham số sort_created_at
    limit?: number
    page?: number
}) {
    try {
        const response = await axiosInstance.get("/manage/schools", {
            headers: {
                "ngrok-skip-browser-warning": "true",
            },
            params,
        })

        console.log("Full thông tin trường học from API:", response.data)
        return response.data
    } catch (error: any) {
        console.error("Error fetching school list:", error)

        if (error.response) {
            console.error("Response data:", error.response.data)
            console.error("Response status:", error.response.status)
            console.error("Response headers:", error.response.headers)
        } else if (error.request) {
            console.error("No response received:", error.request)
        } else {
            console.error("Error setting up request:", error.message)
        }
        throw error
    }
}

export async function DeleteSchool(schoolId: string) {
    try {
        const response = await axiosInstance.delete(`/manage/schools/${schoolId}`)
        return response.data
    } catch (error: any) {
        console.error("Error deleting school:", error)

        if (error.response) {
            console.error("Response data:", error.response.data)
            console.error("Response status:", error.response.status)
            console.error("Response headers:", error.response.headers)
        } else if (error.request) {
            console.error("No response received:", error.request)
        } else {
            console.error("Error setting up request:", error.message)
        }
        throw error
    }
}

// Hàm cập nhật thông tin trường học
export async function UpdateSchool(schoolId: string, data: any) {
    try {
        console.log("Updating school with ID:", schoolId)
        console.log("Updated data:", JSON.stringify(data, null, 2))

        const response = await axiosInstance.put(`/manage/schools/${schoolId}`, data)
        return response.data
    } catch (error: any) {
        console.error("Error updating school:", error)

        if (error.response) {
            console.error("Response data:", error.response.data)
            console.error("Response status:", error.response.status)
            console.error("Response headers:", error.response.headers)
        } else if (error.request) {
            console.error("No response received:", error.request)
        } else {
            console.error("Error setting up request:", error.message)
        }
        throw error
    }
}

// Hàm lấy thông tin chi tiết trường học
export async function GetSchoolDetail(schoolId: string) {
    try {
        console.log("Fetching school detail for ID:", schoolId)

        const response = await axiosInstance.get(`/manage/schools/${schoolId}`, {
            headers: {
                "ngrok-skip-browser-warning": "true",
            },
        })

        return response.data.data
    } catch (error: any) {
        console.error("Error fetching school detail:", error)

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
        throw error
    }
}
