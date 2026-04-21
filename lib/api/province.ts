import axiosInstance from "./axios";

export async function GetProvince() {
    try {
        const response = await axiosInstance.get("manage/provinces")
        return response.data;
    } catch (error: any) {
        console.error("Error fetching provinces: ", error);

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

export async function GetDistricts(province_code: string) {
    try {
        const response = await axiosInstance.get("manage/districts", {
            params: { province_code }
        })
        return response.data
    } catch (error:any) {
        console.error("Error fetching districts: ", error)

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