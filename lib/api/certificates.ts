import axiosInstance from "./axios";


export async function DeleteCertificate(cerId: string) {
    try {
        const response = await axiosInstance.delete(`/manage/certificates/${cerId}`);
        return response.data;
    } catch (error: any) {
        console.error("Error deleting certificate:", error);

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

// Hàm cập nhật thông tin chứng chỉ
export async function UpdateCertificates(cerId: string, data: any) {
    try {
        const response = await axiosInstance.put(`/manage/certificates/${cerId}`, data);
        return response.data;
    } catch (error: any) {
        console.error("Error updating certificate:", error);

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

// Hàm xóa bằng cấp
export async function DeleteDegree(degreeId: string) {
    try {
        const response = await axiosInstance.delete(`/manage/degrees/${degreeId}`);
        return response.data;
    } catch (error: any) {
        console.error("Error deleting degree:", error);

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

// Hàm cập nhật thông tin chứng chỉ
export async function UpdateDegrees(degreeId: string, data: any) {
    try {
        const response = await axiosInstance.put(`/manage/degrees/${degreeId}`, data);
        return response.data;
    } catch (error: any) {
        console.error("Error updating degree:", error);

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

export async function AddCertificate(userId: string, data: any) {
    try {
        console.log("Adding certificate for user:", userId, JSON.stringify(data, null, 2));

        // Gọi API tạo chứng chỉ trực tiếp với data đã được chuẩn bị từ form
        const response = await axiosInstance.post("/manage/certificates", data);

        console.log("Certificate created successfully:", response.data);
        return response.data;
    } catch (error: any) {
        console.error("Error adding certificate:", error);

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

// Hàm thêm bằng cấp mới
export async function AddDegree(userId: string, data: any) {
    try {
        console.log("Adding degree for user:", userId, JSON.stringify(data, null, 2));

        // Gọi API tạo bằng cấp trực tiếp với data đã được chuẩn bị từ form
        const response = await axiosInstance.post("/manage/degrees", data);

        console.log("Degree created successfully:", response.data);
        return response.data;
    } catch (error: any) {
        console.error("Error adding degree:", error);

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